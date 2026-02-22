import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
  isNonNegativeNumber,
} from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "receiving:qc_inspect"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await request.json();
    const { qcResult, lines, notes } = body as {
      qcResult: "ACCEPTED" | "PARTIAL" | "REJECTED";
      lines: {
        id: string;
        acceptedQty: number;
        rejectedQty: number;
        notes?: string;
      }[];
      notes?: string;
    };

    if (
      !qcResult ||
      !["ACCEPTED", "PARTIAL", "REJECTED"].includes(qcResult)
    ) {
      return apiError(
        "Valid QC result is required (ACCEPTED, PARTIAL, REJECTED)"
      );
    }
    if (!lines || !Array.isArray(lines) || lines.length === 0)
      return apiError("Line item inspection results are required");

    // Validate quantity values are non-negative numbers
    for (const line of lines) {
      if (!isNonNegativeNumber(line.acceptedQty))
        return apiError("Accepted quantity must be a non-negative number");
      if (!isNonNegativeNumber(line.rejectedQty))
        return apiError("Rejected quantity must be a non-negative number");
    }

    // Fetch the receiving record
    const receiving = await prisma.receiving.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { lines: true },
    });

    if (!receiving) return apiError("Receiving record not found", 404);
    if (receiving.status !== "PROC_VERIFIED") {
      return apiError(
        "Receiving must be in Procurement Verified status for QC inspection"
      );
    }

    // Segregation of duties: QC user must NOT be the procurement verifier
    if (receiving.procVerifiedById === user.id) {
      return apiError(
        "You cannot inspect a receiving that you verified (segregation of duties)"
      );
    }

    // Validate line quantities
    let totalAccepted = 0;
    for (const line of lines) {
      const recLine = receiving.lines.find((rl) => rl.id === line.id);
      if (!recLine) return apiError(`Receiving line ${line.id} not found`);
      if (line.acceptedQty + line.rejectedQty !== recLine.receivedQty) {
        return apiError(
          `Accepted (${line.acceptedQty}) + Rejected (${line.rejectedQty}) must equal Received (${recLine.receivedQty}) for each line`
        );
      }
      totalAccepted += line.acceptedQty;
    }

    // Validate PARTIAL/ACCEPTED has at least some accepted items
    if (qcResult === "ACCEPTED" && totalAccepted === 0) {
      return apiError(
        "Cannot mark as ACCEPTED when no items are accepted. Use REJECTED instead."
      );
    }
    if (qcResult === "PARTIAL" && totalAccepted === 0) {
      return apiError(
        "Cannot mark as PARTIAL when no items are accepted. Use REJECTED instead."
      );
    }

    const newStatus =
      qcResult === "REJECTED" ? "QC_REJECTED" : "QC_APPROVED";

    // Update receiving and lines
    const updated = await prisma.$transaction(async (tx) => {
      // Update each line
      for (const line of lines) {
        await tx.receivingLine.update({
          where: { id: line.id },
          data: {
            acceptedQty: line.acceptedQty,
            rejectedQty: line.rejectedQty,
            notes: line.notes,
          },
        });
      }

      // Update receiving header
      return tx.receiving.update({
        where: { id },
        data: {
          status: newStatus,
          qcInspectedById: user.id,
          qcInspectedAt: new Date(),
          qcNotes: notes,
          qcResult,
        },
        include: {
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true,
              supplier: { select: { id: true, name: true, code: true } },
            },
          },
          procVerifiedBy: { select: { id: true, fullName: true } },
          qcInspectedBy: { select: { id: true, fullName: true } },
          lines: {
            include: {
              item: {
                select: { id: true, code: true, name: true, uom: true },
              },
            },
          },
        },
      });
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "receiving:qc_inspect",
      entityType: "Receiving",
      entityId: id,
      beforeData: { status: "PROC_VERIFIED" },
      afterData: { status: newStatus, qcResult },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("POST /api/receiving/[id]/qc-inspect error:", e);
    return apiError("Failed to process QC inspection", 500);
  }
}

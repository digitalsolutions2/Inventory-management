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
  if (!checkPermission(user, "requests:confirm"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await request.json();
    const { lines, notes, hasDiscrepancy } = body as {
      lines: {
        id: string;
        confirmedQty: number;
        notes?: string;
      }[];
      notes?: string;
      hasDiscrepancy?: boolean;
    };

    if (!lines || !Array.isArray(lines) || lines.length === 0)
      return apiError("Line item confirmation data is required");

    // Validate quantities
    for (const line of lines) {
      if (!isNonNegativeNumber(line.confirmedQty))
        return apiError(
          "Confirmed quantity must be a non-negative number"
        );
    }

    const req = await prisma.internalRequest.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { lines: true },
    });

    if (!req) return apiError("Request not found", 404);
    if (req.status !== "ISSUED")
      return apiError(
        "Request must be in Issued status for confirmation"
      );

    // Segregation of duties: confirmer should not be the fulfiller
    if (req.fulfilledById === user.id) {
      return apiError(
        "You cannot confirm a request you fulfilled (segregation of duties)"
      );
    }

    // Validate confirmed quantities
    for (const line of lines) {
      const reqLine = req.lines.find((rl) => rl.id === line.id);
      if (!reqLine)
        return apiError(`Request line ${line.id} not found`);
      if (line.confirmedQty > reqLine.issuedQty)
        return apiError(
          `Confirmed qty (${line.confirmedQty}) cannot exceed issued qty (${reqLine.issuedQty})`
        );
    }

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        await tx.internalRequestLine.update({
          where: { id: line.id },
          data: {
            confirmedQty: line.confirmedQty,
            notes: line.notes
              ? `${req.lines.find((rl) => rl.id === line.id)?.notes || ""}\nConfirmation: ${line.notes}`.trim()
              : undefined,
          },
        });
      }

      const discrepancyNote = hasDiscrepancy
        ? " (with discrepancies)"
        : "";
      return tx.internalRequest.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedById: user.id,
          confirmedAt: new Date(),
          notes: notes
            ? req.notes
              ? `${req.notes}\n\nConfirmation${discrepancyNote}: ${notes}`
              : `Confirmation${discrepancyNote}: ${notes}`
            : req.notes,
        },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          fulfilledBy: { select: { id: true, fullName: true } },
          confirmedBy: { select: { id: true, fullName: true } },
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
      action: "request:confirm",
      entityType: "InternalRequest",
      entityId: id,
      beforeData: { status: "ISSUED" },
      afterData: { status: "CONFIRMED", hasDiscrepancy },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error(
      "POST /api/internal-requests/[id]/confirm error:",
      e
    );
    return apiError("Failed to confirm request", 500);
  }
}

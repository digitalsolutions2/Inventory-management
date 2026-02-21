import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status") || "";
  const supplierId = searchParams.get("supplierId") || "";

  const where = {
    tenantId: user.tenantId,
    ...(status && { status: { in: status.split(",") as never[] } }),
    ...(supplierId && {
      purchaseOrder: { supplierId },
    }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            totalAmount: true,
            supplier: { select: { id: true, name: true, code: true } },
          },
        },
        recordedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return apiSuccess({
    data: payments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "payments:write"))
    return apiError("Forbidden", 403);

  const body = await request.json();
  const {
    purchaseOrderId,
    amount,
    dueDate,
    paidAt,
    paymentMethod,
    referenceNumber,
    notes,
  } = body;

  if (!purchaseOrderId) return apiError("Purchase order is required");
  if (!amount || amount <= 0) return apiError("Amount must be positive");

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, tenantId: user.tenantId },
  });
  if (!po) return apiError("Purchase order not found", 404);

  // Check total payments don't exceed PO amount
  const existingPayments = await prisma.payment.aggregate({
    where: { purchaseOrderId, tenantId: user.tenantId },
    _sum: { amount: true },
  });
  const totalPaid = (existingPayments._sum.amount || 0) + amount;
  if (totalPaid > po.totalAmount * 1.1) {
    return apiError(
      `Payment would exceed PO total (${po.totalAmount}). Already paid: ${existingPayments._sum.amount || 0}`
    );
  }

  const status = paidAt ? "PAID" : "PENDING";

  const payment = await prisma.payment.create({
    data: {
      tenantId: user.tenantId,
      purchaseOrderId,
      amount,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      paidAt: paidAt ? new Date(paidAt) : null,
      paymentMethod,
      referenceNumber,
      notes,
      recordedById: user.id,
    },
    include: {
      purchaseOrder: {
        select: {
          id: true,
          poNumber: true,
          supplier: { select: { id: true, name: true } },
        },
      },
      recordedBy: { select: { id: true, fullName: true } },
    },
  });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "payment:create",
    entityType: "Payment",
    entityId: payment.id,
    afterData: { amount, status, purchaseOrderId },
  });

  return apiSuccess(payment, 201);
}

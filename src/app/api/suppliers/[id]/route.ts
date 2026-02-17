import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, checkPermission, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const supplier = await prisma.supplier.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!supplier) return apiError("Supplier not found", 404);
  return apiSuccess(supplier);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "supplier:edit")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.supplier.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Supplier not found", 404);

  const body = await request.json();
  const { name, contactName, email, phone, address, paymentTerms, rating, isActive } = body;

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(contactName !== undefined && { contactName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(paymentTerms !== undefined && { paymentTerms }),
      ...(rating !== undefined && { rating }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return apiSuccess(supplier);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "supplier:delete")) return apiError("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.supplier.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!existing) return apiError("Supplier not found", 404);

  await prisma.supplier.update({
    where: { id },
    data: { isActive: false },
  });

  return apiSuccess({ message: "Supplier deactivated" });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { UserContext } from "@/types";

export async function getCurrentUser(): Promise<UserContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        role: { include: { role: true } },
        tenant: true,
      },
    });

    if (!dbUser || !dbUser.isActive) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      tenantId: dbUser.tenantId,
      tenantName: dbUser.tenant.name,
      role: dbUser.role?.role.name || "user",
      permissions: (dbUser.role?.role.permissions as string[]) || [],
    };
  } catch {
    return null;
  }
}

export function checkPermission(user: UserContext, permission: string): boolean {
  return user.permissions.includes(permission);
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function createAuditLog(params: {
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: unknown;
  afterData?: unknown;
}) {
  try {
    if (!params.tenantId || !params.userId) return;
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeData: params.beforeData ? (params.beforeData as never) : undefined,
        afterData: params.afterData ? (params.afterData as never) : undefined,
      },
    });
  } catch (e) {
    console.error("Failed to create audit log:", e);
  }
}

/** Validate that a value is a positive finite number */
export function isPositiveNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

/** Validate that a value is a non-negative finite number */
export function isNonNegativeNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/** Sanitize pagination params */
export function sanitizePagination(page: string | null, pageSize: string | null) {
  const p = Math.max(1, parseInt(page || "1") || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize || "20") || 20));
  return { page: p, pageSize: ps };
}

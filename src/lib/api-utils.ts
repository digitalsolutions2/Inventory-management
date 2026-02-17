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

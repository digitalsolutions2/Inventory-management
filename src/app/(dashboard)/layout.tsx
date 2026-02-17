import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/components/providers/user-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with role
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      role: {
        include: { role: true },
      },
      tenant: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const userContext = {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    tenantId: dbUser.tenantId,
    tenantName: dbUser.tenant.name,
    role: dbUser.role?.role.name || "user",
    permissions: (dbUser.role?.role.permissions as string[]) || [],
  };

  return (
    <UserProvider userContext={userContext}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar userContext={userContext} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header userContext={userContext} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}

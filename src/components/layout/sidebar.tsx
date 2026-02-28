"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserContext } from "@/types";
import { useTranslation } from "@/lib/i18n";

interface SidebarProps {
  userContext: UserContext;
}

export function Sidebar({ userContext }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navigation: { name: string; href: string; icon: string; permission?: string }[] = [
    { name: t.nav.dashboard, href: "/dashboard", icon: "📊" },
    { name: t.nav.items, href: "/items", icon: "📦" },
    { name: t.nav.locations, href: "/locations", icon: "📍" },
    { name: t.nav.inventory, href: "/inventory", icon: "🗃️" },
    { name: t.nav.suppliers, href: "/suppliers", icon: "🏭" },
    { name: t.nav.purchaseOrders, href: "/procurement", icon: "📋" },
    { name: t.nav.receiving, href: "/receiving", icon: "📥" },
    { name: t.nav.internalRequests, href: "/requests", icon: "📤" },
    { name: t.nav.transfers, href: "/transfers", icon: "🔄" },
    { name: t.nav.storeOrdering, href: "/store/order", icon: "🛒" },
    { name: t.nav.finance, href: "/finance", icon: "💰" },
    { name: t.nav.reports, href: "/reports", icon: "📈" },
    { name: t.nav.foodics, href: "/admin/foodics", icon: "🔗", permission: "foodics:settings" },
    { name: t.nav.users, href: "/admin/users", icon: "👥", permission: "users:read" },
    { name: t.nav.roles, href: "/admin/roles", icon: "🔐", permission: "users:read" },
    { name: t.nav.auditLogs, href: "/admin/audit-logs", icon: "🔍" },
  ];

  return (
    <div className="w-64 bg-white shadow-md flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold text-gray-900">{t.nav.supplyChainERP}</h1>
        <p className="text-xs text-gray-500 mt-1">{userContext.tenantName}</p>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navigation.filter((item) => !item.permission || userContext.permissions.includes(item.permission)).map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="text-sm">
          <p className="font-medium text-gray-900">{userContext.fullName}</p>
          <p className="text-gray-500 text-xs capitalize">{userContext.role}</p>
        </div>
      </div>
    </div>
  );
}

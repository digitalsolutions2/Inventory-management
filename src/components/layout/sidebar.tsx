"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserContext } from "@/types";

interface SidebarProps {
  userContext: UserContext;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Items", href: "/items", icon: "📦" },
  { name: "Locations", href: "/locations", icon: "📍" },
  { name: "Suppliers", href: "/suppliers", icon: "🏭" },
  { name: "Purchase Orders", href: "/procurement", icon: "📋" },
  { name: "Receiving", href: "/receiving", icon: "📥" },
  { name: "Internal Requests", href: "/requests", icon: "📤" },
  { name: "Transfers", href: "/transfers", icon: "🔄" },
  { name: "Store Ordering", href: "/store/order", icon: "🛒" },
  { name: "Finance", href: "/finance", icon: "💰" },
  { name: "Reports", href: "/reports", icon: "📈" },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: "🔍" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
];

export function Sidebar({ userContext }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white shadow-md flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold text-gray-900">Supply Chain ERP</h1>
        <p className="text-xs text-gray-500 mt-1">{userContext.tenantName}</p>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
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

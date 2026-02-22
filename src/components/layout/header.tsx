"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { UserContext } from "@/types";

interface HeaderProps {
  userContext: UserContext;
}

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  procurement: "Purchase Orders",
  create: "Create",
  receiving: "Receiving",
  qc: "QC Inspection",
  warehouse: "Warehouse",
  items: "Items",
  categories: "Categories",
  locations: "Locations",
  suppliers: "Suppliers",
  transfers: "Transfers",
  pending: "Pending Approval",
  fulfill: "Fulfill",
  receive: "Receive",
  requests: "Internal Requests",
  confirm: "Confirm",
  reports: "Reports",
  "inventory-valuation": "Inventory Valuation",
  "purchase-summary": "Purchase Summary",
  "payment-aging": "Payment Aging",
  "transaction-history": "Transaction History",
  "stock-movement": "Stock Movement",
  "supplier-performance": "Supplier Performance",
  finance: "Finance",
  payments: "Payments",
  valuation: "Valuation",
  store: "Store",
  order: "Smart Order",
};

export function Header({ userContext }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Build breadcrumb items from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = [
    {
      title: (
        <a onClick={() => router.push("/dashboard")}>
          <HomeOutlined />
        </a>
      ),
    },
    ...segments.map((segment, index) => {
      const path = "/" + segments.slice(0, index + 1).join("/");
      const isLast = index === segments.length - 1;
      // Skip UUID-like segments in display
      const isId = /^[0-9a-f-]{20,}$/.test(segment);
      const label = isId
        ? "Detail"
        : BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      return {
        title: isLast ? (
          <span>{label}</span>
        ) : (
          <a onClick={() => router.push(path)}>{label}</a>
        ),
      };
    }),
  ];

  return (
    <header className="bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
      <div>
        <Breadcrumb items={breadcrumbItems} className="mb-0.5" />
        <div className="text-xs text-gray-400">{userContext.tenantName}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">
            {userContext.fullName}
          </div>
          <div className="text-xs text-gray-400 capitalize">
            {userContext.role}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

export default function ReceivingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { label: t.receiving.procurementTab, href: "/receiving/procurement" },
    { label: t.receiving.qcTab, href: "/receiving/qc" },
    { label: t.receiving.warehouseTab, href: "/receiving/warehouse" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.receiving.title}</h1>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="border-b px-4 flex gap-1">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

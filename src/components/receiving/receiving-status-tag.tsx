"use client";

import { Tag } from "antd";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: "default", label: "Pending" },
  PROC_VERIFIED: { color: "blue", label: "Procurement Verified" },
  QC_APPROVED: { color: "green", label: "QC Approved" },
  QC_REJECTED: { color: "red", label: "QC Rejected" },
  RECEIVED: { color: "purple", label: "Received" },
  CANCELLED: { color: "default", label: "Cancelled" },
};

export function ReceivingStatusTag({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { color: "default", label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
}

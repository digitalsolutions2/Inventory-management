"use client";

import { Tag } from "antd";
import { useTranslation } from "@/lib/i18n";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "default",
  PROC_VERIFIED: "blue",
  QC_APPROVED: "green",
  QC_REJECTED: "red",
  RECEIVED: "purple",
  CANCELLED: "default",
};

export function ReceivingStatusTag({ status }: { status: string }) {
  const { t } = useTranslation();

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t.receiving.statusLabels.PENDING_QC,
    PROC_VERIFIED: t.receiving.statusLabels.QC_PASSED,
    QC_APPROVED: t.receiving.statusLabels.QC_PASSED,
    QC_REJECTED: t.receiving.statusLabels.QC_FAILED,
    RECEIVED: t.receiving.statusLabels.COMPLETED,
    CANCELLED: t.common.inactive,
  };

  const color = STATUS_COLORS[status] || "default";
  const label = STATUS_LABELS[status] || status;
  return <Tag color={color}>{label}</Tag>;
}

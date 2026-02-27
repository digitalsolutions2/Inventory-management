"use client";

import { Steps } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "@/lib/i18n";

interface ReceivingStepsProps {
  status: string;
  procVerifiedBy?: { fullName: string } | null;
  procVerifiedAt?: string | null;
  qcInspectedBy?: { fullName: string } | null;
  qcInspectedAt?: string | null;
  qcResult?: string | null;
  warehouseReceivedBy?: { fullName: string } | null;
  warehouseReceivedAt?: string | null;
}

function getStepStatus(status: string) {
  switch (status) {
    case "PENDING":
      return { current: 0, statuses: ["process", "wait", "wait"] as const };
    case "PROC_VERIFIED":
      return { current: 1, statuses: ["finish", "process", "wait"] as const };
    case "QC_APPROVED":
      return { current: 2, statuses: ["finish", "finish", "process"] as const };
    case "QC_REJECTED":
      return { current: 1, statuses: ["finish", "error", "wait"] as const };
    case "RECEIVED":
      return { current: 2, statuses: ["finish", "finish", "finish"] as const };
    default:
      return { current: 0, statuses: ["wait", "wait", "wait"] as const };
  }
}

export function ReceivingSteps(props: ReceivingStepsProps) {
  const { current, statuses } = getStepStatus(props.status);
  const { t } = useTranslation();

  const formatDesc = (user?: { fullName: string } | null, date?: string | null, extra?: string) => {
    const parts: string[] = [];
    if (user) parts.push(user.fullName);
    if (date) parts.push(dayjs(date).format("DD MMM YYYY HH:mm"));
    if (extra) parts.push(extra);
    return parts.length > 0 ? parts.join(" · ") : undefined;
  };

  return (
    <Steps
      current={current}
      size="small"
      items={[
        {
          title: t.receiving.steps.receiving,
          status: statuses[0],
          description: formatDesc(props.procVerifiedBy, props.procVerifiedAt),
        },
        {
          title: t.receiving.steps.qcInspection,
          status: statuses[1],
          description: formatDesc(
            props.qcInspectedBy,
            props.qcInspectedAt,
            props.qcResult ? `${t.receiving.qc.qcResult}: ${props.qcResult}` : undefined
          ),
        },
        {
          title: t.receiving.steps.putaway,
          status: statuses[2],
          description: formatDesc(props.warehouseReceivedBy, props.warehouseReceivedAt),
        },
      ]}
    />
  );
}

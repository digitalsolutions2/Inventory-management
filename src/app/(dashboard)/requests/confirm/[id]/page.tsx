"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  InputNumber,
  Input,
  Descriptions,
  Table,
  Alert,
  Spin,
  Checkbox,
  App,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface RequestLine {
  id: string;
  requestedQty: number;
  issuedQty: number;
  confirmedQty: number;
  notes: string | null;
  item: { id: string; code: string; name: string; uom: string };
}

interface RequestDetail {
  id: string;
  requestNumber: string;
  status: string;
  notes: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string };
  fulfilledBy: { id: string; fullName: string } | null;
  fulfilledAt: string | null;
  lines: RequestLine[];
}

interface LineInput {
  id: string;
  confirmedQty: number;
  notes: string;
}

export default function ConfirmRequestPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lineInputs, setLineInputs] = useState<LineInput[]>([]);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/internal-requests/${id}`);
    const json = await res.json();
    if (json.success) {
      setRequest(json.data);
      setLineInputs(
        json.data.lines.map((l: RequestLine) => ({
          id: l.id,
          confirmedQty: l.issuedQty, // Default: confirm all issued
          notes: "",
        }))
      );
    } else {
      message.error(t.requests.confirm.failedToLoad);
    }
    setLoading(false);
  }, [id, message]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const updateLine = (lineId: string, field: string, value: unknown) => {
    setLineInputs((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l))
    );
  };

  // Auto-detect discrepancies
  useEffect(() => {
    if (!request) return;
    const anyMismatch = lineInputs.some((input) => {
      const line = request.lines.find((l) => l.id === input.id);
      return line && input.confirmedQty !== line.issuedQty;
    });
    setHasDiscrepancy(anyMismatch);
  }, [lineInputs, request]);

  const handleSubmit = async () => {
    if (!request) return;

    setSubmitting(true);
    const res = await fetch(`/api/internal-requests/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lineInputs,
        notes: confirmNotes || undefined,
        hasDiscrepancy,
      }),
    });

    const json = await res.json();
    if (json.success) {
      message.success(t.requests.confirm.confirmed);
      router.push("/requests/confirm");
    } else {
      message.error(json.error || t.requests.confirm.failedToConfirm);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!request) {
    return <Alert type="error" title={t.requests.confirm.requestNotFound} showIcon />;
  }

  const columns: ColumnsType<RequestLine> = [
    { title: t.requests.confirm.itemCode, dataIndex: ["item", "code"], width: 120 },
    { title: t.requests.confirm.itemName, dataIndex: ["item", "name"], ellipsis: true },
    { title: t.requests.confirm.uom, dataIndex: ["item", "uom"], width: 70, align: "center" },
    {
      title: t.requests.confirm.requested,
      dataIndex: "requestedQty",
      width: 100,
      align: "right",
    },
    {
      title: t.requests.confirm.issued,
      dataIndex: "issuedQty",
      width: 90,
      align: "right",
    },
    {
      title: t.requests.confirm.receivedQty,
      width: 120,
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return (
          <InputNumber
            min={0}
            max={record.issuedQty}
            value={input?.confirmedQty}
            onChange={(val) => updateLine(record.id, "confirmedQty", val || 0)}
            size="small"
            className="w-full"
          />
        );
      },
    },
    {
      title: t.requests.confirm.match,
      width: 80,
      align: "center",
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return input?.confirmedQty === record.issuedQty ? (
          <span className="text-green-600">{t.common.yes}</span>
        ) : (
          <span className="text-red-600">{t.common.no}</span>
        );
      },
    },
    {
      title: t.requests.confirm.notes,
      width: 180,
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return (
          <Input
            placeholder={t.requests.confirm.discrepancyReason}
            value={input?.notes}
            onChange={(e) => updateLine(record.id, "notes", e.target.value)}
            size="small"
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/requests/confirm")}
      >
        {t.requests.confirm.backToQueue}
      </Button>

      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label={t.requests.confirm.requestNumber}>
          {request.requestNumber}
        </Descriptions.Item>
        <Descriptions.Item label={t.common.status}>{request.status}</Descriptions.Item>
        <Descriptions.Item label={t.requests.confirm.requestedBy}>
          {request.createdBy.fullName}
        </Descriptions.Item>
        <Descriptions.Item label={t.requests.confirm.fulfilledBy}>
          {request.fulfilledBy?.fullName || "-"}
        </Descriptions.Item>
        <Descriptions.Item label={t.requests.confirm.created}>
          {dayjs(request.createdAt).format("DD MMM YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label={t.requests.confirm.fulfilledAt}>
          {request.fulfilledAt
            ? dayjs(request.fulfilledAt).format("DD MMM YYYY HH:mm")
            : "-"}
        </Descriptions.Item>
        {request.notes && (
          <Descriptions.Item label={t.common.notes} span={2}>
            <pre className="whitespace-pre-wrap text-sm">{request.notes}</pre>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">{t.requests.confirm.confirmReceivedItems}</h3>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={request.lines}
          pagination={false}
          size="small"
        />
      </div>

      {hasDiscrepancy && (
        <Alert
          type="warning"
          message={t.requests.confirm.discrepancyDetected}
          description={t.requests.confirm.discrepancyDesc}
          showIcon
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.requests.confirm.confirmationNotes}
        </label>
        <Input.TextArea
          rows={2}
          placeholder={t.requests.confirm.deliveryNotes}
          value={confirmNotes}
          onChange={(e) => setConfirmNotes(e.target.value)}
        />
      </div>

      {hasDiscrepancy && (
        <Checkbox
          checked={hasDiscrepancy}
          disabled
        >
          {t.requests.confirm.reportDiscrepancy}
        </Checkbox>
      )}

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
          loading={submitting}
        >
          {t.requests.confirm.confirmReceipt}
        </Button>
      </div>
    </div>
  );
}

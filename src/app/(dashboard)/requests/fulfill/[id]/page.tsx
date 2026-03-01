"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  InputNumber,
  Input,
  Select,
  Descriptions,
  Table,
  Alert,
  Spin,
  App,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface RequestLine {
  id: string;
  itemId: string;
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
  createdBy: { id: string; fullName: string; email: string };
  fulfilledBy: { id: string; fullName: string } | null;
  fulfilledAt: string | null;
  lines: RequestLine[];
}

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface LineInput {
  id: string;
  issuedQty: number;
  notes: string;
}

export default function FulfillRequestPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const { t } = useTranslation();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locationId, setLocationId] = useState<string>("");
  const [lineInputs, setLineInputs] = useState<LineInput[]>([]);
  const [fulfillNotes, setFulfillNotes] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [reqRes, locRes] = await Promise.all([
      fetch(`/api/internal-requests/${id}`),
      fetch("/api/locations?pageSize=100"),
    ]);
    const reqJson = await reqRes.json();
    const locJson = await locRes.json();

    if (reqJson.success) {
      setRequest(reqJson.data);
      setLineInputs(
        reqJson.data.lines.map((l: RequestLine) => ({
          id: l.id,
          issuedQty: l.requestedQty, // Default: issue full requested qty
          notes: "",
        }))
      );
    } else {
      message.error(t.requests.fulfill.failedToLoad);
    }
    if (locJson.success) {
      setLocations(locJson.data.data || []);
    }
    setLoading(false);
  }, [id, message, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLine = (lineId: string, field: string, value: unknown) => {
    setLineInputs((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async () => {
    if (!request) return;
    if (!locationId) {
      message.error(t.requests.fulfill.selectSourceLocation);
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/internal-requests/${id}/fulfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lineInputs,
        locationId,
        notes: fulfillNotes || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      message.success(t.requests.fulfill.fulfilled);
      router.push("/requests/fulfill");
    } else {
      message.error(json.error || t.requests.fulfill.failedToFulfill);
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
    return <Alert type="error" title={t.requests.fulfill.requestNotFound} showIcon />;
  }

  const isSameUser = request.createdBy.id === user?.id;

  const columns: ColumnsType<RequestLine> = [
    { title: t.requests.fulfill.itemCode, dataIndex: ["item", "code"], width: 120 },
    { title: t.requests.fulfill.itemName, dataIndex: ["item", "name"], ellipsis: true },
    { title: t.requests.fulfill.uom, dataIndex: ["item", "uom"], width: 70, align: "center" },
    {
      title: t.requests.fulfill.requested,
      dataIndex: "requestedQty",
      width: 100,
      align: "right",
    },
    {
      title: t.requests.fulfill.actualQty,
      width: 120,
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return (
          <InputNumber
            min={0}
            max={record.requestedQty}
            value={input?.issuedQty}
            onChange={(val) => updateLine(record.id, "issuedQty", val || 0)}
            disabled={isSameUser}
            size="small"
            className="w-full"
          />
        );
      },
    },
    {
      title: t.requests.fulfill.notes,
      width: 180,
      render: (_, record) => {
        const input = lineInputs.find((l) => l.id === record.id);
        return (
          <Input
            placeholder={t.requests.fulfill.pickNotes}
            value={input?.notes}
            onChange={(e) => updateLine(record.id, "notes", e.target.value)}
            disabled={isSameUser}
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
        onClick={() => router.push("/requests/fulfill")}
      >
        {t.requests.fulfill.backToQueue}
      </Button>

      {isSameUser && (
        <Alert
          type="warning"
          message={t.requests.fulfill.segregationTitle}
          description={t.requests.fulfill.segregationDesc}
          showIcon
        />
      )}

      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label={t.requests.fulfill.requestNumber}>
          {request.requestNumber}
        </Descriptions.Item>
        <Descriptions.Item label={t.common.status}>
          {t.requests.statusLabels[request.status as keyof typeof t.requests.statusLabels] || request.status}
        </Descriptions.Item>
        <Descriptions.Item label={t.requests.fulfill.columns.requestedBy}>
          {request.createdBy.fullName}
        </Descriptions.Item>
        <Descriptions.Item label={t.common.createdAt}>
          {dayjs(request.createdAt).format("DD MMM YYYY HH:mm")}
        </Descriptions.Item>
        {request.notes && (
          <Descriptions.Item label={t.requests.fulfill.requestNotes} span={2}>
            {request.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.requests.fulfill.sourceLocation} *
        </label>
        <Select
          placeholder={t.requests.fulfill.selectWarehouse}
          value={locationId || undefined}
          onChange={setLocationId}
          disabled={isSameUser}
          className="w-full max-w-md"
          showSearch
          optionFilterProp="children"
          options={locations.map((l) => ({
            value: l.id,
            label: `${l.code} - ${l.name} (${l.type})`,
          }))}
        />
      </div>

      <div>
        <h3 className="text-base font-semibold mb-2">{t.requests.fulfill.lineItems}</h3>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={request.lines}
          pagination={false}
          size="small"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.requests.fulfill.fulfillmentNotes}
        </label>
        <Input.TextArea
          rows={2}
          placeholder={t.requests.fulfill.pickingNotes}
          value={fulfillNotes}
          onChange={(e) => setFulfillNotes(e.target.value)}
          disabled={isSameUser}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={isSameUser || !locationId}
        >
          {t.requests.fulfill.fulfillItems}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Select,
  Descriptions,
  Table,
  Alert,
  Spin,
  Tag,
  App,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import { ReceivingSteps } from "@/components/receiving/receiving-steps";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface ReceivingLine {
  id: string;
  itemId: string;
  expectedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitCost: number;
  notes: string | null;
  item: { id: string; code: string; name: string; uom: string };
}

interface ReceivingDetail {
  id: string;
  receivingNumber: string;
  status: string;
  procNotes: string | null;
  qcNotes: string | null;
  qcResult: string | null;
  procVerifiedAt: string | null;
  qcInspectedAt: string | null;
  warehouseReceivedAt: string | null;
  procVerifiedBy: { id: string; fullName: string; email: string } | null;
  qcInspectedBy: { id: string; fullName: string; email: string } | null;
  warehouseReceivedBy: { id: string; fullName: string; email: string } | null;
  purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: { id: string; name: string; code: string };
    createdBy: { id: string; fullName: string };
  };
  lines: ReceivingLine[];
}

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

export default function WarehouseReceivePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const { t } = useTranslation();
  const [receiving, setReceiving] = useState<ReceivingDetail | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locationId, setLocationId] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState("");
  const [warehouseNotes, setWarehouseNotes] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rcvRes, locRes] = await Promise.all([
      fetch(`/api/receiving/${id}`),
      fetch("/api/locations?pageSize=100"),
    ]);
    const rcvJson = await rcvRes.json();
    const locJson = await locRes.json();

    if (rcvJson.success) {
      setReceiving(rcvJson.data);
    } else {
      message.error(t.receiving.warehouse.failedToLoad);
    }
    if (locJson.success) {
      setLocations(locJson.data.data || []);
    }
    setLoading(false);
  }, [id, message, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!receiving) return;
    if (!locationId) {
      message.error(t.receiving.warehouse.selectStorageLocation);
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/receiving/${id}/warehouse-receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId,
        batchNumber: batchNumber || undefined,
        notes: warehouseNotes || undefined,
      }),
    });

    const json = await res.json();
    if (json.success) {
      const totalAccepted = receiving.lines.reduce(
        (sum, l) => sum + l.acceptedQty,
        0
      );
      const locName =
        locations.find((l) => l.id === locationId)?.name || "storage";
      message.success(
        t.receiving.warehouse.inventoryUpdated
          .replace("{count}", String(totalAccepted))
          .replace("{location}", locName)
      );
      router.push("/receiving/warehouse");
    } else {
      message.error(json.error || t.receiving.warehouse.failedToPutaway);
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

  if (!receiving) {
    return <Alert type="error" message={t.receiving.warehouse.receivingNotFound} showIcon />;
  }

  const isSameAsProcUser = receiving.procVerifiedBy?.id === user?.id;
  const isSameAsQcUser = receiving.qcInspectedBy?.id === user?.id;
  const isBlocked = isSameAsProcUser || isSameAsQcUser;

  const acceptedLines = receiving.lines.filter((l) => l.acceptedQty > 0);

  const columns: ColumnsType<ReceivingLine> = [
    { title: t.receiving.warehouse.itemCode, dataIndex: ["item", "code"], width: 120 },
    { title: t.receiving.warehouse.itemName, dataIndex: ["item", "name"], ellipsis: true },
    { title: t.receiving.warehouse.uom, dataIndex: ["item", "uom"], width: 70, align: "center" },
    {
      title: t.receiving.warehouse.received,
      dataIndex: "receivedQty",
      width: 100,
      align: "right",
    },
    {
      title: t.receiving.warehouse.accepted,
      dataIndex: "acceptedQty",
      width: 100,
      align: "right",
      render: (v: number) => (
        <span className="text-green-600 font-medium">{v}</span>
      ),
    },
    {
      title: t.receiving.warehouse.rejected,
      dataIndex: "rejectedQty",
      width: 100,
      align: "right",
      render: (v: number) =>
        v > 0 ? <span className="text-red-600">{v}</span> : "-",
    },
    {
      title: t.receiving.warehouse.unitCost,
      dataIndex: "unitCost",
      width: 100,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
  ];

  return (
    <div className="space-y-4">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push("/receiving/warehouse")}
      >
        {t.receiving.warehouse.backToQueue}
      </Button>

      {isBlocked && (
        <Alert
          type="warning"
          message={t.receiving.warehouse.segregationOfDuties}
          description={
            isSameAsProcUser
              ? t.receiving.warehouse.segregationVerified
              : t.receiving.warehouse.segregationInspected
          }
          showIcon
        />
      )}

      <ReceivingSteps
        status={receiving.status}
        procVerifiedBy={receiving.procVerifiedBy}
        procVerifiedAt={receiving.procVerifiedAt}
        qcInspectedBy={receiving.qcInspectedBy}
        qcInspectedAt={receiving.qcInspectedAt}
        qcResult={receiving.qcResult}
        warehouseReceivedBy={receiving.warehouseReceivedBy}
        warehouseReceivedAt={receiving.warehouseReceivedAt}
      />

      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label={t.receiving.warehouse.columns.grn}>
          {receiving.receivingNumber}
        </Descriptions.Item>
        <Descriptions.Item label={t.receiving.warehouse.columns.poNumber}>
          {receiving.purchaseOrder.poNumber}
        </Descriptions.Item>
        <Descriptions.Item label={t.receiving.warehouse.columns.supplier}>
          {receiving.purchaseOrder.supplier.name}
        </Descriptions.Item>
        <Descriptions.Item label={t.receiving.warehouse.qcResult}>
          {receiving.qcResult && (
            <Tag
              color={
                receiving.qcResult === "ACCEPTED"
                  ? "green"
                  : receiving.qcResult === "PARTIAL"
                  ? "orange"
                  : "red"
              }
            >
              {receiving.qcResult}
            </Tag>
          )}
        </Descriptions.Item>
        {receiving.procNotes && (
          <Descriptions.Item label={t.receiving.warehouse.procurementNotes} span={2}>
            {receiving.procNotes}
          </Descriptions.Item>
        )}
        {receiving.qcNotes && (
          <Descriptions.Item label={t.receiving.warehouse.qcNotes} span={2}>
            {receiving.qcNotes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">
          {t.receiving.warehouse.acceptedItems} ({acceptedLines.length})
        </h3>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={acceptedLines}
          pagination={false}
          size="small"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.receiving.warehouse.storageLocation}
          </label>
          <Select
            placeholder={t.receiving.warehouse.selectLocation}
            value={locationId || undefined}
            onChange={setLocationId}
            disabled={isBlocked}
            className="w-full"
            showSearch
            optionFilterProp="children"
            options={locations.map((l) => ({
              value: l.id,
              label: `${l.code} - ${l.name} (${l.type})`,
            }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.receiving.warehouse.batchNumber}
          </label>
          <Input
            placeholder={t.receiving.warehouse.batchPlaceholder}
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            disabled={isBlocked}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.receiving.warehouse.warehouseNotes}
        </label>
        <Input.TextArea
          rows={3}
          placeholder={t.receiving.warehouse.warehouseNotesPlaceholder}
          value={warehouseNotes}
          onChange={(e) => setWarehouseNotes(e.target.value)}
          disabled={isBlocked}
        />
      </div>

      <div className="flex justify-end">
        <Popconfirm
          title={t.receiving.warehouse.confirmTitle}
          description={t.receiving.warehouse.confirmDescription}
          onConfirm={handleSubmit}
          okText={t.receiving.warehouse.confirmReceiptBtn}
          disabled={isBlocked || !locationId}
        >
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            loading={submitting}
            disabled={isBlocked || !locationId}
          >
            {t.receiving.warehouse.confirmReceiptBtn}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}

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
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user";
import { ReceivingSteps } from "@/components/receiving/receiving-steps";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

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
      message.error("Failed to load receiving record");
    }
    if (locJson.success) {
      setLocations(locJson.data.data || []);
    }
    setLoading(false);
  }, [id, message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!receiving) return;
    if (!locationId) {
      message.error("Please select a storage location");
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
        `Inventory updated! ${totalAccepted} items added to ${locName}`
      );
      router.push("/receiving/warehouse");
    } else {
      message.error(json.error || "Failed to confirm receipt");
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
    return <Alert type="error" message="Receiving record not found" showIcon />;
  }

  const isSameAsProcUser = receiving.procVerifiedBy?.id === user?.id;
  const isSameAsQcUser = receiving.qcInspectedBy?.id === user?.id;
  const isBlocked = isSameAsProcUser || isSameAsQcUser;

  const acceptedLines = receiving.lines.filter((l) => l.acceptedQty > 0);

  const columns: ColumnsType<ReceivingLine> = [
    { title: "Item Code", dataIndex: ["item", "code"], width: 120 },
    { title: "Item Name", dataIndex: ["item", "name"], ellipsis: true },
    { title: "UOM", dataIndex: ["item", "uom"], width: 70, align: "center" },
    {
      title: "Received",
      dataIndex: "receivedQty",
      width: 100,
      align: "right",
    },
    {
      title: "Accepted",
      dataIndex: "acceptedQty",
      width: 100,
      align: "right",
      render: (v: number) => (
        <span className="text-green-600 font-medium">{v}</span>
      ),
    },
    {
      title: "Rejected",
      dataIndex: "rejectedQty",
      width: 100,
      align: "right",
      render: (v: number) =>
        v > 0 ? <span className="text-red-600">{v}</span> : "-",
    },
    {
      title: "Unit Cost",
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
        Back to Queue
      </Button>

      {isBlocked && (
        <Alert
          type="warning"
          message="Segregation of Duties"
          description={
            isSameAsProcUser
              ? "You cannot receive items that you verified."
              : "You cannot receive items that you inspected."
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
        <Descriptions.Item label="Receiving #">
          {receiving.receivingNumber}
        </Descriptions.Item>
        <Descriptions.Item label="PO #">
          {receiving.purchaseOrder.poNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Supplier">
          {receiving.purchaseOrder.supplier.name}
        </Descriptions.Item>
        <Descriptions.Item label="QC Result">
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
          <Descriptions.Item label="Procurement Notes" span={2}>
            {receiving.procNotes}
          </Descriptions.Item>
        )}
        {receiving.qcNotes && (
          <Descriptions.Item label="QC Notes" span={2}>
            {receiving.qcNotes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div>
        <h3 className="text-base font-semibold mb-2">
          Accepted Items ({acceptedLines.length})
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
            Storage Location *
          </label>
          <Select
            placeholder="Select location..."
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
            Batch/Lot Number (optional)
          </label>
          <Input
            placeholder="e.g. BATCH-2026-001"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            disabled={isBlocked}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Warehouse Notes
        </label>
        <Input.TextArea
          rows={3}
          placeholder="Warehouse receiving notes..."
          value={warehouseNotes}
          onChange={(e) => setWarehouseNotes(e.target.value)}
          disabled={isBlocked}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={isBlocked || !locationId}
        >
          Confirm Receipt
        </Button>
      </div>
    </div>
  );
}

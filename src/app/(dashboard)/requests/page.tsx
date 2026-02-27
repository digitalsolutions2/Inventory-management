"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Tag, App, Empty, Space, Modal, Select } from "antd";
import { PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface RequestRecord {
  id: string;
  requestNumber: string;
  status: string;
  notes: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string };
  _count: { lines: number };
}

interface Supplier {
  id: string;
  code: string;
  name: string;
}

export default function RequestsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertRequestId, setConvertRequestId] = useState<string>("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [converting, setConverting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/internal-requests?pageSize=100");
    const json = await res.json();
    if (json.success) {
      setRequests(json.data.data || []);
    }
    setLoading(false);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const res = await fetch("/api/suppliers?all=true");
    const json = await res.json();
    if (json.success) setSuppliers(json.data);
  }, []);

  useEffect(() => {
    fetchRequests();
    if (hasPermission("po:write")) fetchSuppliers();
  }, [fetchRequests, fetchSuppliers, hasPermission]);

  const handleConvertToPO = async () => {
    if (!selectedSupplierId) {
      message.error(t.procurement.approval.selectSupplier);
      return;
    }
    setConverting(true);
    try {
      const res = await fetch(`/api/internal-requests/${convertRequestId}/convert-to-po`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: selectedSupplierId }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(t.procurement.approval.convertSuccess);
        setConvertModalOpen(false);
        router.push(`/procurement/${json.data.id}`);
      } else {
        message.error(json.error || t.procurement.approval.convertFailed);
      }
    } catch {
      message.error(t.common.networkError);
    }
    setConverting(false);
  };

  const columns: ColumnsType<RequestRecord> = [
    { title: t.requests.columns.requestNumber, dataIndex: "requestNumber", width: 130 },
    {
      title: t.common.status,
      dataIndex: "status",
      width: 160,
      render: (status: string) => {
        const statusKey = status as keyof typeof t.requests.statusLabels;
        const label = t.requests.statusLabels[statusKey] || status;
        const colorMap: Record<string, string> = {
          PENDING: "orange",
          APPROVED: "blue",
          FULFILLING: "cyan",
          ISSUED: "geekblue",
          CONFIRMED: "green",
          CANCELLED: "red",
        };
        return <Tag color={colorMap[status] || "default"}>{label}</Tag>;
      },
    },
    {
      title: t.requests.columns.requestedBy,
      dataIndex: ["createdBy", "fullName"],
      width: 150,
    },
    {
      title: t.requests.columns.items,
      dataIndex: ["_count", "lines"],
      width: 70,
      align: "center",
    },
    {
      title: t.requests.columns.createdAt,
      dataIndex: "createdAt",
      width: 150,
      render: (v: string) => dayjs(v).format("DD MMM YYYY HH:mm"),
    },
    {
      title: t.common.actions,
      width: 160,
      render: (_, record) => (
        <Space>
          {hasPermission("po:write") &&
            (record.status === "PENDING" || record.status === "APPROVED") && (
              <Button
                size="small"
                icon={<ShoppingCartOutlined />}
                onClick={() => {
                  setConvertRequestId(record.id);
                  setSelectedSupplierId("");
                  setConvertModalOpen(true);
                }}
              >
                {t.procurement.approval.convertToPO}
              </Button>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.requests.title}</h1>
        {hasPermission("requests:write") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/requests/create")}
          >
            {t.requests.createRequest}
          </Button>
        )}
      </div>

      {requests.length === 0 && !loading ? (
        <Empty description={t.common.noData} />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={requests}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          size="small"
        />
      )}

      <Modal
        title={t.procurement.approval.convertToPO}
        open={convertModalOpen}
        onOk={handleConvertToPO}
        onCancel={() => setConvertModalOpen(false)}
        confirmLoading={converting}
      >
        <div className="mb-4 text-gray-600">
          {t.procurement.approval.selectSupplier}
        </div>
        <Select
          value={selectedSupplierId || undefined}
          onChange={setSelectedSupplierId}
          placeholder={t.procurement.selectSupplier}
          showSearch
          optionFilterProp="label"
          className="w-full"
          options={suppliers.map((s) => ({
            value: s.id,
            label: `${s.code} - ${s.name}`,
          }))}
        />
      </Modal>
    </div>
  );
}

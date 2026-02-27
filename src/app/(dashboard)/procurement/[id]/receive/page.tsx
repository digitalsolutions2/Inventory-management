"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  Descriptions,
  Select,
  Input,
  Table,
  Spin,
  App,
  Tag,
} from "antd";
import { ArrowLeftOutlined, InboxOutlined } from "@ant-design/icons";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface POLine {
  id: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  item: { id: string; code: string; name: string; uom: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  supplier: { id: string; code: string; name: string };
  lines: POLine[];
}

interface Location {
  id: string;
  name: string;
  code: string;
}

export default function POReceivePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [poRes, locRes] = await Promise.all([
      fetch(`/api/purchase-orders/${id}`),
      fetch("/api/locations?pageSize=100"),
    ]);
    const poJson = await poRes.json();
    const locJson = await locRes.json();

    if (poJson.success) {
      setPO(poJson.data);
    } else {
      message.error(t.procurement.failedToLoad);
    }

    if (locJson.success) {
      setLocations(locJson.data?.data || locJson.data || []);
    }
    setLoading(false);
  }, [id, message, t.procurement.failedToLoad]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReceive = async () => {
    if (!locationId) {
      message.warning(t.procurement.receive.locationRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, notes: notes || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(t.procurement.receive.success);
        router.push(`/procurement/${id}`);
      } else {
        message.error(json.error || t.procurement.receive.failed);
      }
    } catch {
      message.error(t.common.networkError);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center text-gray-500 mt-12">
        {t.procurement.notFound}
      </div>
    );
  }

  if (po.status !== "APPROVED") {
    return (
      <div className="text-center text-gray-500 mt-12">
        PO must be in APPROVED status to receive.
      </div>
    );
  }

  const columns: ColumnsType<POLine> = [
    {
      title: t.procurement.columns.itemCode,
      dataIndex: ["item", "code"],
      width: 120,
    },
    {
      title: t.procurement.columns.itemName,
      dataIndex: ["item", "name"],
      ellipsis: true,
    },
    {
      title: t.procurement.columns.uom,
      dataIndex: ["item", "uom"],
      width: 70,
    },
    {
      title: t.procurement.columns.qty,
      dataIndex: "quantity",
      width: 80,
      align: "right",
    },
    {
      title: t.procurement.columns.unitCost,
      dataIndex: "unitCost",
      width: 110,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
    {
      title: t.procurement.columns.total,
      dataIndex: "totalCost",
      width: 120,
      align: "right",
      render: (v: number) => v.toFixed(2),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/procurement/${id}`)}
        />
        <h1 className="text-2xl font-bold text-gray-900">
          {t.procurement.receive.title}
        </h1>
        <Tag color="green">{po.poNumber}</Tag>
      </div>

      <Card className="mb-4">
        <Descriptions column={2} size="small">
          <Descriptions.Item label={t.procurement.poNumber}>
            {po.poNumber}
          </Descriptions.Item>
          <Descriptions.Item label={t.procurement.details.supplier}>
            {po.supplier.code} - {po.supplier.name}
          </Descriptions.Item>
          <Descriptions.Item label={t.procurement.details.totalAmount}>
            {po.currency} {po.totalAmount.toFixed(2)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t.procurement.lineItems} className="mb-4">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={po.lines}
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                <strong>{t.common.total}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong>{po.totalAmount.toFixed(2)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Card>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.procurement.receive.selectLocation} *
            </label>
            <Select
              className="w-full"
              placeholder={t.procurement.receive.selectLocation}
              value={locationId}
              onChange={setLocationId}
              options={locations.map((loc) => ({
                value: loc.id,
                label: `${loc.code} - ${loc.name}`,
              }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase()) ?? false
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.common.notes}
            </label>
            <Input.TextArea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.procurement.optionalNotes}
            />
          </div>

          <Button
            type="primary"
            icon={<InboxOutlined />}
            size="large"
            block
            loading={submitting}
            onClick={handleReceive}
          >
            {t.procurement.receive.confirmReceive}
          </Button>
        </div>
      </Card>
    </div>
  );
}

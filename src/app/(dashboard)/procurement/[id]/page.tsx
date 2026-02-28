"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Tag,
  Table,
  Descriptions,
  Space,
  Popconfirm,
  Input,
  Modal,
  Select,
  Spin,
  App,
  Card,
  Steps,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

interface POLine {
  id: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
  notes?: string;
  item: { id: string; code: string; name: string; uom: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  notes?: string;
  expectedDate: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: string;
    code: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  createdBy: { id: string; fullName: string; email: string };
  approvedBy?: { id: string; fullName: string; email: string } | null;
  approvedAt?: string | null;
  qcApprovedBy?: { id: string; fullName: string } | null;
  qcApprovedAt?: string | null;
  financeApprovedBy?: { id: string; fullName: string } | null;
  financeApprovedAt?: string | null;
  warehouseApprovedBy?: { id: string; fullName: string } | null;
  warehouseApprovedAt?: string | null;
  rejectedBy?: { id: string; fullName: string } | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  internalRequest?: { id: string; requestNumber: string; status: string } | null;
  lines: POLine[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  PENDING_QC_APPROVAL: "orange",
  PENDING_FINANCE_APPROVAL: "gold",
  PENDING_WAREHOUSE_APPROVAL: "lime",
  APPROVED: "green",
  SENT: "blue",
  PARTIALLY_RECEIVED: "cyan",
  RECEIVED: "geekblue",
  CANCELLED: "red",
};

function getApprovalStepIndex(status: string): number {
  switch (status) {
    case "DRAFT": return -1;
    case "PENDING_QC_APPROVAL": return 0;
    case "PENDING_FINANCE_APPROVAL": return 1;
    case "PENDING_WAREHOUSE_APPROVAL": return 2;
    case "APPROVED":
    case "SENT":
    case "PARTIALLY_RECEIVED":
    case "RECEIVED":
      return 3;
    case "CANCELLED": return -2;
    default: return -1;
  }
}

export default function PODetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const hasPermission = useUserStore((s) => s.hasPermission);
  const { t } = useTranslation();

  const STATUS_LABELS: Record<string, string> = {
    DRAFT: t.procurement.statusLabels.DRAFT,
    PENDING_QC_APPROVAL: t.procurement.statusLabels.PENDING_QC_APPROVAL,
    PENDING_FINANCE_APPROVAL: t.procurement.statusLabels.PENDING_FINANCE_APPROVAL,
    PENDING_WAREHOUSE_APPROVAL: t.procurement.statusLabels.PENDING_WAREHOUSE_APPROVAL,
    APPROVED: t.procurement.statusLabels.APPROVED,
    SENT: t.procurement.statusLabels.SENT,
    PARTIALLY_RECEIVED: t.procurement.statusLabels.PARTIALLY_RECEIVED,
    RECEIVED: t.procurement.statusLabels.RECEIVED,
    CANCELLED: t.procurement.statusLabels.CANCELLED,
  };

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [locations, setLocations] = useState<{ id: string; name: string; code: string }[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const fetchPO = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/purchase-orders/${id}`);
    const json = await res.json();
    if (json.success) {
      setPO(json.data);
    } else {
      message.error(t.procurement.failedToLoad);
    }
    setLoading(false);
  }, [id, message, t.procurement.failedToLoad]);

  useEffect(() => {
    fetchPO();
  }, [fetchPO]);

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${id}/submit`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        message.success(t.procurement.poSubmitted);
        fetchPO();
      } else {
        message.error(json.error || t.procurement.failedToSubmit);
      }
    } catch {
      message.error(t.common.networkError);
    }
    setActionLoading(false);
  };

  const fetchLocations = async () => {
    setLocationsLoading(true);
    try {
      const res = await fetch("/api/locations?pageSize=100");
      const json = await res.json();
      if (json.success) {
        setLocations(json.data.data || json.data);
      }
    } catch {
      // ignore
    }
    setLocationsLoading(false);
  };

  const handleApproveClick = () => {
    if (po?.status === "PENDING_WAREHOUSE_APPROVAL") {
      fetchLocations();
      setLocationModalOpen(true);
    } else {
      handleApprove();
    }
  };

  const handleApprove = async (locationId?: string) => {
    setActionLoading(true);
    try {
      const bodyData: Record<string, string> = { action: "approve" };
      if (locationId) bodyData.locationId = locationId;

      const res = await fetch(`/api/purchase-orders/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const json = await res.json();
      if (json.success) {
        message.success(t.procurement.poApproved);
        if (locationId) {
          message.success(t.procurement.receive.success);
          setLocationModalOpen(false);
          setSelectedLocationId("");
        }
        fetchPO();
      } else {
        message.error(json.error || t.procurement.failedToApprove);
      }
    } catch {
      message.error(t.common.networkError);
    }
    setActionLoading(false);
  };

  const handleWarehouseApproveConfirm = () => {
    if (!selectedLocationId) {
      message.warning(t.procurement.approval.locationRequired);
      return;
    }
    handleApprove(selectedLocationId);
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(t.procurement.poRejected);
        setRejectModalOpen(false);
        setRejectReason("");
        fetchPO();
      } else {
        message.error(json.error || t.procurement.failedToReject);
      }
    } catch {
      message.error(t.common.networkError);
    }
    setActionLoading(false);
  };

  const handleMarkSent = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/purchase-orders/${id}/send`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        message.success(t.procurement.poMarkedSent);
        fetchPO();
      } else {
        message.error(json.error || t.procurement.failedToMarkSent);
      }
    } catch {
      message.error(t.common.networkError);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!po) {
    return <div className="text-center text-gray-500 mt-12">{t.procurement.notFound}</div>;
  }

  const stepIndex = getApprovalStepIndex(po.status);
  const isCancelled = po.status === "CANCELLED";

  // Determine which approval button to show
  const canApproveQC =
    po.status === "PENDING_QC_APPROVAL" &&
    hasPermission("po:approve_qc") &&
    user?.id !== po.createdBy.id;

  const canApproveFinance =
    po.status === "PENDING_FINANCE_APPROVAL" &&
    hasPermission("po:approve_finance") &&
    user?.id !== po.createdBy.id;

  const canApproveWarehouse =
    po.status === "PENDING_WAREHOUSE_APPROVAL" &&
    hasPermission("po:approve_warehouse") &&
    user?.id !== po.createdBy.id;

  const canApprove = canApproveQC || canApproveFinance || canApproveWarehouse;

  const lineColumns: ColumnsType<POLine> = [
    { title: t.procurement.columns.itemCode, dataIndex: ["item", "code"], width: 120 },
    { title: t.procurement.columns.itemName, dataIndex: ["item", "name"], ellipsis: true },
    { title: t.procurement.columns.uom, dataIndex: ["item", "uom"], width: 70 },
    { title: t.procurement.columns.qty, dataIndex: "quantity", width: 80, align: "right" },
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
    {
      title: t.procurement.columns.received,
      dataIndex: "receivedQty",
      width: 90,
      align: "right",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/procurement")} />
        <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
        <Tag color={STATUS_COLORS[po.status]} className="text-sm">
          {STATUS_LABELS[po.status] || po.status}
        </Tag>
      </div>

      {/* 3-Step Approval Progress */}
      {po.status !== "DRAFT" && (
        <Card className="mb-4" title={t.procurement.approval.stepsTitle} size="small">
          <Steps
            current={isCancelled ? -1 : stepIndex}
            status={isCancelled ? "error" : stepIndex >= 3 ? "finish" : "process"}
            size="small"
            items={[
              {
                title: t.procurement.approval.qcApproval,
                content: po.qcApprovedBy
                  ? `${po.qcApprovedBy.fullName} - ${dayjs(po.qcApprovedAt).format("DD MMM HH:mm")}`
                  : po.status === "PENDING_QC_APPROVAL"
                    ? undefined
                    : undefined,
                icon: po.qcApprovedBy ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : isCancelled && stepIndex === -2 && !po.financeApprovedBy && !po.warehouseApprovedBy && !po.qcApprovedBy ? (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                ) : po.status === "PENDING_QC_APPROVAL" ? (
                  <ClockCircleOutlined style={{ color: "#faad14" }} />
                ) : undefined,
              },
              {
                title: t.procurement.approval.financeApproval,
                content: po.financeApprovedBy
                  ? `${po.financeApprovedBy.fullName} - ${dayjs(po.financeApprovedAt).format("DD MMM HH:mm")}`
                  : undefined,
                icon: po.financeApprovedBy ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : isCancelled && po.qcApprovedBy && !po.financeApprovedBy ? (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                ) : po.status === "PENDING_FINANCE_APPROVAL" ? (
                  <ClockCircleOutlined style={{ color: "#faad14" }} />
                ) : undefined,
              },
              {
                title: t.procurement.approval.warehouseApproval,
                content: po.warehouseApprovedBy
                  ? `${po.warehouseApprovedBy.fullName} - ${dayjs(po.warehouseApprovedAt).format("DD MMM HH:mm")}`
                  : undefined,
                icon: po.warehouseApprovedBy ? (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                ) : isCancelled && po.financeApprovedBy && !po.warehouseApprovedBy ? (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                ) : po.status === "PENDING_WAREHOUSE_APPROVAL" ? (
                  <ClockCircleOutlined style={{ color: "#faad14" }} />
                ) : undefined,
              },
            ]}
          />
        </Card>
      )}

      {/* Rejection Info */}
      {isCancelled && po.rejectedBy && (
        <Alert
          type="error"
          className="mb-4"
          showIcon
          title={
            <span>
              {t.procurement.approval.rejectedBy}: <strong>{po.rejectedBy.fullName}</strong>
              {po.rejectedAt && ` - ${dayjs(po.rejectedAt).format("DD MMM YYYY HH:mm")}`}
            </span>
          }
          description={
            po.rejectionReason && (
              <span>
                {t.procurement.approval.rejectionReason}: {po.rejectionReason}
              </span>
            )
          }
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <Descriptions column={2} size="small">
            <Descriptions.Item label={t.procurement.details.supplier}>
              {po.supplier.code} - {po.supplier.name}
            </Descriptions.Item>
            <Descriptions.Item label={t.procurement.details.totalAmount}>
              {po.currency} {po.totalAmount.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label={t.procurement.details.createdBy}>
              {po.createdBy.fullName}
            </Descriptions.Item>
            <Descriptions.Item label={t.procurement.details.created}>
              {dayjs(po.createdAt).format("DD MMM YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label={t.procurement.details.expectedDelivery}>
              {po.expectedDate
                ? dayjs(po.expectedDate).format("DD MMM YYYY")
                : "-"}
            </Descriptions.Item>
            {po.internalRequest && (
              <Descriptions.Item label={t.procurement.approval.linkedRequest}>
                <a onClick={() => router.push(`/requests`)}>
                  <LinkOutlined /> {po.internalRequest.requestNumber}
                </a>
              </Descriptions.Item>
            )}
            {po.notes && (
              <Descriptions.Item label={t.procurement.details.notes} span={2}>
                {po.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card title={t.procurement.details.actions}>
          <Space orientation="vertical" className="w-full">
            {po.status === "DRAFT" && hasPermission("po:write") && (
              <>
                <Button
                  block
                  onClick={() => router.push(`/procurement/create?edit=${po.id}`)}
                >
                  {t.procurement.editPO}
                </Button>
                <Popconfirm title={t.procurement.submitConfirm} onConfirm={handleSubmit}>
                  <Button block type="primary" loading={actionLoading}>
                    {t.procurement.submitForApproval}
                  </Button>
                </Popconfirm>
              </>
            )}
            {canApprove && (
              <>
                <Button
                  block
                  type="primary"
                  style={{ background: "#52c41a" }}
                  onClick={handleApproveClick}
                  loading={actionLoading}
                >
                  {t.common.approve}
                </Button>
                <Button
                  block
                  danger
                  onClick={() => setRejectModalOpen(true)}
                  loading={actionLoading}
                >
                  {t.common.reject}
                </Button>
              </>
            )}
            {po.status === "APPROVED" && hasPermission("po:write") && (
              <Button block type="primary" onClick={handleMarkSent} loading={actionLoading}>
                {t.procurement.markAsSent}
              </Button>
            )}
          </Space>
        </Card>
      </div>

      <Card title={t.procurement.lineItems}>
        <Table
          rowKey="id"
          columns={lineColumns}
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
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Modal
        title={t.procurement.rejectTitle}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectReason("");
        }}
        confirmLoading={actionLoading}
      >
        <div className="mb-2 text-gray-600">
          {t.procurement.rejectPrompt}
        </div>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t.procurement.rejectPlaceholder}
        />
      </Modal>

      <Modal
        title={t.procurement.approval.selectLocationTitle}
        open={locationModalOpen}
        onOk={handleWarehouseApproveConfirm}
        onCancel={() => {
          setLocationModalOpen(false);
          setSelectedLocationId("");
        }}
        confirmLoading={actionLoading}
        okText={t.common.approve}
      >
        <div className="mb-3 text-gray-600">
          {t.procurement.approval.selectLocationDesc}
        </div>
        <Select
          className="w-full"
          placeholder={t.procurement.receive.selectLocation}
          value={selectedLocationId || undefined}
          onChange={(val) => setSelectedLocationId(val)}
          loading={locationsLoading}
          showSearch
          optionFilterProp="label"
          options={locations.map((loc) => ({
            value: loc.id,
            label: `${loc.code} - ${loc.name}`,
          }))}
        />
      </Modal>
    </div>
  );
}

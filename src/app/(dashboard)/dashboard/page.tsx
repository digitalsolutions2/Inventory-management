"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Statistic, Table, Tag, Alert, Spin, App } from "antd";
import {
  DollarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  FileTextOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

interface DashboardData {
  kpis: {
    totalInventoryValue: number;
    pendingApprovals: number;
    pendingPOs: number;
    pendingTransfers: number;
    pendingRequests: number;
    lowStockCount: number;
    outstandingPayables: number;
    outstandingPaymentCount: number;
  };
  charts: {
    posByStatus: { status: string; count: number; total: number }[];
    topItemsByValue: { name: string; code: string; value: number; quantity: number }[];
    supplierSpend: { id: string; name: string; total: number }[];
  };
  alerts: {
    lowStock: { itemCode: string; itemName: string; location: string; quantity: number; reorderPoint: number }[];
    overduePayments: { id: string; amount: number; dueDate: string; poNumber: string; supplier: string }[];
  };
  recentActivity: { id: string; action: string; entityType: string; user: string; createdAt: string }[];
  recentTransactions: { id: string; type: string; item: string; itemCode: string; location: string; quantity: number; createdAt: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partial",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

const TX_TYPE_COLORS: Record<string, string> = {
  INBOUND: "green",
  OUTBOUND: "red",
  TRANSFER_IN: "blue",
  TRANSFER_OUT: "orange",
  ADJUSTMENT: "purple",
};

export default function DashboardPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    if (json.success) {
      setData(json.data);
    } else {
      message.error("Failed to load dashboard");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  const { kpis, charts, alerts, recentActivity, recentTransactions } = data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card size="small">
          <Statistic
            title="Total Inventory Value"
            value={kpis.totalInventoryValue}
            precision={2}
            prefix={<DollarOutlined />}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Pending Approvals"
            value={kpis.pendingApprovals}
            prefix={<ClockCircleOutlined />}
            styles={{ content: { color: kpis.pendingApprovals > 0 ? "#faad14" : "#52c41a" } }}
            suffix={
              <span className="text-xs text-gray-400 ml-1">
                ({kpis.pendingPOs} POs, {kpis.pendingTransfers} transfers)
              </span>
            }
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Low Stock Items"
            value={kpis.lowStockCount}
            prefix={<WarningOutlined />}
            styles={{ content: { color: kpis.lowStockCount > 0 ? "#ff4d4f" : "#52c41a" } }}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Outstanding Payables"
            value={kpis.outstandingPayables}
            precision={2}
            prefix={<DollarOutlined />}
            styles={{ content: { color: kpis.outstandingPayables > 0 ? "#faad14" : "#52c41a" } }}
            suffix={
              <span className="text-xs text-gray-400 ml-1">
                ({kpis.outstandingPaymentCount} payments)
              </span>
            }
          />
        </Card>
      </div>

      {/* Middle section: charts data as tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top Items by Value */}
        <Card title="Top Items by Value" size="small">
          {charts.topItemsByValue.length === 0 ? (
            <p className="text-gray-400 text-sm">No inventory data yet</p>
          ) : (
            <div className="space-y-2">
              {charts.topItemsByValue.slice(0, 8).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">
                    <span className="text-gray-400 mr-2">{item.code}</span>
                    {item.name}
                  </span>
                  <span className="font-medium">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Supplier Spend */}
        <Card title="Supplier Spend (Last 30 Days)" size="small">
          {charts.supplierSpend.length === 0 ? (
            <p className="text-gray-400 text-sm">No purchase data yet</p>
          ) : (
            <div className="space-y-2">
              {charts.supplierSpend.map((s, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{s.name}</span>
                  <span className="font-medium">${s.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* PO Status Breakdown */}
        <Card title="Purchase Orders by Status" size="small">
          <div className="space-y-2">
            {charts.posByStatus.map((po, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <Tag>{STATUS_LABELS[po.status] || po.status}</Tag>
                <span>
                  <span className="font-medium">{po.count}</span>
                  <span className="text-gray-400 ml-2">(${po.total.toFixed(0)})</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card
          title={
            <span>
              <SwapOutlined className="mr-2" />
              Recent Inventory Movements
            </span>
          }
          size="small"
        >
          {recentTransactions.length === 0 ? (
            <p className="text-gray-400 text-sm">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center text-sm">
                  <span>
                    <Tag color={TX_TYPE_COLORS[tx.type]} className="mr-1">
                      {tx.type.replace("_", " ")}
                    </Tag>
                    {tx.itemCode} - {tx.item}
                  </span>
                  <span className="text-gray-500">
                    {tx.quantity} @ {tx.location} · {dayjs(tx.createdAt).format("DD MMM HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {alerts.lowStock.length > 0 && (
          <Card
            title={
              <span className="text-red-600">
                <WarningOutlined className="mr-2" />
                Low Stock Alerts ({alerts.lowStock.length})
              </span>
            }
            size="small"
          >
            {alerts.lowStock.map((item, i) => (
              <Alert
                key={i}
                type="warning"
                message={`${item.itemCode} - ${item.itemName}`}
                description={`${item.location}: ${item.quantity} remaining (reorder at ${item.reorderPoint})`}
                className="mb-2"
                showIcon
              />
            ))}
          </Card>
        )}

        {alerts.overduePayments.length > 0 && (
          <Card
            title={
              <span className="text-orange-600">
                <ClockCircleOutlined className="mr-2" />
                Overdue Payments ({alerts.overduePayments.length})
              </span>
            }
            size="small"
          >
            {alerts.overduePayments.map((p) => (
              <Alert
                key={p.id}
                type="error"
                message={`${p.poNumber} - ${p.supplier}`}
                description={`$${p.amount.toFixed(2)} due ${dayjs(p.dueDate).format("DD MMM YYYY")}`}
                className="mb-2"
                showIcon
              />
            ))}
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card
        title={
          <span>
            <FileTextOutlined className="mr-2" />
            Recent Activity
          </span>
        }
        size="small"
      >
        {recentActivity.length === 0 ? (
          <p className="text-gray-400 text-sm">No recent activity</p>
        ) : (
          <Table
            rowKey="id"
            dataSource={recentActivity}
            pagination={false}
            size="small"
            columns={[
              {
                title: "Action",
                dataIndex: "action",
                width: 200,
                render: (v: string) => <Tag>{v}</Tag>,
              },
              {
                title: "Entity",
                dataIndex: "entityType",
                width: 140,
              },
              {
                title: "User",
                dataIndex: "user",
                width: 150,
              },
              {
                title: "Time",
                dataIndex: "createdAt",
                render: (v: string) => dayjs(v).format("DD MMM YYYY HH:mm"),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

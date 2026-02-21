"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Statistic,
  Tag,
  Alert,
  Skeleton,
  Badge,
  Timeline,
  Button,
  Tooltip,
  Empty,
  App,
} from "antd";
import {
  DollarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RightOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  FileTextOutlined,
  BankOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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
    topItemsByValue: {
      name: string;
      code: string;
      value: number;
      quantity: number;
    }[];
    supplierSpend: { id: string; name: string; total: number }[];
  };
  alerts: {
    lowStock: {
      itemCode: string;
      itemName: string;
      location: string;
      quantity: number;
      reorderPoint: number;
    }[];
    overduePayments: {
      id: string;
      amount: number;
      dueDate: string;
      poNumber: string;
      supplier: string;
    }[];
  };
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    user: string;
    createdAt: string;
  }[];
  recentTransactions: {
    id: string;
    type: string;
    item: string;
    itemCode: string;
    location: string;
    quantity: number;
    createdAt: string;
  }[];
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

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#d9d9d9",
  PENDING_APPROVAL: "#faad14",
  APPROVED: "#52c41a",
  SENT: "#1890ff",
  PARTIALLY_RECEIVED: "#722ed1",
  RECEIVED: "#13c2c2",
  CANCELLED: "#ff4d4f",
};

const PIE_COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#ff4d4f",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
];

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  PurchaseOrder: <ShoppingCartOutlined style={{ color: "#1890ff" }} />,
  Receiving: <InboxOutlined style={{ color: "#52c41a" }} />,
  Transfer: <SwapOutlined style={{ color: "#722ed1" }} />,
  InternalRequest: <FileTextOutlined style={{ color: "#fa8c16" }} />,
  Payment: <BankOutlined style={{ color: "#13c2c2" }} />,
};

const AUTO_REFRESH_MS = 5 * 60 * 1000;

export default function DashboardPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setLastRefresh(new Date());
        } else {
          message.error("Failed to load dashboard");
        }
      } catch {
        message.error("Network error");
      }
      setLoading(false);
      setRefreshing(false);
    },
    [message]
  );

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(() => fetchData(true), AUTO_REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton.Input active style={{ width: 200, height: 32 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} size="small">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, charts, alerts, recentActivity, recentTransactions } = data;

  const totalAlerts = alerts.lowStock.length + alerts.overduePayments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {lastRefresh && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated {dayjs(lastRefresh).fromNow()}
            </p>
          )}
        </div>
        <Button
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={() => fetchData(true)}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          size="small"
          className="border-l-4"
          style={{ borderLeftColor: "#1890ff" }}
        >
          <Statistic
            title={
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Total Inventory Value
              </span>
            }
            value={kpis.totalInventoryValue}
            precision={2}
            prefix={<DollarOutlined />}
          />
        </Card>

        <Card
          size="small"
          className="border-l-4"
          style={{
            borderLeftColor:
              kpis.pendingApprovals > 0 ? "#faad14" : "#52c41a",
          }}
        >
          <Badge count={kpis.pendingApprovals} offset={[10, 0]} size="small">
            <Statistic
              title={
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                  Pending Approvals
                </span>
              }
              value={kpis.pendingApprovals}
              styles={{
                content: {
                  color:
                    kpis.pendingApprovals > 0 ? "#faad14" : "#52c41a",
                },
              }}
              suffix={
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  ({kpis.pendingPOs} POs, {kpis.pendingTransfers} transfers)
                </span>
              }
            />
          </Badge>
        </Card>

        <Card
          size="small"
          className="border-l-4"
          style={{
            borderLeftColor:
              kpis.lowStockCount > 5
                ? "#ff4d4f"
                : kpis.lowStockCount > 0
                  ? "#faad14"
                  : "#52c41a",
          }}
        >
          <Badge
            count={kpis.lowStockCount}
            offset={[10, 0]}
            size="small"
            color={kpis.lowStockCount > 5 ? "#ff4d4f" : "#faad14"}
          >
            <Statistic
              title={
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                  Low Stock Alerts
                </span>
              }
              value={kpis.lowStockCount}
              prefix={<WarningOutlined />}
              styles={{
                content: {
                  color:
                    kpis.lowStockCount > 5
                      ? "#ff4d4f"
                      : kpis.lowStockCount > 0
                        ? "#faad14"
                        : "#52c41a",
                },
              }}
            />
          </Badge>
        </Card>

        <Card
          size="small"
          className="border-l-4"
          style={{
            borderLeftColor:
              kpis.outstandingPayables > 0 ? "#faad14" : "#52c41a",
          }}
        >
          <Statistic
            title={
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Outstanding Payables
              </span>
            }
            value={kpis.outstandingPayables}
            precision={2}
            prefix={<DollarOutlined />}
            styles={{
              content: {
                color:
                  kpis.outstandingPayables > 0 ? "#faad14" : "#52c41a",
              },
            }}
            suffix={
              <span className="text-xs text-gray-400 ml-1 font-normal">
                ({kpis.outstandingPaymentCount} payments)
              </span>
            }
          />
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Items by Value - Bar Chart */}
        <Card
          title="Top Items by Value"
          size="small"
          styles={{ body: { padding: "12px 12px 0" } }}
        >
          {charts.topItemsByValue.length === 0 ? (
            <Empty
              description="No inventory data yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={charts.topItemsByValue.slice(0, 8)}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="code"
                  width={70}
                  fontSize={11}
                  tick={{ fill: "#6b7280" }}
                />
                <RTooltip
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
                    "Value",
                  ]}
                  labelFormatter={(label) => {
                    const item = charts.topItemsByValue.find(
                      (i) => i.code === label
                    );
                    return item ? `${item.code} - ${item.name}` : label;
                  }}
                />
                <Bar dataKey="value" fill="#1890ff" radius={[0, 4, 4, 0]}>
                  {charts.topItemsByValue.slice(0, 8).map((_, index) => (
                    <Cell
                      key={index}
                      fill={`rgba(24, 144, 255, ${1 - index * 0.08})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Supplier Spend - Pie Chart */}
        <Card
          title="Supplier Spend (Last 30 Days)"
          size="small"
          styles={{ body: { padding: "12px" } }}
        >
          {charts.supplierSpend.length === 0 ? (
            <Empty
              description="No purchase data yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={charts.supplierSpend.slice(0, 6)}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={2}
                  label={(entry: Record<string, any>) =>
                    `${(entry.name?.length > 12 ? entry.name.slice(0, 12) + "..." : entry.name) ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ strokeWidth: 1 }}
                  fontSize={11}
                >
                  {charts.supplierSpend.slice(0, 6).map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <RTooltip
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
                    "Spend",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* PO Status Breakdown - Bar Chart */}
        <Card
          title="Purchase Orders by Status"
          size="small"
          styles={{ body: { padding: "12px 12px 0" } }}
        >
          {charts.posByStatus.length === 0 ? (
            <Empty
              description="No purchase orders yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={charts.posByStatus.map((po) => ({
                  ...po,
                  label: STATUS_LABELS[po.status] || po.status,
                }))}
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} />
                <RTooltip
                  formatter={(value, name) => [
                    name === "count"
                      ? `${value} orders`
                      : `$${Number(value).toFixed(2)}`,
                    name === "count" ? "Count" : "Total Value",
                  ]}
                />
                <Legend fontSize={11} />
                <Bar dataKey="count" name="Count" fill="#1890ff" radius={[4, 4, 0, 0]}>
                  {charts.posByStatus.map((po) => (
                    <Cell
                      key={po.status}
                      fill={STATUS_COLORS[po.status] || "#d9d9d9"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Recent Transactions - Line Chart */}
        <Card
          title="Recent Inventory Movements"
          size="small"
          extra={
            <Link
              href="/reports/transaction-history"
              className="text-xs text-blue-500"
            >
              View All <RightOutlined />
            </Link>
          }
          styles={{ body: { padding: "12px" } }}
        >
          {recentTransactions.length === 0 ? (
            <Empty
              description="No transactions yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div className="space-y-2">
              {recentTransactions.slice(0, 8).map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag
                      color={
                        tx.type === "INBOUND"
                          ? "green"
                          : tx.type === "OUTBOUND"
                            ? "red"
                            : tx.type === "TRANSFER_IN"
                              ? "blue"
                              : "orange"
                      }
                      className="m-0"
                    >
                      {tx.type === "INBOUND" ? (
                        <ArrowDownOutlined />
                      ) : tx.type === "OUTBOUND" ? (
                        <ArrowUpOutlined />
                      ) : (
                        <SwapOutlined />
                      )}
                    </Tag>
                    <span className="text-gray-700 truncate">
                      <span className="font-medium">{tx.itemCode}</span>{" "}
                      <span className="text-gray-400">-</span> {tx.item}
                    </span>
                  </div>
                  <div className="text-right whitespace-nowrap ml-2">
                    <span className="font-medium">{tx.quantity}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      {dayjs(tx.createdAt).fromNow()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Alerts & Exceptions */}
      {totalAlerts > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.lowStock.length > 0 && (
            <Card
              size="small"
              title={
                <span className="flex items-center gap-2">
                  <ExclamationCircleOutlined className="text-red-500" />
                  <span>
                    Critical Low Stock
                  </span>
                  <Badge
                    count={alerts.lowStock.length}
                    style={{ backgroundColor: "#ff4d4f" }}
                  />
                </span>
              }
              extra={
                <Link
                  href="/reports/stock-movement"
                  className="text-xs text-blue-500"
                >
                  View Report <RightOutlined />
                </Link>
              }
            >
              {alerts.lowStock.slice(0, 5).map((item, i) => (
                <Alert
                  key={i}
                  type="warning"
                  showIcon
                  className="mb-2 last:mb-0"
                  message={
                    <span className="font-medium">
                      {item.itemCode} - {item.itemName}
                    </span>
                  }
                  description={
                    <span className="text-xs">
                      {item.location}: <strong>{item.quantity}</strong> remaining
                      (reorder at {item.reorderPoint})
                    </span>
                  }
                />
              ))}
              {alerts.lowStock.length > 5 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  +{alerts.lowStock.length - 5} more items
                </p>
              )}
            </Card>
          )}

          {alerts.overduePayments.length > 0 && (
            <Card
              size="small"
              title={
                <span className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-orange-500" />
                  <span>Overdue Payments</span>
                  <Badge
                    count={alerts.overduePayments.length}
                    style={{ backgroundColor: "#fa8c16" }}
                  />
                </span>
              }
              extra={
                <Link
                  href="/reports/payment-aging"
                  className="text-xs text-blue-500"
                >
                  View Report <RightOutlined />
                </Link>
              }
            >
              {alerts.overduePayments.map((p) => (
                <Alert
                  key={p.id}
                  type="error"
                  showIcon
                  className="mb-2 last:mb-0"
                  message={
                    <span className="font-medium">
                      {p.poNumber} - {p.supplier}
                    </span>
                  }
                  description={
                    <span className="text-xs">
                      <strong>${p.amount.toFixed(2)}</strong> due{" "}
                      {dayjs(p.dueDate).format("DD MMM YYYY")} (
                      {dayjs(p.dueDate).fromNow()})
                    </span>
                  }
                />
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Pending Approvals Info Bar */}
      {(kpis.pendingPOs > 0 ||
        kpis.pendingTransfers > 0 ||
        kpis.pendingRequests > 0) && (
        <Alert
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          message={
            <span className="flex items-center gap-4 flex-wrap">
              <span className="font-medium">Pending Actions:</span>
              {kpis.pendingPOs > 0 && (
                <Link href="/procurement" className="text-blue-600">
                  {kpis.pendingPOs} PO{kpis.pendingPOs > 1 ? "s" : ""} to
                  approve
                </Link>
              )}
              {kpis.pendingTransfers > 0 && (
                <Link href="/transfers/pending" className="text-blue-600">
                  {kpis.pendingTransfers} transfer
                  {kpis.pendingTransfers > 1 ? "s" : ""} to approve
                </Link>
              )}
              {kpis.pendingRequests > 0 && (
                <Link href="/requests/fulfill" className="text-blue-600">
                  {kpis.pendingRequests} request
                  {kpis.pendingRequests > 1 ? "s" : ""} to fulfill
                </Link>
              )}
            </span>
          }
        />
      )}

      {/* Recent Activity Timeline */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <FileTextOutlined />
            Recent Activity
          </span>
        }
        size="small"
        extra={
          <Link
            href="/admin/audit-logs"
            className="text-xs text-blue-500"
          >
            View All <RightOutlined />
          </Link>
        }
      >
        {recentActivity.length === 0 ? (
          <Empty
            description="No recent activity"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Timeline
            items={recentActivity.slice(0, 10).map((log) => ({
              dot: ACTIVITY_ICONS[log.entityType] || (
                <CheckCircleOutlined style={{ color: "#8c8c8c" }} />
              ),
              children: (
                <div className="flex justify-between items-start">
                  <div>
                    <Tag className="mr-1">{log.action}</Tag>
                    <span className="text-sm text-gray-600">
                      on{" "}
                      <span className="font-medium">{log.entityType}</span>
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      by {log.user}
                    </span>
                  </div>
                  <Tooltip
                    title={dayjs(log.createdAt).format(
                      "DD MMM YYYY HH:mm:ss"
                    )}
                  >
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {dayjs(log.createdAt).fromNow()}
                    </span>
                  </Tooltip>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}

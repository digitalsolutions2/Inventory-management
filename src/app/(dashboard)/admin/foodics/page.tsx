"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tabs,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Badge,
  Popconfirm,
  Spin,
} from "antd";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { FoodicsMappingModal } from "@/components/admin/foodics-mapping-modal";

interface FoodicsProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
}

interface MappingRow {
  id: string;
  foodicsProductId: string;
  foodicsProductName: string;
  quantityPerSale: number;
  isActive: boolean;
  item: { id: string; code: string; name: string; uom: string };
}

interface WebhookLog {
  id: string;
  foodicsOrderId: string;
  eventType: string;
  status: string;
  itemsDeducted: number;
  errorMessage: string | null;
  processedAt: string;
}

interface LocationOption {
  id: string;
  code: string;
  name: string;
}

interface ProductTableRow extends FoodicsProduct {
  key: string;
  mapping?: MappingRow;
}

export default function FoodicsAdminPage() {
  const { t } = useTranslation();

  // Settings state
  const [apiToken, setApiToken] = useState("");
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [maskedToken, setMaskedToken] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Mapping state
  const [foodicsProducts, setFoodicsProducts] = useState<FoodicsProduct[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FoodicsProduct | null>(
    null
  );

  // Logs state
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load settings + locations + mappings on mount
  useEffect(() => {
    loadSettings();
    loadLocations();
    loadMappings();
  }, []);

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/foodics/settings");
      const data = await res.json();
      if (data.success) {
        setMaskedToken(data.data.foodicsApiToken);
        setDefaultLocationId(data.data.foodicsDefaultLocationId);
        setIsConnected(data.data.isConnected);
      }
    } catch {
      // ignore
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadLocations() {
    try {
      const res = await fetch("/api/locations?tree=true");
      const data = await res.json();
      if (data.success) {
        setLocations(data.data || []);
      }
    } catch {
      // ignore
    }
  }

  const loadMappings = useCallback(async () => {
    try {
      const res = await fetch("/api/foodics/mappings");
      const data = await res.json();
      if (data.success) {
        setMappings(data.data || []);
      }
    } catch {
      // ignore
    }
  }, []);

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const body: Record<string, unknown> = {};
      if (apiToken) body.foodicsApiToken = apiToken;
      if (defaultLocationId) body.foodicsDefaultLocationId = defaultLocationId;

      const res = await fetch("/api/foodics/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t.admin.foodics.settings.tokenSaved);
        setMaskedToken(data.data.foodicsApiToken);
        setIsConnected(data.data.isConnected);
        setApiToken("");
      } else {
        toast.error(data.error || t.admin.foodics.settings.connectionFailed);
      }
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleTestConnection() {
    if (!apiToken) {
      toast.error(t.admin.foodics.settings.invalidToken);
      return;
    }
    setTestingConnection(true);
    try {
      const res = await fetch("/api/foodics/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodicsApiToken: apiToken }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t.admin.foodics.settings.connectionSuccess);
        setMaskedToken(data.data.foodicsApiToken);
        setIsConnected(true);
        setApiToken("");
      } else {
        toast.error(data.error || t.admin.foodics.settings.invalidToken);
      }
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleSyncProducts() {
    setSyncingProducts(true);
    try {
      const res = await fetch("/api/foodics/products");
      const data = await res.json();
      if (data.success) {
        setFoodicsProducts(data.data || []);
        toast.success(`${(data.data || []).length} products synced`);
      } else {
        toast.error(data.error || "Failed to sync products");
      }
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setSyncingProducts(false);
    }
  }

  async function handleCreateMapping(data: {
    foodicsProductId: string;
    foodicsProductName: string;
    itemId: string;
    quantityPerSale: number;
  }) {
    const res = await fetch("/api/foodics/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      toast.success(t.admin.foodics.mapping.mappingCreated);
      setMappingModalOpen(false);
      loadMappings();
    } else {
      toast.error(result.error || "Failed to create mapping");
    }
  }

  async function handleDeleteMapping(id: string) {
    const res = await fetch(`/api/foodics/mappings?id=${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (result.success) {
      toast.success(t.admin.foodics.mapping.mappingDeleted);
      loadMappings();
    } else {
      toast.error(result.error || "Failed to delete mapping");
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/foodics/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  }

  // Build the merged products table: combine synced products with existing mappings
  const mappingsByProductId = new Map(
    mappings.map((m) => [m.foodicsProductId, m])
  );

  const productsTableData: ProductTableRow[] = foodicsProducts.map((p) => ({
    key: p.id,
    ...p,
    mapping: mappingsByProductId.get(p.id),
  }));

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/foodics/webhook?tenantId=TENANT_ID`
      : "/api/foodics/webhook?tenantId=TENANT_ID";

  const tabItems = [
    {
      key: "settings",
      label: t.admin.foodics.settings.title,
      children: (
        <div className="max-w-xl space-y-6">
          {settingsLoading ? (
            <Spin />
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  status={isConnected ? "success" : "default"}
                  text={
                    isConnected
                      ? t.admin.foodics.settings.connected
                      : t.admin.foodics.settings.notConfigured
                  }
                />
                {maskedToken && (
                  <span className="text-xs text-gray-400 font-mono">
                    ({maskedToken})
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.admin.foodics.settings.apiToken}
                </label>
                <Input.Password
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder={t.admin.foodics.settings.apiTokenPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.admin.foodics.settings.defaultLocation}
                </label>
                <Select
                  className="w-full"
                  value={defaultLocationId}
                  onChange={setDefaultLocationId}
                  placeholder={t.admin.foodics.settings.selectLocation}
                  allowClear
                  options={locations.map((loc) => ({
                    value: loc.id,
                    label: `${loc.code} - ${loc.name}`,
                  }))}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleTestConnection}
                  loading={testingConnection}
                  disabled={!apiToken}
                >
                  {t.admin.foodics.settings.testConnection}
                </Button>
                <Button
                  type="primary"
                  onClick={handleSaveSettings}
                  loading={savingSettings}
                  disabled={!apiToken && !defaultLocationId}
                >
                  {t.admin.foodics.settings.saveSettings}
                </Button>
              </div>

              {isConnected && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.admin.foodics.settings.webhookUrl}
                  </label>
                  <code className="block text-xs bg-white border p-2 rounded break-all">
                    {webhookUrl}
                  </code>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.admin.foodics.settings.webhookUrlDesc}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: "mapping",
      label: t.admin.foodics.mapping.title,
      children: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button
              type="primary"
              onClick={handleSyncProducts}
              loading={syncingProducts}
              disabled={!isConnected}
            >
              {t.admin.foodics.mapping.syncProducts}
            </Button>
          </div>

          {foodicsProducts.length === 0 && mappings.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              {t.admin.foodics.mapping.noMappings}
            </div>
          ) : (
            <Table<ProductTableRow>
              dataSource={
                productsTableData.length > 0
                  ? productsTableData
                  : mappings.map((m) => ({
                      key: m.foodicsProductId,
                      id: m.foodicsProductId,
                      name: m.foodicsProductName,
                      sku: null,
                      category: null,
                      mapping: m,
                    }))
              }
              pagination={{ pageSize: 20 }}
              size="small"
              rowClassName={(record) =>
                !record.mapping ? "bg-yellow-50" : ""
              }
              columns={[
                {
                  title: t.admin.foodics.mapping.columns.product,
                  dataIndex: "name",
                  key: "name",
                },
                {
                  title: t.admin.foodics.mapping.columns.sku,
                  dataIndex: "sku",
                  key: "sku",
                  render: (v: string | null) => v || "-",
                },
                {
                  title: t.admin.foodics.mapping.columns.mappedItem,
                  key: "mappedItem",
                  render: (_: unknown, record: ProductTableRow) =>
                    record.mapping ? (
                      <Tag color="green">
                        {record.mapping.item.code} -{" "}
                        {record.mapping.item.name}
                      </Tag>
                    ) : (
                      <Tag>{t.admin.foodics.mapping.unmapped}</Tag>
                    ),
                },
                {
                  title: t.admin.foodics.mapping.columns.qtyPerSale,
                  key: "qty",
                  render: (_: unknown, record: ProductTableRow) =>
                    record.mapping ? record.mapping.quantityPerSale : "-",
                },
                {
                  title: t.admin.foodics.mapping.columns.actions,
                  key: "actions",
                  render: (
                    _: unknown,
                    record: ProductTableRow
                  ) =>
                    record.mapping ? (
                      <Popconfirm
                        title={t.admin.foodics.mapping.unmapConfirm}
                        onConfirm={() =>
                          handleDeleteMapping(record.mapping!.id)
                        }
                      >
                        <Button size="small" danger>
                          {t.common.remove}
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          setSelectedProduct({
                            id: record.id,
                            name: record.name,
                            sku: record.sku,
                            category: record.category,
                          });
                          setMappingModalOpen(true);
                        }}
                      >
                        {t.admin.foodics.mapping.mapProduct}
                      </Button>
                    ),
                },
              ]}
            />
          )}

          <FoodicsMappingModal
            open={mappingModalOpen}
            product={selectedProduct}
            onCancel={() => setMappingModalOpen(false)}
            onSave={handleCreateMapping}
          />
        </div>
      ),
    },
    {
      key: "logs",
      label: t.admin.foodics.logs.title,
      children: (
        <div>
          <Table
            dataSource={logs}
            loading={logsLoading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            size="small"
            locale={{ emptyText: t.admin.foodics.logs.noLogs }}
            columns={[
              {
                title: t.admin.foodics.logs.columns.orderId,
                dataIndex: "foodicsOrderId",
                key: "orderId",
                render: (v: string) => (
                  <span className="font-mono text-xs">{v}</span>
                ),
              },
              {
                title: t.admin.foodics.logs.columns.status,
                dataIndex: "status",
                key: "status",
                render: (status: string) => {
                  const colorMap: Record<string, string> = {
                    processed: "green",
                    failed: "red",
                    skipped: "default",
                  };
                  const labelMap: Record<string, string> = {
                    processed: t.admin.foodics.logs.processed,
                    failed: t.admin.foodics.logs.failed,
                    skipped: t.admin.foodics.logs.skipped,
                  };
                  return (
                    <Tag color={colorMap[status] || "default"}>
                      {labelMap[status] || status}
                    </Tag>
                  );
                },
              },
              {
                title: t.admin.foodics.logs.columns.itemsDeducted,
                dataIndex: "itemsDeducted",
                key: "itemsDeducted",
              },
              {
                title: t.admin.foodics.logs.columns.time,
                dataIndex: "processedAt",
                key: "time",
                render: (v: string) =>
                  new Date(v).toLocaleString(),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.admin.foodics.title}</h1>
      <Tabs
        defaultActiveKey="settings"
        items={tabItems}
        onChange={(key) => {
          if (key === "logs") loadLogs();
        }}
      />
    </div>
  );
}

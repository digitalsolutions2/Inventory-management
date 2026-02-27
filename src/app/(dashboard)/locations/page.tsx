"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Table, Tag, Space, Popconfirm, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { LocationTree } from "@/components/locations/location-tree";
import { LocationFormModal } from "@/components/locations/location-form-modal";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface LocationData {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  isActive: boolean;
  parent?: { id: string; name: string; code: string } | null;
}

const TYPE_COLORS: Record<string, string> = {
  WAREHOUSE: "blue",
  ZONE: "cyan",
  AISLE: "geekblue",
  SHELF: "purple",
  STORE: "green",
  KITCHEN: "orange",
};

export default function LocationsPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/locations?tree=true");
    const json = await res.json();
    if (json.success) setLocations(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSubmit = async (values: { code: string; name: string; type: string; parentId?: string }) => {
    setSubmitting(true);
    try {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : "/api/locations";
      const method = editingLocation ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        message.success(editingLocation ? t.locations.locationUpdated : t.locations.locationCreated);
        setModalOpen(false);
        setEditingLocation(null);
        fetchLocations();
      } else {
        message.error(json.error || t.common.failed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      message.success(t.locations.locationDeactivated);
      fetchLocations();
    } else {
      message.error(json.error || t.common.failed);
    }
  };

  // Show children of selected node, or all root locations
  const tableData = selectedId
    ? locations.filter((l) => l.parentId === selectedId)
    : locations.filter((l) => !l.parentId);

  const columns: ColumnsType<LocationData> = [
    { title: t.locations.columns.code, dataIndex: "code", width: 120 },
    { title: t.locations.columns.name, dataIndex: "name" },
    {
      title: t.locations.columns.type,
      dataIndex: "type",
      width: 120,
      render: (type: string) => <Tag color={TYPE_COLORS[type] || "default"}>{type}</Tag>,
    },
    {
      title: t.locations.columns.actions,
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {hasPermission("locations:write") && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingLocation(record);
                setModalOpen(true);
              }}
            />
          )}
          {hasPermission("locations:delete") && (
            <Popconfirm
              title={t.locations.deactivateConfirm}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.locations.title}</h1>
        {hasPermission("locations:write") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingLocation(null);
              setModalOpen(true);
            }}
          >
            {t.locations.addLocation}
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        <div className="w-72 bg-white rounded-lg shadow p-4 shrink-0">
          <h3 className="font-semibold text-gray-700 mb-3">{t.locations.locationHierarchy}</h3>
          {!loading && (
            <LocationTree
              locations={locations}
              selectedId={selectedId || undefined}
              onSelect={setSelectedId}
            />
          )}
        </div>

        <div className="flex-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-700">
              {selectedId
                ? `${t.locations.childrenOf} ${locations.find((l) => l.id === selectedId)?.name || ""}`
                : t.locations.rootLocations}
            </h3>
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={tableData}
            loading={loading}
            pagination={false}
            size="small"
          />
        </div>
      </div>

      <LocationFormModal
        open={modalOpen}
        editingLocation={editingLocation}
        locations={locations}
        onCancel={() => {
          setModalOpen(false);
          setEditingLocation(null);
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}

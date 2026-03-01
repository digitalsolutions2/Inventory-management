"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Button, Input, Tag, Space, Popconfirm, App } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined, StopOutlined } from "@ant-design/icons";
import { UserFormModal } from "@/components/admin/user-form-modal";
import { useUserStore } from "@/store/user";
import { useTranslation } from "@/lib/i18n";
import type { ColumnsType } from "antd/es/table";

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roleId: string | null;
  roleName: string | null;
  locationId: string | null;
  locationName: string | null;
  locationType: string | null;
}

export default function UsersPage() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const hasPermission = useUserStore((s) => s.hasPermission);
  const currentUserId = useUserStore((s) => s.user?.id);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      const res = await fetch(`/api/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.data);
        setTotal(json.data.total);
      } else {
        message.error(t.admin.users.failedToLoad);
      }
    } catch {
      message.error(t.admin.users.failedToLoad);
    }
    setLoading(false);
  }, [page, pageSize, search, message, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (values: { fullName: string; email: string; password?: string; roleId: string; locationId?: string | null; isActive?: boolean }) => {
    setSubmitting(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      // For edit, only send changed fields (no password)
      const payload = editingUser
        ? { fullName: values.fullName, roleId: values.roleId, isActive: values.isActive, locationId: values.locationId || null }
        : { ...values, locationId: values.locationId || null };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        message.success(editingUser ? t.admin.users.userUpdated : t.admin.users.userCreated);
        setModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        message.error(json.error || t.common.failed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      message.success(t.admin.users.userDeactivated);
      fetchUsers();
    } else {
      message.error(json.error || t.common.failed);
    }
  };

  const columns: ColumnsType<UserRow> = [
    { title: t.admin.users.columns.fullName, dataIndex: "fullName", ellipsis: true },
    { title: t.admin.users.columns.email, dataIndex: "email", width: 220, ellipsis: true },
    {
      title: t.admin.users.columns.role,
      dataIndex: "roleName",
      width: 160,
      render: (v: string | null) => v ? <Tag color="blue">{v}</Tag> : "-",
    },
    {
      title: "Location",
      dataIndex: "locationName",
      width: 150,
      render: (v: string | null, r: UserRow) => v ? <Tag color="cyan">{v} ({r.locationType})</Tag> : "-",
    },
    {
      title: t.admin.users.columns.status,
      dataIndex: "isActive",
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>
          {active ? t.common.active : t.common.inactive}
        </Tag>
      ),
    },
    {
      title: t.admin.users.columns.createdAt,
      dataIndex: "createdAt",
      width: 110,
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: t.admin.users.columns.actions,
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {hasPermission("users:write") && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUser(record);
                setModalOpen(true);
              }}
            />
          )}
          {hasPermission("users:delete") && record.id !== currentUserId && record.isActive && (
            <Popconfirm
              title={t.admin.users.deactivateConfirm}
              onConfirm={() => handleDeactivate(record.id)}
            >
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.users.title}</h1>
        {hasPermission("users:write") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
          >
            {t.admin.users.addUser}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Input
            placeholder={t.admin.users.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
            allowClear
          />
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          size="small"
        />
      </div>

      <UserFormModal
        open={modalOpen}
        editingUser={editingUser}
        onCancel={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}

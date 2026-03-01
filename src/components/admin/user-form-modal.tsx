"use client";

import { Modal, Form, Input, Select, Switch } from "antd";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";

interface Role {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface UserFormValues {
  fullName: string;
  email: string;
  password?: string;
  roleId: string;
  locationId?: string | null;
  isActive?: boolean;
}

interface EditingUser {
  id: string;
  fullName: string;
  email: string;
  roleId: string | null;
  locationId?: string | null;
  isActive: boolean;
}

interface UserFormModalProps {
  open: boolean;
  editingUser: EditingUser | null;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  loading?: boolean;
}

export function UserFormModal({
  open,
  editingUser,
  onCancel,
  onSubmit,
  loading,
}: UserFormModalProps) {
  const [form] = Form.useForm<UserFormValues>();
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const [rolesRes, locsRes] = await Promise.all([
        fetch("/api/roles?all=true").then((r) => r.json()),
        fetch("/api/locations?pageSize=100").then((r) => r.json()),
      ]);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (locsRes.success) {
        const data = locsRes.data.data || locsRes.data;
        setLocations(
          data
            .filter((l: Location & { isActive?: boolean }) => l.isActive !== false)
            .map((l: Location) => ({ id: l.id, name: l.name, type: l.type }))
        );
      }
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchRoles();
      if (editingUser) {
        form.setFieldsValue({
          fullName: editingUser.fullName,
          email: editingUser.email,
          roleId: editingUser.roleId || undefined,
          locationId: editingUser.locationId || undefined,
          isActive: editingUser.isActive,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingUser, form, fetchRoles]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Modal
      title={editingUser ? t.admin.users.editUser : t.admin.users.addUser}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={500}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
        <Form.Item
          name="fullName"
          label={t.admin.users.form.fullName}
          rules={[{ required: true, message: "Required" }]}
        >
          <Input placeholder={t.admin.users.form.fullNamePlaceholder} />
        </Form.Item>

        <Form.Item
          name="email"
          label={t.admin.users.form.email}
          rules={[
            { required: true, message: "Required" },
            { type: "email", message: "Invalid email" },
          ]}
        >
          <Input
            placeholder={t.admin.users.form.emailPlaceholder}
            disabled={!!editingUser}
          />
        </Form.Item>

        {!editingUser && (
          <Form.Item
            name="password"
            label={t.admin.users.form.password}
            rules={[
              { required: true, message: "Required" },
              { min: 8, message: "Minimum 8 characters" },
            ]}
          >
            <Input.Password
              placeholder={t.admin.users.form.passwordPlaceholder}
            />
          </Form.Item>
        )}

        <Form.Item
          name="roleId"
          label={t.admin.users.form.role}
          rules={[{ required: true, message: "Required" }]}
        >
          <Select
            placeholder={t.admin.users.form.rolePlaceholder}
            loading={rolesLoading}
            options={roles.map((r) => ({ label: r.name, value: r.id }))}
          />
        </Form.Item>

        <Form.Item
          name="locationId"
          label="Assigned Location"
        >
          <Select
            placeholder="Select location (optional - for store users)"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            options={locations.map((l) => ({
              label: `${l.name} (${l.type})`,
              value: l.id,
            }))}
          />
        </Form.Item>

        {editingUser && (
          <Form.Item
            name="isActive"
            label={t.admin.users.form.isActive}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

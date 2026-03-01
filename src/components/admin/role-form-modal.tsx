"use client";

import { Modal, Form, Input, Checkbox, Button } from "antd";
import { useEffect, useMemo } from "react";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { useTranslation } from "@/lib/i18n";

interface RoleFormValues {
  name: string;
  description?: string;
  permissions: string[];
}

interface RoleFormModalProps {
  open: boolean;
  editingRole: (RoleFormValues & { id: string }) | null;
  onCancel: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void>;
  loading?: boolean;
}

export function RoleFormModal({
  open,
  editingRole,
  onCancel,
  onSubmit,
  loading,
}: RoleFormModalProps) {
  const [form] = Form.useForm<RoleFormValues>();
  const { t } = useTranslation();
  const permissions = Form.useWatch("permissions", form) || [];

  const allPermissionKeys = useMemo(
    () => PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key)),
    []
  );

  useEffect(() => {
    if (open) {
      if (editingRole) {
        form.setFieldsValue({
          name: editingRole.name,
          description: editingRole.description || "",
          permissions: editingRole.permissions,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingRole, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  const handleSelectAll = () => {
    form.setFieldsValue({ permissions: allPermissionKeys });
  };

  const handleDeselectAll = () => {
    form.setFieldsValue({ permissions: [] });
  };

  const handleGroupToggle = (groupKeys: string[], checked: boolean) => {
    const current: string[] = form.getFieldValue("permissions") || [];
    const newPerms = checked
      ? [...new Set([...current, ...groupKeys])]
      : current.filter((p) => !groupKeys.includes(p));
    form.setFieldsValue({ permissions: newPerms });
  };

  return (
    <Modal
      title={editingRole ? t.admin.roles.editRole : t.admin.roles.addRole}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ permissions: [] }}
      >
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="name"
            label={t.admin.roles.form.name}
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder={t.admin.roles.form.namePlaceholder} />
          </Form.Item>
          <Form.Item name="description" label={t.admin.roles.form.description}>
            <Input placeholder={t.admin.roles.form.descriptionPlaceholder} />
          </Form.Item>
        </div>

        <Form.Item
          name="permissions"
          label={t.admin.roles.form.permissions}
          rules={[
            {
              type: "array",
              min: 1,
              message: "Select at least one permission",
            },
          ]}
        >
          <div>
            <div className="flex gap-2 mb-3">
              <Button size="small" onClick={handleSelectAll}>
                {t.admin.roles.form.selectAll}
              </Button>
              <Button size="small" onClick={handleDeselectAll}>
                {t.admin.roles.form.deselectAll}
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto border rounded-md p-3 space-y-4">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.permissions.map((p) => p.key);
                const allChecked = groupKeys.every((k) =>
                  permissions.includes(k)
                );
                const someChecked =
                  !allChecked &&
                  groupKeys.some((k) => permissions.includes(k));

                return (
                  <div key={group.key}>
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={(e) =>
                        handleGroupToggle(groupKeys, e.target.checked)
                      }
                      className="font-semibold"
                    >
                      <span className="font-semibold text-gray-800">
                        {group.label}
                      </span>
                    </Checkbox>
                    <div className="ml-6 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                      {group.permissions.map((perm) => (
                        <Checkbox
                          key={perm.key}
                          checked={permissions.includes(perm.key)}
                          onChange={(e) => {
                            const current: string[] =
                              form.getFieldValue("permissions") || [];
                            const newPerms = e.target.checked
                              ? [...current, perm.key]
                              : current.filter((p) => p !== perm.key);
                            form.setFieldsValue({ permissions: newPerms });
                          }}
                        >
                          <span className="text-gray-600 text-sm">
                            {perm.label}
                          </span>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}

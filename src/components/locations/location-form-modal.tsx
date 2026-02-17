"use client";

import { Modal, Form, Input, Select, TreeSelect } from "antd";
import { useEffect, useMemo } from "react";

const LOCATION_TYPES = [
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "ZONE", label: "Zone" },
  { value: "AISLE", label: "Aisle" },
  { value: "SHELF", label: "Shelf" },
  { value: "STORE", label: "Store" },
  { value: "KITCHEN", label: "Kitchen" },
];

interface LocationData {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
}

interface LocationFormValues {
  code: string;
  name: string;
  type: string;
  parentId?: string;
}

interface LocationFormModalProps {
  open: boolean;
  editingLocation: (LocationData & { id: string }) | null;
  locations: LocationData[];
  onCancel: () => void;
  onSubmit: (values: LocationFormValues) => Promise<void>;
  loading?: boolean;
}

interface TreeNode {
  value: string;
  title: string;
  children: TreeNode[];
}

function buildTreeSelect(
  locations: LocationData[],
  excludeId?: string
): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const loc of locations) {
    if (loc.id === excludeId) continue;
    map.set(loc.id, {
      value: loc.id,
      title: `${loc.code} - ${loc.name}`,
      children: [],
    });
  }

  for (const loc of locations) {
    if (loc.id === excludeId) continue;
    const node = map.get(loc.id)!;
    if (loc.parentId && map.has(loc.parentId)) {
      map.get(loc.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function LocationFormModal({
  open,
  editingLocation,
  locations,
  onCancel,
  onSubmit,
  loading,
}: LocationFormModalProps) {
  const [form] = Form.useForm<LocationFormValues>();
  const treeData = useMemo(
    () => buildTreeSelect(locations, editingLocation?.id),
    [locations, editingLocation]
  );

  useEffect(() => {
    if (open) {
      if (editingLocation) {
        form.setFieldsValue({
          code: editingLocation.code,
          name: editingLocation.name,
          type: editingLocation.type,
          parentId: editingLocation.parentId || undefined,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingLocation, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Modal
      title={editingLocation ? "Edit Location" : "Add Location"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ type: "WAREHOUSE" }}>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="code"
            label="Location Code"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="e.g. WH-01" disabled={!!editingLocation} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Location Name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Location name" />
          </Form.Item>
        </div>
        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: "Required" }]}
        >
          <Select options={LOCATION_TYPES} />
        </Form.Item>
        <Form.Item name="parentId" label="Parent Location">
          <TreeSelect
            treeData={treeData}
            placeholder="None (top-level)"
            allowClear
            treeDefaultExpandAll
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

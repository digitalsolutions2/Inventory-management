"use client";

import { Modal, Form, Input, Select, InputNumber } from "antd";
import { useEffect } from "react";

interface Category {
  id: string;
  name: string;
}

interface ItemFormValues {
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  uom: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
}

interface ItemFormModalProps {
  open: boolean;
  editingItem: (ItemFormValues & { id: string }) | null;
  categories: Category[];
  onCancel: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void>;
  loading?: boolean;
}

const UOM_OPTIONS = [
  { value: "EA", label: "Each (EA)" },
  { value: "KG", label: "Kilogram (KG)" },
  { value: "LTR", label: "Liter (LTR)" },
  { value: "BOX", label: "Box (BOX)" },
  { value: "CS", label: "Case (CS)" },
  { value: "PKG", label: "Package (PKG)" },
  { value: "BAG", label: "Bag (BAG)" },
  { value: "BTL", label: "Bottle (BTL)" },
  { value: "CAN", label: "Can (CAN)" },
  { value: "M", label: "Meter (M)" },
];

export function ItemFormModal({
  open,
  editingItem,
  categories,
  onCancel,
  onSubmit,
  loading,
}: ItemFormModalProps) {
  const [form] = Form.useForm<ItemFormValues>();

  useEffect(() => {
    if (open) {
      if (editingItem) {
        form.setFieldsValue(editingItem);
      } else {
        form.resetFields();
      }
    }
  }, [open, editingItem, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Modal
      title={editingItem ? "Edit Item" : "Add Item"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ uom: "EA", minStock: 0, maxStock: 0, reorderPoint: 0 }}>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="code"
            label="Item Code"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="e.g. ITEM-001" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Item Name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Item name" />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="categoryId" label="Category">
            <Select allowClear placeholder="Select category">
              {categories.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="uom" label="Unit of Measure">
            <Select options={UOM_OPTIONS} />
          </Form.Item>
        </div>
        <div className="grid grid-cols-3 gap-x-4">
          <Form.Item name="minStock" label="Min Stock">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="maxStock" label="Max Stock">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="reorderPoint" label="Reorder Point">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

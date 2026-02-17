"use client";

import { Modal, Form, Input, InputNumber, Rate } from "antd";
import { useEffect } from "react";

interface SupplierFormValues {
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms: number;
  rating: number;
}

interface SupplierFormModalProps {
  open: boolean;
  editingSupplier: (SupplierFormValues & { id: string }) | null;
  onCancel: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  loading?: boolean;
}

export function SupplierFormModal({
  open,
  editingSupplier,
  onCancel,
  onSubmit,
  loading,
}: SupplierFormModalProps) {
  const [form] = Form.useForm<SupplierFormValues>();

  useEffect(() => {
    if (open) {
      if (editingSupplier) {
        form.setFieldsValue(editingSupplier);
      } else {
        form.resetFields();
      }
    }
  }, [open, editingSupplier, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Modal
      title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ paymentTerms: 30, rating: 0 }}>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="code"
            label="Supplier Code"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="e.g. SUP-001" disabled={!!editingSupplier} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Supplier Name"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Company name" />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="contactName" label="Contact Person">
            <Input placeholder="Contact name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Invalid email" }]}>
            <Input placeholder="email@example.com" />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+966..." />
          </Form.Item>
          <Form.Item name="paymentTerms" label="Payment Terms (days)">
            <InputNumber min={0} max={365} className="w-full" />
          </Form.Item>
        </div>
        <Form.Item name="address" label="Address">
          <Input.TextArea rows={2} placeholder="Full address" />
        </Form.Item>
        <Form.Item name="rating" label="Rating">
          <Rate allowHalf />
        </Form.Item>
      </Form>
    </Modal>
  );
}

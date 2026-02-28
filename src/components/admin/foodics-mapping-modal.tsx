"use client";

import { Modal, Select, InputNumber } from "antd";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

interface FoodicsProduct {
  id: string;
  name: string;
  sku: string | null;
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  uom: string;
}

interface FoodicsMappingModalProps {
  open: boolean;
  product: FoodicsProduct | null;
  onCancel: () => void;
  onSave: (data: {
    foodicsProductId: string;
    foodicsProductName: string;
    itemId: string;
    quantityPerSale: number;
  }) => Promise<void>;
}

export function FoodicsMappingModal({
  open,
  product,
  onCancel,
  onSave,
}: FoodicsMappingModalProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantityPerSale, setQuantityPerSale] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedItemId(null);
      setQuantityPerSale(1);
      loadItems();
    }
  }, [open]);

  async function loadItems() {
    setLoadingItems(true);
    try {
      const res = await fetch("/api/items?pageSize=100&status=active");
      const data = await res.json();
      if (data.success) {
        setItems(data.data?.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleOk() {
    if (!product || !selectedItemId) return;
    setSaving(true);
    try {
      await onSave({
        foodicsProductId: product.id,
        foodicsProductName: product.name,
        itemId: selectedItemId,
        quantityPerSale,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={t.admin.foodics.mapping.mapProduct}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={saving}
      okButtonProps={{ disabled: !selectedItemId }}
    >
      {product && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm font-medium">{product.name}</div>
            {product.sku && (
              <div className="text-xs text-gray-500">SKU: {product.sku}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.admin.foodics.mapping.selectItem}
            </label>
            <Select
              showSearch
              className="w-full"
              placeholder={t.admin.foodics.mapping.selectItem}
              value={selectedItemId}
              onChange={setSelectedItemId}
              loading={loadingItems}
              optionFilterProp="label"
              options={items.map((item) => ({
                value: item.id,
                label: `${item.code} - ${item.name} (${item.uom})`,
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.admin.foodics.mapping.qtyPerSaleLabel}
            </label>
            <InputNumber
              className="w-full"
              min={0.001}
              step={0.1}
              value={quantityPerSale}
              onChange={(v) => setQuantityPerSale(v || 1)}
            />
            <div className="text-xs text-gray-400 mt-1">
              {t.admin.foodics.mapping.qtyPerSaleHelp}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

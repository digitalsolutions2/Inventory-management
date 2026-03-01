"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input, Select, InputNumber, Table, Spin, Switch } from "antd";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

interface RecipeLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  quantity: number;
  notes: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  uom: string;
}

interface Category {
  id: string;
  name: string;
}

export default function RecipeEditPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [yieldQty, setYieldQty] = useState(1);
  const [yieldUom, setYieldUom] = useState("EA");
  const [isActive, setIsActive] = useState(true);
  const [lines, setLines] = useState<RecipeLine[]>([]);

  // Load items and categories
  useEffect(() => {
    Promise.all([
      fetch("/api/items?pageSize=500").then((r) => r.json()),
      fetch("/api/categories?pageSize=100").then((r) => r.json()),
    ]).then(([itemsRes, catsRes]) => {
      if (itemsRes.success) {
        const data = itemsRes.data.data || itemsRes.data;
        setItems(data.map((i: Item & { isActive?: boolean }) => ({ id: i.id, code: i.code, name: i.name, uom: i.uom })));
      }
      if (catsRes.success) {
        const data = catsRes.data.data || catsRes.data;
        setCategories(data.map((c: Category) => ({ id: c.id, name: c.name })));
      }
    });
  }, []);

  // Load existing recipe
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/recipes/${params.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const r = res.data;
          setCode(r.code);
          setName(r.name);
          setDescription(r.description || "");
          setCategoryId(r.categoryId || null);
          setYieldQty(r.yieldQty);
          setYieldUom(r.yieldUom);
          setIsActive(r.isActive);
          setLines(
            r.lines.map((l: { itemId: string; quantity: number; notes: string | null; item: Item }) => ({
              itemId: l.itemId,
              itemCode: l.item.code,
              itemName: l.item.name,
              uom: l.item.uom,
              quantity: l.quantity,
              notes: l.notes || "",
            }))
          );
        } else {
          toast.error("Recipe not found");
          router.push("/admin/recipes");
        }
      })
      .finally(() => setLoading(false));
  }, [isNew, params.id, router]);

  const addItem = (itemId: string) => {
    if (lines.find((l) => l.itemId === itemId)) {
      toast.error("Item already added");
      return;
    }
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setLines((prev) => [
      ...prev,
      {
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        uom: item.uom,
        quantity: 1,
        notes: "",
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!code || !name) {
      toast.error("Code and name are required");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one ingredient");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code,
        name,
        description: description || null,
        categoryId: categoryId || null,
        yieldQty,
        yieldUom,
        ...(isNew ? {} : { isActive }),
        lines: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          notes: l.notes || null,
        })),
      };

      const url = isNew ? "/api/recipes" : `/api/recipes/${params.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(isNew ? t.recipes.recipeCreated : t.recipes.recipeUpdated);
        router.push("/admin/recipes");
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error("Failed to save recipe");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        {isNew ? t.recipes.addRecipe : t.recipes.editRecipe}
      </h1>

      <Card>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium mb-1">{t.recipes.form.code}</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.recipes.form.codePlaceholder}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.recipes.form.name}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.recipes.form.namePlaceholder}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">{t.recipes.form.description}</label>
            <Input.TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.recipes.form.category}</label>
            <Select
              value={categoryId || undefined}
              onChange={(v) => setCategoryId(v || null)}
              placeholder={t.recipes.form.categoryPlaceholder}
              allowClear
              className="w-full"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.recipes.form.yieldQty}</label>
              <InputNumber
                value={yieldQty}
                onChange={(v) => setYieldQty(v || 1)}
                min={0.01}
                step={0.1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.recipes.form.yieldUom}</label>
              <Input
                value={yieldUom}
                onChange={(e) => setYieldUom(e.target.value)}
                className="w-24"
              />
            </div>
          </div>
          {!isNew && (
            <div>
              <label className="block text-sm font-medium mb-1">{t.common.active}</label>
              <Switch checked={isActive} onChange={setIsActive} />
            </div>
          )}
        </div>
      </Card>

      <Card title={t.recipes.form.ingredients}>
        <div className="mb-4">
          <Select
            showSearch
            placeholder={t.recipes.form.selectItem}
            className="w-72"
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onSelect={(v: string) => addItem(v)}
            value={null as unknown as string}
            options={items
              .filter((i) => !lines.find((l) => l.itemId === i.id))
              .map((i) => ({
                value: i.id,
                label: `${i.code} - ${i.name} (${i.uom})`,
              }))}
          />
        </div>

        {lines.length === 0 ? (
          <div className="text-gray-400 text-center py-8">{t.recipes.form.noIngredients}</div>
        ) : (
          <Table
            dataSource={lines}
            rowKey="itemId"
            size="small"
            pagination={false}
            columns={[
              { title: "Code", dataIndex: "itemCode", width: 100 },
              { title: "Item", dataIndex: "itemName" },
              { title: "UOM", dataIndex: "uom", width: 70 },
              {
                title: t.recipes.form.quantity, key: "qty", width: 140,
                render: (_: unknown, r: RecipeLine) => (
                  <InputNumber
                    min={0.001}
                    step={0.1}
                    value={r.quantity}
                    onChange={(v) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.itemId === r.itemId ? { ...l, quantity: v || 0.001 } : l
                        )
                      )
                    }
                    size="small"
                  />
                ),
              },
              {
                title: "", key: "remove", width: 70,
                render: (_: unknown, r: RecipeLine) => (
                  <Button
                    size="small"
                    danger
                    onClick={() => setLines((prev) => prev.filter((l) => l.itemId !== r.itemId))}
                  >
                    {t.common.remove}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>

      <div className="flex gap-3">
        <Button type="primary" onClick={handleSubmit} loading={submitting} size="large">
          {t.common.save}
        </Button>
        <Button onClick={() => router.push("/admin/recipes")} size="large">
          {t.common.cancel}
        </Button>
      </div>
    </div>
  );
}

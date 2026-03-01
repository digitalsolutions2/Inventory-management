"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, Select, Button, InputNumber, Table, DatePicker, Input, Alert } from "antd";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useTranslation } from "@/lib/i18n";
import { useUser } from "@/components/providers/user-provider";
import { toast } from "sonner";

interface Recipe {
  id: string;
  code: string;
  name: string;
  yieldQty: number;
  yieldUom: string;
  category: { name: string } | null;
  _count: { lines: number };
}

interface RecipeDetail {
  id: string;
  code: string;
  name: string;
  lines: Array<{
    id: string;
    quantity: number;
    item: { id: string; code: string; name: string; uom: string };
  }>;
}

interface PrepLine {
  recipeId: string;
  recipeName: string;
  recipeCode: string;
  quantity: number;
}

interface MaterialRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  quantity: number;
}

export default function CreatePrepOrderPage() {
  const { t } = useTranslation();
  const { userContext } = useUser();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeDetails, setRecipeDetails] = useState<Map<string, RecipeDetail>>(new Map());
  const [lines, setLines] = useState<PrepLine[]>([]);
  const [prepDate, setPrepDate] = useState(dayjs().add(1, "day"));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load recipes
  useEffect(() => {
    fetch("/api/recipes?pageSize=200&activeOnly=true")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setRecipes(res.data.data);
      })
      .catch(() => toast.error("Failed to load recipes"));
  }, []);

  // Load recipe details when added
  const loadRecipeDetail = async (recipeId: string) => {
    if (recipeDetails.has(recipeId)) return;
    const res = await fetch(`/api/recipes/${recipeId}`);
    const json = await res.json();
    if (json.success) {
      setRecipeDetails((prev) => new Map(prev).set(recipeId, json.data));
    }
  };

  const addRecipe = async (recipeId: string) => {
    if (lines.find((l) => l.recipeId === recipeId)) {
      toast.error("Recipe already added");
      return;
    }
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    await loadRecipeDetail(recipeId);
    setLines((prev) => [
      ...prev,
      {
        recipeId: recipe.id,
        recipeName: recipe.name,
        recipeCode: recipe.code,
        quantity: 1,
      },
    ]);
  };

  // Calculate aggregated materials
  const materials = useMemo((): MaterialRow[] => {
    const map = new Map<string, MaterialRow>();
    for (const line of lines) {
      const detail = recipeDetails.get(line.recipeId);
      if (!detail) continue;
      for (const ingredient of detail.lines) {
        const qty = ingredient.quantity * line.quantity;
        const existing = map.get(ingredient.item.id);
        if (existing) {
          existing.quantity += qty;
        } else {
          map.set(ingredient.item.id, {
            itemId: ingredient.item.id,
            itemCode: ingredient.item.code,
            itemName: ingredient.item.name,
            uom: ingredient.item.uom,
            quantity: qty,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [lines, recipeDetails]);

  const handleSubmit = async () => {
    if (lines.length === 0) {
      toast.error("Add at least one recipe");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/daily-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prepDate: prepDate.format("YYYY-MM-DD"),
          notes: notes || null,
          lines: lines.map((l) => ({
            recipeId: l.recipeId,
            quantity: l.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t.storePortal.dailyPrep.orderCreated);
        router.push(`/store/daily-prep/${json.data.id}`);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error(t.storePortal.dailyPrep.failedToCreate);
    } finally {
      setSubmitting(false);
    }
  };

  if (!userContext?.locationId) {
    return <Alert type="warning" message="You must be assigned to a location." showIcon />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.storePortal.dailyPrep.createOrder}</h1>

      <Card title={t.storePortal.dailyPrep.prepDate}>
        <DatePicker
          value={prepDate}
          onChange={(d) => d && setPrepDate(d)}
          className="w-48"
        />
      </Card>

      <Card title={t.storePortal.dailyPrep.selectRecipes}>
        <div className="mb-4">
          <Select
            showSearch
            placeholder={t.storePortal.dailyPrep.addRecipe}
            className="w-72"
            filterOption={(input, option) =>
              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
            }
            onSelect={(v: string) => addRecipe(v)}
            value={null as unknown as string}
            options={recipes
              .filter((r) => !lines.find((l) => l.recipeId === r.id))
              .map((r) => ({
                value: r.id,
                label: `${r.code} - ${r.name}`,
              }))}
          />
        </div>

        {lines.length > 0 && (
          <Table
            dataSource={lines}
            rowKey="recipeId"
            size="small"
            pagination={false}
            columns={[
              { title: "Code", dataIndex: "recipeCode", width: 100 },
              { title: "Recipe", dataIndex: "recipeName" },
              {
                title: "Quantity", key: "qty", width: 140,
                render: (_: unknown, r: PrepLine) => (
                  <InputNumber
                    min={1}
                    value={r.quantity}
                    onChange={(v) =>
                      setLines((prev) =>
                        prev.map((l) =>
                          l.recipeId === r.recipeId ? { ...l, quantity: v || 1 } : l
                        )
                      )
                    }
                    size="small"
                  />
                ),
              },
              {
                title: "", key: "remove", width: 70,
                render: (_: unknown, r: PrepLine) => (
                  <Button
                    size="small"
                    danger
                    onClick={() => setLines((prev) => prev.filter((l) => l.recipeId !== r.recipeId))}
                  >
                    {t.common.remove}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Card>

      {materials.length > 0 && (
        <Card title={t.storePortal.dailyPrep.totalMaterials}>
          <Alert
            type="info"
            message={t.storePortal.dailyPrep.materialCalculation}
            description="These raw materials will be auto-requested from the warehouse via a transfer."
            showIcon
            className="mb-4"
          />
          <Table
            dataSource={materials}
            rowKey="itemId"
            size="small"
            pagination={false}
            columns={[
              { title: "Code", dataIndex: "itemCode", width: 100 },
              { title: "Item", dataIndex: "itemName" },
              { title: "UOM", dataIndex: "uom", width: 70 },
              {
                title: "Quantity Needed", dataIndex: "quantity", width: 140,
                render: (v: number) => <span className="font-bold text-blue-600">{v.toFixed(2)}</span>,
              },
            ]}
          />
        </Card>
      )}

      {lines.length > 0 && (
        <Card>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes..."
            rows={2}
            className="mb-4"
          />
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            block
            size="large"
          >
            {t.common.submit} ({lines.length} {t.storePortal.dailyPrep.recipesOrdered}, {materials.length} {t.storePortal.dailyPrep.materialsNeeded})
          </Button>
        </Card>
      )}
    </div>
  );
}

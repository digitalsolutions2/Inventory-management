"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Button, Card, Input, Tag, Modal } from "antd";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

interface Recipe {
  id: string;
  code: string;
  name: string;
  description: string | null;
  yieldQty: number;
  yieldUom: string;
  isActive: boolean;
  createdAt: string;
  category: { id: string; name: string } | null;
  _count: { lines: number };
}

export default function AdminRecipesPage() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        activeOnly: "false",
        ...(search && { search }),
      });
      const res = await fetch(`/api/recipes?${params}`);
      const json = await res.json();
      if (json.success) {
        setRecipes(json.data.data);
        setTotal(json.data.total);
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error(t.recipes.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeactivate = (recipe: Recipe) => {
    Modal.confirm({
      title: t.recipes.deactivateConfirm,
      onOk: async () => {
        try {
          const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
          const json = await res.json();
          if (json.success) {
            toast.success(t.recipes.recipeDeactivated);
            fetchData();
          } else {
            toast.error(json.error);
          }
        } catch {
          toast.error("Failed to deactivate");
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.recipes.title}</h1>
        <Link href="/admin/recipes/new">
          <Button type="primary">{t.recipes.addRecipe}</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4">
          <Input.Search
            placeholder={t.recipes.searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onSearch={fetchData}
            className="max-w-xs"
            allowClear
          />
        </div>

        <Table
          dataSource={recipes}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
          }}
          columns={[
            { title: t.recipes.columns.code, dataIndex: "code", width: 100 },
            {
              title: t.recipes.columns.name, dataIndex: "name",
              render: (v: string, r: Recipe) => (
                <Link href={`/admin/recipes/${r.id}`} className="text-blue-600 font-medium">{v}</Link>
              ),
            },
            { title: t.recipes.columns.category, dataIndex: ["category", "name"], render: (v: string) => v || "-" },
            {
              title: t.recipes.columns.yield, key: "yield",
              render: (_: unknown, r: Recipe) => `${r.yieldQty} ${r.yieldUom}`,
            },
            { title: t.recipes.columns.ingredients, dataIndex: ["_count", "lines"] },
            {
              title: t.recipes.columns.status, dataIndex: "isActive",
              render: (v: boolean) => <Tag color={v ? "success" : "default"}>{v ? t.common.active : t.common.inactive}</Tag>,
            },
            {
              title: t.recipes.columns.actions, key: "actions", width: 160,
              render: (_: unknown, r: Recipe) => (
                <div className="flex gap-2">
                  <Link href={`/admin/recipes/${r.id}`}>
                    <Button size="small">{t.common.edit}</Button>
                  </Link>
                  {r.isActive && (
                    <Button size="small" danger onClick={() => handleDeactivate(r)}>
                      {t.common.delete}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

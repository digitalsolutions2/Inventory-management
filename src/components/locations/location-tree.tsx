"use client";

import { Tree, Empty } from "antd";
import type { DataNode } from "antd/es/tree";

interface LocationData {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  isActive: boolean;
}

interface LocationTreeProps {
  locations: LocationData[];
  selectedId?: string;
  onSelect: (id: string | null) => void;
}

function buildTree(locations: LocationData[]): DataNode[] {
  const map = new Map<string, DataNode & { children: DataNode[] }>();
  const roots: DataNode[] = [];

  for (const loc of locations) {
    map.set(loc.id, {
      key: loc.id,
      title: `${loc.code} - ${loc.name} (${loc.type})`,
      children: [],
    });
  }

  for (const loc of locations) {
    const node = map.get(loc.id)!;
    if (loc.parentId && map.has(loc.parentId)) {
      map.get(loc.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function LocationTree({ locations, selectedId, onSelect }: LocationTreeProps) {
  const treeData = buildTree(locations);

  if (treeData.length === 0) {
    return <Empty description="No locations" />;
  }

  return (
    <Tree
      treeData={treeData}
      selectedKeys={selectedId ? [selectedId] : []}
      onSelect={(keys) => onSelect(keys.length > 0 ? String(keys[0]) : null)}
      defaultExpandAll
      showLine
    />
  );
}

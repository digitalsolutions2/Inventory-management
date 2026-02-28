export interface PermissionGroup {
  key: string;
  label: string;
  permissions: { key: string; label: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "items",
    label: "Items & Categories",
    permissions: [
      { key: "items:read", label: "View items list" },
      { key: "items:write", label: "Create & edit items" },
      { key: "items:delete", label: "Deactivate items" },
      { key: "item:create", label: "Create items (API)" },
      { key: "item:edit", label: "Edit items & categories (API)" },
      { key: "item:delete", label: "Delete items & categories (API)" },
    ],
  },
  {
    key: "locations",
    label: "Locations",
    permissions: [
      { key: "locations:read", label: "View locations" },
      { key: "locations:write", label: "Create & edit locations" },
      { key: "locations:delete", label: "Deactivate locations" },
      { key: "location:create", label: "Create locations (API)" },
      { key: "location:edit", label: "Edit locations (API)" },
      { key: "location:delete", label: "Delete locations (API)" },
    ],
  },
  {
    key: "suppliers",
    label: "Suppliers",
    permissions: [
      { key: "suppliers:read", label: "View suppliers list" },
      { key: "suppliers:write", label: "Create & edit suppliers" },
      { key: "suppliers:delete", label: "Deactivate suppliers" },
      { key: "supplier:create", label: "Create suppliers (API)" },
      { key: "supplier:edit", label: "Edit suppliers (API)" },
      { key: "supplier:delete", label: "Delete suppliers (API)" },
    ],
  },
  {
    key: "purchase-orders",
    label: "Purchase Orders",
    permissions: [
      { key: "po:read", label: "View purchase orders" },
      { key: "po:write", label: "Create, edit & submit POs" },
      { key: "po:approve", label: "General PO approval" },
      { key: "po:approve_qc", label: "QC approval step" },
      { key: "po:approve_finance", label: "Finance approval step" },
      { key: "po:approve_warehouse", label: "Warehouse approval & receive into inventory" },
      { key: "po:delete", label: "Cancel purchase orders" },
    ],
  },
  {
    key: "receiving",
    label: "Receiving (Inbound)",
    permissions: [
      { key: "receiving:read", label: "View receiving records" },
      { key: "receiving:proc_verify", label: "Procurement verification (step 1)" },
      { key: "receiving:qc_inspect", label: "QC inspection (step 2)" },
      { key: "receiving:warehouse_receive", label: "Warehouse receipt & putaway (step 3)" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    permissions: [
      { key: "inventory:read", label: "View inventory levels" },
      { key: "inventory:write", label: "Update inventory" },
      { key: "inventory:adjust", label: "Manual stock adjustments" },
    ],
  },
  {
    key: "internal-requests",
    label: "Internal Requests",
    permissions: [
      { key: "requests:read", label: "View internal requests" },
      { key: "requests:write", label: "Create internal requests" },
      { key: "requests:fulfill", label: "Fulfill (issue items)" },
      { key: "requests:confirm", label: "Confirm receipt of items" },
    ],
  },
  {
    key: "transfers",
    label: "Transfers",
    permissions: [
      { key: "transfers:read", label: "View transfers" },
      { key: "transfers:write", label: "Create transfers" },
      { key: "transfers:approve", label: "Approve/reject transfers" },
      { key: "transfers:fulfill", label: "Pick, pack & ship transfers" },
      { key: "transfers:receive", label: "Receive transfers at destination" },
    ],
  },
  {
    key: "payments",
    label: "Payments & Finance",
    permissions: [
      { key: "payments:read", label: "View payments & valuation" },
      { key: "payments:write", label: "Record payments" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    permissions: [
      { key: "reports:read", label: "View all reports" },
      { key: "reports:export", label: "Export reports to Excel" },
    ],
  },
  {
    key: "users",
    label: "Users & Roles",
    permissions: [
      { key: "users:read", label: "View users & roles" },
      { key: "users:write", label: "Create & edit users/roles" },
      { key: "users:delete", label: "Deactivate users / delete roles" },
      { key: "settings:read", label: "View system settings" },
      { key: "settings:write", label: "Modify system settings" },
    ],
  },
  {
    key: "audit",
    label: "Audit Logs",
    permissions: [
      { key: "audit:read", label: "View audit trail" },
    ],
  },
  {
    key: "foodics",
    label: "Foodics Integration",
    permissions: [
      { key: "foodics:settings", label: "Manage Foodics settings & mappings" },
      { key: "foodics:logs", label: "View webhook logs" },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

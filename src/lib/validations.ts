import { z } from "zod";

// ============================================================
// SHARED PRIMITIVES
// ============================================================

const uuid = z.string().uuid();
const positiveFloat = z.number().positive().finite();
const nonNegativeFloat = z.number().min(0).finite();
const trimmedString = z.string().trim().min(1).max(500);
const optionalString = z.string().trim().max(2000).optional().nullable().or(z.literal(""));

// ============================================================
// MASTER DATA
// ============================================================

export const CreateItemSchema = z.object({
  code: trimmedString.max(50),
  name: trimmedString.max(200),
  description: optionalString,
  categoryId: uuid.optional().nullable(),
  uom: z.string().trim().min(1).max(20).default("EA"),
  minStock: nonNegativeFloat.default(0),
  maxStock: nonNegativeFloat.default(0),
  reorderPoint: nonNegativeFloat.default(0),
  isActive: z.boolean().default(true),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export const CreateCategorySchema = z.object({
  name: trimmedString.max(100),
  description: optionalString,
  parentId: uuid.optional().nullable(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateLocationSchema = z.object({
  code: trimmedString.max(50),
  name: trimmedString.max(200),
  type: z.enum(["WAREHOUSE", "ZONE", "AISLE", "SHELF", "STORE", "KITCHEN"]),
  parentId: uuid.optional().nullable(),
  isActive: z.boolean().default(true),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

export const CreateSupplierSchema = z.object({
  code: trimmedString.max(50),
  name: trimmedString.max(200),
  contactName: z.string().trim().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  paymentTerms: z.number().int().min(0).max(365).default(30),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

// ============================================================
// PURCHASE ORDERS
// ============================================================

const POLineSchema = z.object({
  itemId: uuid,
  quantity: positiveFloat,
  unitCost: positiveFloat,
  notes: optionalString,
});

export const CreatePOSchema = z.object({
  supplierId: uuid,
  expectedDate: z.string().optional().nullable(),
  notes: optionalString,
  lines: z.array(POLineSchema).min(1, "At least one line item is required"),
  internalRequestId: uuid.optional().nullable(),
});

export const UpdatePOSchema = z.object({
  supplierId: uuid.optional(),
  expectedDate: z.string().optional().nullable(),
  notes: optionalString,
  lines: z.array(POLineSchema).min(1).optional(),
});

export const ApprovePOSchema = z.object({
  action: z.enum(["approve", "reject"]).default("approve"),
  reason: z.string().trim().max(1000).optional(),
});

// ============================================================
// RECEIVING
// ============================================================

const ReceivingLineSchema = z.object({
  itemId: uuid,
  receivedQty: positiveFloat,
  notes: optionalString,
});

export const CreateReceivingSchema = z.object({
  purchaseOrderId: uuid,
  lines: z.array(ReceivingLineSchema).min(1),
  notes: optionalString,
});

const QCLineSchema = z.object({
  id: uuid,
  acceptedQty: nonNegativeFloat,
  rejectedQty: nonNegativeFloat,
  notes: optionalString,
});

export const QCInspectSchema = z.object({
  qcResult: z.enum(["ACCEPTED", "PARTIAL", "REJECTED"]),
  lines: z.array(QCLineSchema).min(1),
  notes: optionalString,
});

export const WarehouseReceiveSchema = z.object({
  locationId: uuid,
  batchNumber: z.string().trim().max(100).optional(),
  notes: optionalString,
});

export const POReceiveSchema = z.object({
  locationId: uuid,
  notes: optionalString,
});

// ============================================================
// INTERNAL REQUESTS
// ============================================================

const RequestLineSchema = z.object({
  itemId: uuid,
  requestedQty: positiveFloat,
  notes: optionalString,
});

export const CreateRequestSchema = z.object({
  lines: z.array(RequestLineSchema).min(1),
  notes: optionalString,
});

const FulfillLineSchema = z.object({
  id: uuid,
  issuedQty: nonNegativeFloat,
  notes: optionalString,
});

export const FulfillRequestSchema = z.object({
  lines: z.array(FulfillLineSchema).min(1),
  locationId: uuid,
  notes: optionalString,
});

const ConfirmLineSchema = z.object({
  id: uuid,
  confirmedQty: nonNegativeFloat,
  notes: optionalString,
});

export const ConfirmRequestSchema = z.object({
  lines: z.array(ConfirmLineSchema).min(1),
  notes: optionalString,
  hasDiscrepancy: z.boolean().optional(),
});

// ============================================================
// TRANSFERS
// ============================================================

const TransferLineSchema = z.object({
  itemId: uuid,
  quantity: positiveFloat,
  notes: optionalString,
});

export const CreateTransferSchema = z.object({
  fromLocationId: uuid,
  toLocationId: uuid,
  lines: z.array(TransferLineSchema).min(1),
  notes: optionalString,
});

export const ApproveTransferSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(1000).optional(),
});

const TransferReceiveLineSchema = z.object({
  id: uuid,
  receivedQty: nonNegativeFloat,
  notes: optionalString,
});

export const TransferReceiveSchema = z.object({
  lines: z.array(TransferReceiveLineSchema).min(1),
  notes: optionalString,
});

// ============================================================
// PAYMENTS
// ============================================================

export const CreatePaymentSchema = z.object({
  purchaseOrderId: uuid,
  amount: positiveFloat,
  dueDate: z.string().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  paymentMethod: z.string().trim().max(50).optional(),
  referenceNumber: z.string().trim().max(100).optional(),
  notes: optionalString,
});

// ============================================================
// EXPORT
// ============================================================

const ExportColumnSchema = z.object({
  header: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  width: z.number().int().min(1).max(100).optional(),
});

export const ExportExcelSchema = z.object({
  title: z.string().min(1).max(200),
  columns: z.array(ExportColumnSchema).min(1),
  rows: z.array(z.record(z.string(), z.unknown())),
});

// ============================================================
// USERS & ROLES
// ============================================================

export const CreateUserSchema = z.object({
  fullName: trimmedString.max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  roleId: uuid,
  locationId: uuid.optional().nullable(),
});

export const UpdateUserSchema = z.object({
  fullName: trimmedString.max(200).optional(),
  roleId: uuid.optional(),
  isActive: z.boolean().optional(),
  locationId: uuid.optional().nullable(),
});

export const CreateRoleSchema = z.object({
  name: trimmedString.max(100),
  description: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  permissions: z.array(z.string().min(1)).min(1, "At least one permission is required"),
});

export const UpdateRoleSchema = z.object({
  name: trimmedString.max(100).optional(),
  description: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  permissions: z.array(z.string().min(1)).min(1).optional(),
});

// ============================================================
// RECIPES / BOM
// ============================================================

const RecipeLineSchema = z.object({
  itemId: uuid,
  quantity: positiveFloat,
  notes: optionalString,
});

export const CreateRecipeSchema = z.object({
  code: trimmedString.max(50),
  name: trimmedString.max(200),
  description: optionalString,
  categoryId: uuid.optional().nullable(),
  yieldQty: positiveFloat.default(1),
  yieldUom: z.string().trim().min(1).max(20).default("EA"),
  lines: z.array(RecipeLineSchema).min(1, "At least one ingredient is required"),
});

export const UpdateRecipeSchema = z.object({
  code: trimmedString.max(50).optional(),
  name: trimmedString.max(200).optional(),
  description: optionalString,
  categoryId: uuid.optional().nullable(),
  yieldQty: positiveFloat.optional(),
  yieldUom: z.string().trim().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
  lines: z.array(RecipeLineSchema).min(1).optional(),
});

// ============================================================
// DAILY PREP ORDERS
// ============================================================

const PrepOrderLineSchema = z.object({
  recipeId: uuid,
  quantity: positiveFloat,
  notes: optionalString,
});

export const CreatePrepOrderSchema = z.object({
  prepDate: z.string().min(1, "Prep date is required"),
  lines: z.array(PrepOrderLineSchema).min(1, "At least one recipe is required"),
  notes: optionalString,
});

// ============================================================
// FOODICS INTEGRATION
// ============================================================

export const FoodicsSettingsSchema = z.object({
  foodicsApiToken: z.string().trim().min(1).max(500).optional(),
  foodicsDefaultLocationId: uuid.optional(),
});

export const FoodicsItemMappingSchema = z.object({
  foodicsProductId: z.string().trim().min(1),
  foodicsProductName: z.string().trim().min(1).max(300),
  itemId: uuid,
  quantityPerSale: z.number().positive().finite().default(1),
});

// ============================================================
// HELPER: Parse and validate request body
// ============================================================

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  const path = firstError.path.join(".");
  return {
    success: false,
    error: path ? `${path}: ${firstError.message}` : firstError.message,
  };
}

import {
  CreateItemSchema,
  UpdateItemSchema,
  CreateCategorySchema,
  CreateLocationSchema,
  CreateSupplierSchema,
  CreatePOSchema,
  UpdatePOSchema,
  CreateReceivingSchema,
  QCInspectSchema,
  WarehouseReceiveSchema,
  CreateRequestSchema,
  FulfillRequestSchema,
  ConfirmRequestSchema,
  CreateTransferSchema,
  TransferReceiveSchema,
  CreatePaymentSchema,
  ExportExcelSchema,
  parseBody,
} from "@/lib/validations";

// ============================================================
// parseBody helper
// ============================================================

describe("parseBody", () => {
  test("returns success with valid data", () => {
    const result = parseBody(CreateItemSchema, { code: "ITEM-001", name: "Test Item" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("ITEM-001");
      expect(result.data.name).toBe("Test Item");
    }
  });

  test("returns error with path for invalid data", () => {
    const result = parseBody(CreateItemSchema, { code: "", name: "Test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("code");
    }
  });

  test("returns error without path for root-level errors", () => {
    const result = parseBody(CreateItemSchema, null);
    expect(result.success).toBe(false);
  });
});

// ============================================================
// CreateItemSchema
// ============================================================

describe("CreateItemSchema", () => {
  test("accepts valid item data", () => {
    const result = CreateItemSchema.safeParse({
      code: "FLOUR-001",
      name: "All Purpose Flour",
      uom: "KG",
    });
    expect(result.success).toBe(true);
  });

  test("applies defaults for optional fields", () => {
    const result = CreateItemSchema.safeParse({
      code: "FLOUR-001",
      name: "All Purpose Flour",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uom).toBe("EA");
      expect(result.data.minStock).toBe(0);
      expect(result.data.maxStock).toBe(0);
      expect(result.data.reorderPoint).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  test("rejects empty code", () => {
    const result = CreateItemSchema.safeParse({ code: "", name: "Test" });
    expect(result.success).toBe(false);
  });

  test("rejects empty name", () => {
    const result = CreateItemSchema.safeParse({ code: "TEST", name: "" });
    expect(result.success).toBe(false);
  });

  test("trims whitespace from strings", () => {
    const result = CreateItemSchema.safeParse({
      code: "  FLOUR-001  ",
      name: "  All Purpose Flour  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("FLOUR-001");
      expect(result.data.name).toBe("All Purpose Flour");
    }
  });

  test("rejects negative minStock", () => {
    const result = CreateItemSchema.safeParse({
      code: "TEST",
      name: "Test",
      minStock: -1,
    });
    expect(result.success).toBe(false);
  });

  test("accepts nullable categoryId", () => {
    const result = CreateItemSchema.safeParse({
      code: "TEST",
      name: "Test",
      categoryId: null,
    });
    expect(result.success).toBe(true);
  });

  test("validates categoryId as UUID when provided", () => {
    const result = CreateItemSchema.safeParse({
      code: "TEST",
      name: "Test",
      categoryId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateItemSchema", () => {
  test("allows partial updates", () => {
    const result = UpdateItemSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
  });

  test("accepts empty object (no changes)", () => {
    const result = UpdateItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ============================================================
// CreateCategorySchema
// ============================================================

describe("CreateCategorySchema", () => {
  test("accepts valid category", () => {
    const result = CreateCategorySchema.safeParse({ name: "Dairy" });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = CreateCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  test("accepts optional parentId", () => {
    const result = CreateCategorySchema.safeParse({
      name: "Sub-Dairy",
      parentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// CreateLocationSchema
// ============================================================

describe("CreateLocationSchema", () => {
  test("accepts valid location", () => {
    const result = CreateLocationSchema.safeParse({
      code: "WH-01",
      name: "Main Warehouse",
      type: "WAREHOUSE",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid type", () => {
    const result = CreateLocationSchema.safeParse({
      code: "WH-01",
      name: "Main",
      type: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  test("accepts all valid location types", () => {
    const types = ["WAREHOUSE", "ZONE", "AISLE", "SHELF", "STORE", "KITCHEN"];
    for (const type of types) {
      const result = CreateLocationSchema.safeParse({
        code: "LOC-01",
        name: "Location",
        type,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================
// CreateSupplierSchema
// ============================================================

describe("CreateSupplierSchema", () => {
  test("accepts valid supplier", () => {
    const result = CreateSupplierSchema.safeParse({
      code: "SUP-001",
      name: "Acme Corp",
      email: "info@acme.com",
      paymentTerms: 30,
    });
    expect(result.success).toBe(true);
  });

  test("applies default paymentTerms", () => {
    const result = CreateSupplierSchema.safeParse({
      code: "SUP-001",
      name: "Acme Corp",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paymentTerms).toBe(30);
    }
  });

  test("rejects invalid email", () => {
    const result = CreateSupplierSchema.safeParse({
      code: "SUP-001",
      name: "Acme",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  test("accepts empty email string", () => {
    const result = CreateSupplierSchema.safeParse({
      code: "SUP-001",
      name: "Acme",
      email: "",
    });
    expect(result.success).toBe(true);
  });

  test("rejects rating > 5", () => {
    const result = CreateSupplierSchema.safeParse({
      code: "SUP-001",
      name: "Acme",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// CreatePOSchema
// ============================================================

describe("CreatePOSchema", () => {
  const validPO = {
    supplierId: "550e8400-e29b-41d4-a716-446655440000",
    lines: [
      {
        itemId: "550e8400-e29b-41d4-a716-446655440001",
        quantity: 100,
        unitCost: 10.5,
      },
    ],
  };

  test("accepts valid PO", () => {
    const result = CreatePOSchema.safeParse(validPO);
    expect(result.success).toBe(true);
  });

  test("requires at least one line", () => {
    const result = CreatePOSchema.safeParse({
      supplierId: "550e8400-e29b-41d4-a716-446655440000",
      lines: [],
    });
    expect(result.success).toBe(false);
  });

  test("rejects zero quantity", () => {
    const result = CreatePOSchema.safeParse({
      ...validPO,
      lines: [{ itemId: "550e8400-e29b-41d4-a716-446655440001", quantity: 0, unitCost: 10 }],
    });
    expect(result.success).toBe(false);
  });

  test("rejects negative unitCost", () => {
    const result = CreatePOSchema.safeParse({
      ...validPO,
      lines: [{ itemId: "550e8400-e29b-41d4-a716-446655440001", quantity: 10, unitCost: -5 }],
    });
    expect(result.success).toBe(false);
  });

  test("accepts optional expectedDate", () => {
    const result = CreatePOSchema.safeParse({
      ...validPO,
      expectedDate: "2026-03-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  test("accepts multiple lines", () => {
    const result = CreatePOSchema.safeParse({
      ...validPO,
      lines: [
        { itemId: "550e8400-e29b-41d4-a716-446655440001", quantity: 50, unitCost: 10 },
        { itemId: "550e8400-e29b-41d4-a716-446655440002", quantity: 25, unitCost: 20 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdatePOSchema", () => {
  test("allows partial PO updates", () => {
    const result = UpdatePOSchema.safeParse({ notes: "Updated notes" });
    expect(result.success).toBe(true);
  });

  test("validates lines when provided", () => {
    const result = UpdatePOSchema.safeParse({
      lines: [{ itemId: "not-uuid", quantity: 10, unitCost: 5 }],
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Receiving Schemas
// ============================================================

describe("CreateReceivingSchema", () => {
  test("accepts valid receiving data", () => {
    const result = CreateReceivingSchema.safeParse({
      purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      lines: [
        { itemId: "550e8400-e29b-41d4-a716-446655440001", receivedQty: 50 },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("rejects zero receivedQty", () => {
    const result = CreateReceivingSchema.safeParse({
      purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      lines: [
        { itemId: "550e8400-e29b-41d4-a716-446655440001", receivedQty: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("QCInspectSchema", () => {
  test("accepts valid QC inspection", () => {
    const result = QCInspectSchema.safeParse({
      qcResult: "ACCEPTED",
      lines: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          acceptedQty: 50,
          rejectedQty: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("accepts PARTIAL result", () => {
    const result = QCInspectSchema.safeParse({
      qcResult: "PARTIAL",
      lines: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          acceptedQty: 30,
          rejectedQty: 20,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("accepts REJECTED result", () => {
    const result = QCInspectSchema.safeParse({
      qcResult: "REJECTED",
      lines: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          acceptedQty: 0,
          rejectedQty: 50,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid qcResult", () => {
    const result = QCInspectSchema.safeParse({
      qcResult: "INVALID",
      lines: [{ id: "550e8400-e29b-41d4-a716-446655440000", acceptedQty: 0, rejectedQty: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("WarehouseReceiveSchema", () => {
  test("accepts valid warehouse receive", () => {
    const result = WarehouseReceiveSchema.safeParse({
      locationId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  test("accepts optional batchNumber", () => {
    const result = WarehouseReceiveSchema.safeParse({
      locationId: "550e8400-e29b-41d4-a716-446655440000",
      batchNumber: "BATCH-2026-001",
    });
    expect(result.success).toBe(true);
  });

  test("rejects missing locationId", () => {
    const result = WarehouseReceiveSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Internal Request Schemas
// ============================================================

describe("CreateRequestSchema", () => {
  test("accepts valid request", () => {
    const result = CreateRequestSchema.safeParse({
      lines: [
        {
          itemId: "550e8400-e29b-41d4-a716-446655440000",
          requestedQty: 10,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty lines", () => {
    const result = CreateRequestSchema.safeParse({ lines: [] });
    expect(result.success).toBe(false);
  });
});

describe("FulfillRequestSchema", () => {
  test("accepts valid fulfillment", () => {
    const result = FulfillRequestSchema.safeParse({
      lines: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          issuedQty: 10,
        },
      ],
      locationId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });

  test("allows zero issuedQty", () => {
    const result = FulfillRequestSchema.safeParse({
      lines: [{ id: "550e8400-e29b-41d4-a716-446655440000", issuedQty: 0 }],
      locationId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
  });
});

describe("ConfirmRequestSchema", () => {
  test("accepts valid confirmation", () => {
    const result = ConfirmRequestSchema.safeParse({
      lines: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          confirmedQty: 10,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("accepts hasDiscrepancy flag", () => {
    const result = ConfirmRequestSchema.safeParse({
      lines: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          confirmedQty: 8,
        },
      ],
      hasDiscrepancy: true,
      notes: "2 items damaged",
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// Transfer Schemas
// ============================================================

describe("CreateTransferSchema", () => {
  test("accepts valid transfer", () => {
    const result = CreateTransferSchema.safeParse({
      fromLocationId: "550e8400-e29b-41d4-a716-446655440000",
      toLocationId: "550e8400-e29b-41d4-a716-446655440001",
      lines: [
        {
          itemId: "550e8400-e29b-41d4-a716-446655440002",
          quantity: 25,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("rejects missing fromLocationId", () => {
    const result = CreateTransferSchema.safeParse({
      toLocationId: "550e8400-e29b-41d4-a716-446655440001",
      lines: [{ itemId: "550e8400-e29b-41d4-a716-446655440002", quantity: 25 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("TransferReceiveSchema", () => {
  test("accepts valid transfer receive", () => {
    const result = TransferReceiveSchema.safeParse({
      lines: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          receivedQty: 25,
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// Payment Schema
// ============================================================

describe("CreatePaymentSchema", () => {
  test("accepts valid payment", () => {
    const result = CreatePaymentSchema.safeParse({
      purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      amount: 1500.0,
    });
    expect(result.success).toBe(true);
  });

  test("rejects zero amount", () => {
    const result = CreatePaymentSchema.safeParse({
      purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  test("rejects negative amount", () => {
    const result = CreatePaymentSchema.safeParse({
      purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  test("accepts optional payment method and reference", () => {
    const result = CreatePaymentSchema.safeParse({
      purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      amount: 500,
      paymentMethod: "Wire Transfer",
      referenceNumber: "REF-12345",
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// Export Schema
// ============================================================

describe("ExportExcelSchema", () => {
  test("accepts valid export data", () => {
    const result = ExportExcelSchema.safeParse({
      title: "Inventory Report",
      columns: [
        { header: "Item", key: "item" },
        { header: "Quantity", key: "qty", width: 15 },
      ],
      rows: [{ item: "Flour", qty: 100 }],
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty columns", () => {
    const result = ExportExcelSchema.safeParse({
      title: "Report",
      columns: [],
      rows: [],
    });
    expect(result.success).toBe(false);
  });

  test("accepts empty rows", () => {
    const result = ExportExcelSchema.safeParse({
      title: "Report",
      columns: [{ header: "Col", key: "col" }],
      rows: [],
    });
    expect(result.success).toBe(true);
  });
});

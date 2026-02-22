import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, apiError } from "@/lib/api-utils";
import ExcelJS from "exceljs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const body = await request.json();
    const { title, columns, rows } = body as {
      title: string;
      columns: { header: string; key: string; width?: number }[];
      rows: Record<string, unknown>[];
    };

    if (!title || !columns || !Array.isArray(columns) || !rows || !Array.isArray(rows)) {
      return apiError("title, columns, and rows are required");
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Supply Chain ERP";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title.slice(0, 31));

    // Title row
    sheet.mergeCells(1, 1, 1, columns.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };

    // Tenant & date row
    sheet.mergeCells(2, 1, 2, columns.length);
    const infoCell = sheet.getCell(2, 1);
    infoCell.value = `${user.tenantName} | Generated: ${new Date().toLocaleString()} | By: ${user.fullName}`;
    infoCell.font = { size: 9, italic: true, color: { argb: "FF666666" } };
    infoCell.alignment = { horizontal: "center" };

    // Empty row
    sheet.addRow([]);

    // Header row (row 4)
    const headerRow = sheet.addRow(columns.map((c) => c.header));
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E79" },
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF000000" } },
      };
      cell.alignment = { horizontal: "center" };
    });

    // Set column widths
    columns.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width || 15;
      sheet.getColumn(i + 1).key = col.key;
    });

    // Data rows
    for (const row of rows) {
      const dataRow = sheet.addRow(columns.map((c) => row[c.key] ?? ""));
      dataRow.eachCell((cell) => {
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
      });
    }

    // Alternate row colors
    for (let i = 5; i <= sheet.rowCount; i++) {
      if (i % 2 === 0) {
        const row = sheet.getRow(i);
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F7FB" },
          };
        });
      }
    }

    // Freeze header
    sheet.views = [{ state: "frozen", ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("POST /api/export/excel error:", e);
    return apiError("Failed to generate Excel file", 500);
  }
}

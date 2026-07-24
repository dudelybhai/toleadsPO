import ExcelJS from "exceljs";

const headerFill = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FF1F4E78" }
};

export function styleSheet(sheet: ExcelJS.Worksheet, widths: number[]) {
  const row = sheet.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = headerFill;
  row.alignment = { horizontal: "center" };
  row.height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: widths.length }
  };
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

export function cellText(value: ExcelJS.CellValue) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && "text" in value) return String(value.text);
  if (typeof value === "object" && "result" in value) return String(value.result ?? "");
  return String(value).trim();
}

export function sheetRows(sheet: ExcelJS.Worksheet | undefined) {
  if (!sheet) return [] as Record<string, string>[];
  const values = sheet.getRow(1).values;
  const headerValues: ExcelJS.CellValue[] = Array.isArray(values)
    ? values.slice(1)
    : [];
  const headers = headerValues
    .map((value) => cellText(value).toLowerCase());
  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const result: Record<string, string> = {};
    headers.forEach((header, index) => {
      result[header] = cellText(row.getCell(index + 1).value);
    });
    if (Object.values(result).some(Boolean)) rows.push(result);
  });
  return rows;
}

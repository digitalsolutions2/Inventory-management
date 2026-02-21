export async function exportToExcel(
  title: string,
  columns: { header: string; key: string; width?: number }[],
  rows: object[]
) {
  const res = await fetch("/api/export/excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, columns, rows }),
  });
  if (res.ok) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

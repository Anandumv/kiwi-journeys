/** Quote a CSV field and prevent spreadsheet formulas in customer-supplied text. */
export function csvCell(value: string): string {
  const text = /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${text.replace(/"/g, '""')}"`;
}

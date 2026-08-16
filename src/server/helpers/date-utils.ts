export function formatIsoDate(date: unknown): string | null {
  if (date === null || date === undefined || date === "") return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof date === "string") {
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toISOString();
  }
  if (typeof date === "number") {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

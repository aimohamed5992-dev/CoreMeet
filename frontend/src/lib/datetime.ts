/**
 * Parse a timestamp coming from the API. ASP.NET serializes UTC `DateTime`s with
 * a trailing `Z`, but values loaded via some paths arrive without a zone — assume
 * UTC in that case. Also trims sub-millisecond precision that some engines reject.
 */
export function parseServerDate(value: string): Date {
  let v = value.trim();
  v = v.replace(/(\.\d{3})\d+/, "$1"); // 6-digit fractional seconds → 3
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(v)) v += "Z";
  return new Date(v);
}

export function formatTime(value: string): string {
  const d = parseServerDate(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(value: string): string {
  const d = parseServerDate(value);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return "";
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return d.toLocaleDateString();
}

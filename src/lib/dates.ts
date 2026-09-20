/**
 * Digital Heroes - Date Utilities and Timezone Handling
 */

export function formatDate(dateStringOrDate: string | Date): string {
  const d = typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : dateStringOrDate;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(dateStringOrDate: string | Date): string {
  const d = typeof dateStringOrDate === "string" ? new Date(dateStringOrDate) : dateStringOrDate;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Returns YYYY-MM-DD string
 */
export function toIsoDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Returns the first day of the given month as YYYY-MM-01
 */
export function getDrawMonthString(year: number, month1Indexed: number): string {
  const paddedMonth = month1Indexed.toString().padStart(2, "0");
  return `${year}-${paddedMonth}-01`;
}

/**
 * Checks if a given date string (YYYY-MM-DD) is in the future relative to today
 */
export function isFutureDate(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return target > today;
}

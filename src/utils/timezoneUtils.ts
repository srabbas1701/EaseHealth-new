/**
 * Timezone Utilities for IST (Indian Standard Time)
 * All dates and times in the application should use IST
 */

const IST_OFFSET = 330; // IST is UTC+5:30 (330 minutes)

/**
 * Get current date/time in IST
 */
export function getNowIST(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (IST_OFFSET * 60000));
}

/**
 * Convert a date to IST date string (YYYY-MM-DD)
 * This ensures dates are always interpreted in IST, not local timezone
 */
export function toISTDateString(date: Date): string {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (IST_OFFSET * 60000));

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Create a date object from YYYY-MM-DD string in IST
 */
export function fromISTDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Adjust for IST offset
  const utc = date.getTime();
  const istDate = new Date(utc - (IST_OFFSET * 60000));

  return istDate;
}

/**
 * Get start of week (Sunday) in IST
 */
export function getStartOfWeekIST(date?: Date): Date {
  const d = date ? new Date(date) : getNowIST();
  const istDate = getNowIST();
  istDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
  istDate.setHours(0, 0, 0, 0);

  const day = istDate.getDay();
  istDate.setDate(istDate.getDate() - day);

  return istDate;
}

/**
 * Get today's date at midnight in IST
 */
export function getTodayIST(): Date {
  const today = getNowIST();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Format time in IST (HH:MM format)
 */
export function formatTimeIST(date: Date): string {
  const istDate = getNowIST();
  istDate.setTime(date.getTime());

  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Check if a date is in the past (IST)
 */
export function isPastDateIST(dateStr: string): boolean {
  const today = getTodayIST();
  const todayStr = toISTDateString(today);
  return dateStr < todayStr;
}

/**
 * Add days to a date in IST
 */
export function addDaysIST(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

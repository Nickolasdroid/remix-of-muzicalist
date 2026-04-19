import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC).
 * This prevents timezone issues where dates shift by a day.
 */
export function parseYMDToLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to YYYY-MM-DD string using local date components.
 */
export function formatLocalDateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Format a date string smartly:
 * - "Just now" / "Xh ago" / "Xd ago" for recent dates
 * - "Mon DD" for dates in the current year (no year shown)
 * - "Mon DD, YYYY" for dates from previous years
 */
export function formatSmartDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  const isCurrentYear = date.getFullYear() === now.getFullYear();
  if (isCurrentYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date string for display (no relative time):
 * - "Mon DD" for current year
 * - "Mon DD, YYYY" for other years
 */
/**
 * Sanitize a filename for use in Supabase Storage keys.
 * Storage rejects keys with characters like •, /, parentheses, accents, etc.
 * Keeps only alphanumerics, dot, dash, and underscore.
 */
export function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot > 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot > 0 ? name.slice(lastDot) : '';
  const cleanBase = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_.-]+|[_.-]+$/g, '')
    .slice(0, 80) || 'file';
  const cleanExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
  return `${cleanBase}${cleanExt}`;
}

export function formatDateNoYear(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();
  if (isCurrentYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

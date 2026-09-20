/**
 * Central Date & Time Formatting Utilities for CivicPulse
 * Uses user's local browser locale and standard formatting.
 */

/**
 * Formats a date into "20 Sep 2026, 10:42 AM"
 */
export function formatExactDateTime(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const datePart = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timePart = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${datePart}, ${timePart}`;
}

/**
 * Formats a date into "20 September 2026"
 */
export function formatFullDate(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formats a date into "20 Sep 2026"
 */
export function formatDateOnly(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats time into "10:42 AM"
 */
export function formatTimeOnly(dateInput?: string | number | Date | null): string {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Returns structured { date: "20 September 2026", time: "10:42 AM" }
 */
export function formatDetailDateTime(dateInput?: string | number | Date | null): { date: string; time: string } {
  if (!dateInput) return { date: '—', time: '—' };
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return { date: '—', time: '—' };

  return {
    date: date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })
  };
}

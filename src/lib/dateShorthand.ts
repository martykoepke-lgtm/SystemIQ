/**
 * Date shorthand parser — supports T (today), T+1, T-1, W+1, M-1, Y+1, N (now)
 * Copied from GovernIQ pattern.
 */

export function parseDateShorthand(input: string): Date | null {
  const s = input.trim().toUpperCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (s === 'T' || s === 'TODAY') return today;
  if (s === 'N' || s === 'NOW') return new Date();

  const match = s.match(/^([TWMY])([+-])(\d+)$/);
  if (!match) return null;

  const [, unit, op, numStr] = match;
  const n = parseInt(numStr, 10);
  const offset = op === '+' ? n : -n;
  const result = new Date(today);

  switch (unit) {
    case 'T':
      result.setDate(result.getDate() + offset);
      break;
    case 'W':
      result.setDate(result.getDate() + offset * 7);
      break;
    case 'M':
      result.setMonth(result.getMonth() + offset);
      break;
    case 'Y':
      result.setFullYear(result.getFullYear() + offset);
      break;
  }
  return result;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function resolveShorthand(input: string): string | null {
  const parsed = parseDateShorthand(input);
  return parsed ? formatDateISO(parsed) : null;
}

// Shared date helpers.
//
// IMPORTANT: Android's JS engine (Hermes) mis-parses some date strings via
// `new Date(str)`, occasionally returning the wrong year (e.g. a stored ISO
// birth date rendering as year 0036). To stay deterministic across iOS and
// Android we extract the calendar parts from the ISO string ourselves instead
// of trusting the engine's string parser.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type DateParts = { year: number; month: number; day: number };

/** Pull {year, month(0-11), day} from a Date, ISO string, or timestamp. */
export const getDateParts = (value: string | number | Date | null | undefined): DateParts | null => {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return { year: value.getFullYear(), month: value.getMonth(), day: value.getDate() };
  }

  const str = String(value).trim();

  // Preferred path: ISO date or datetime "YYYY-MM-DD..." — read the literal
  // calendar parts so no engine parsing (and no timezone drift) is involved.
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]) - 1, day: Number(iso[3]) };
  }

  // Fallback for anything else the engine can still understand.
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), month: parsed.getMonth(), day: parsed.getDate() };
  }

  return null;
};

/**
 * Serialize a picker Date to the canonical date-only wire format "YYYY-MM-DD"
 * using LOCAL calendar getters. Never use toISOString() for calendar dates —
 * it converts to UTC and shifts the day for any timezone east of UTC.
 */
export const toISODateString = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Build a Date at LOCAL midnight of the stored calendar day, for seeding
 * DateTimePicker. Avoids `new Date(string)` (Hermes mis-parse hazard) and
 * guarantees the picker opens on exactly the day the UI displays.
 */
export const toPickerDate = (value: string | number | Date | null | undefined): Date | null => {
  const parts = getDateParts(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month, parts.day);
};

/** Format a date value as e.g. "5 January 1990". Returns '' if unparseable. */
export const formatDate = (value: string | number | Date | null | undefined): string => {
  const parts = getDateParts(value);
  if (!parts || !MONTHS[parts.month]) return '';
  return `${parts.day} ${MONTHS[parts.month]} ${parts.year}`;
};

/** Whole years between a birth date and today, or null if unparseable/implausible. */
export const calculateAge = (value: string | number | Date | null | undefined): number | null => {
  const parts = getDateParts(value);
  if (!parts) return null;

  const today = new Date();
  let years = today.getFullYear() - parts.year;
  const monthDiff = today.getMonth() - parts.month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parts.day)) {
    years--;
  }

  return years >= 0 && years < 130 ? years : null;
};

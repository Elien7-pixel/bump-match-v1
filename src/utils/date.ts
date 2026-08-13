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

  // Month-only wire value "YYYY-MM" (due dates are captured by month, not day).
  // Anchored to day 1 so callers needing a Date stay deterministic — the point is
  // to never reach the `new Date(str)` fallback below, which Hermes mis-parses.
  // Use formatDueDate/monthBounds rather than assuming this day means anything.
  const isoMonth = str.match(/^(\d{4})-(\d{2})$/);
  if (isoMonth) {
    return { year: Number(isoMonth[1]), month: Number(isoMonth[2]) - 1, day: 1 };
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

/* ── Month-only values ────────────────────────────────────────────────────────
 * Due dates are captured as a month ("2027-03"), because people rarely know the
 * exact day and a wrong day makes the pregnancy tracker quietly wrong. Full
 * "YYYY-MM-DD" due dates from before this change are still stored and rendered,
 * so every helper here accepts both shapes.
 * ────────────────────────────────────────────────────────────────────────────*/

/** True for the month-only wire format "YYYY-MM". */
export const isMonthOnly = (value: string | null | undefined): boolean =>
  typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value.trim());

/**
 * Serialize a Date to the month-only wire format "YYYY-MM" using LOCAL calendar
 * getters, for the same timezone reason as toISODateString.
 */
export const toISOMonthString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/**
 * Normalize any date or month value to the month-only wire format "YYYY-MM",
 * so a legacy full due date still selects the right row in the month picker.
 */
export const toMonthValue = (value: string | number | Date | null | undefined): string | null => {
  const parts = getDateParts(value);
  if (!parts) return null;
  return `${parts.year}-${String(parts.month + 1).padStart(2, '0')}`;
};

/** Format any date or month value as e.g. "March 2027". Returns '' if unparseable. */
export const formatMonth = (value: string | number | Date | null | undefined): string => {
  const parts = getDateParts(value);
  if (!parts || !MONTHS[parts.month]) return '';
  return `${MONTHS[parts.month]} ${parts.year}`;
};

/**
 * Display a due date at the precision it was actually captured: "March 2027" for
 * month-only values, "5 March 2027" for legacy full dates. Never invents a day.
 */
export const formatDueDate = (value: string | number | Date | null | undefined): string =>
  isMonthOnly(typeof value === 'string' ? value : undefined) ? formatMonth(value) : formatDate(value);

/**
 * First and last local-midnight days of a month value — the range the real due
 * date could fall in. Callers derive a gestational range from this instead of
 * pretending a single day.
 */
export const monthBounds = (
  value: string | number | Date | null | undefined,
): { first: Date; last: Date } | null => {
  const parts = getDateParts(value);
  if (!parts) return null;
  return {
    first: new Date(parts.year, parts.month, 1),
    // Day 0 of the next month is the last day of this one, leap years included.
    last: new Date(parts.year, parts.month + 1, 0),
  };
};

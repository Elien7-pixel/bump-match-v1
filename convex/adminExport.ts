// CSV export helpers for the admin users dashboard. Helper module only — no
// Convex functions are registered here.

export interface AdminUserRow {
  id: string;
  registeredAt: number;
  firstName: string;
  surname: string;
  email: string;
  dateOfBirth: string;
  ageYears: number | null;
  gender: string;
  expecting: string;
  status: string;
  dueDate: string;
  country: string;
  province: string;
  heritage: string[];
  inviteCode: string;
  partnerName: string;
  partnerEmail: string;
  isPaired: boolean;
  revealDate: number | null;
  revealDateConfirmed: boolean;
  pushEnabled: boolean;
  likedNames: number;
  favouriteNames: number;
  submittedNames: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return (
    d.getUTCFullYear() +
    "-" + pad(d.getUTCMonth() + 1) +
    "-" + pad(d.getUTCDate()) +
    " " + pad(d.getUTCHours()) +
    ":" + pad(d.getUTCMinutes())
  );
}

function formatDate(ts: number | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
}

const GENDER_LABELS: Record<string, string> = {
  mom: "Mum",
  dad: "Dad",
  partner: "Partner",
};

const EXPECTING_LABELS: Record<string, string> = {
  boy: "Boy",
  girl: "Girl",
  unknown: "Don't know yet",
};

export const USER_CSV_COLUMNS: { header: string; get: (row: AdminUserRow) => unknown }[] = [
  { header: "Registered (UTC)", get: (r) => formatDateTime(r.registeredAt) },
  { header: "First name", get: (r) => r.firstName },
  { header: "Surname", get: (r) => r.surname },
  { header: "Email", get: (r) => r.email },
  { header: "Date of birth", get: (r) => r.dateOfBirth },
  { header: "Age", get: (r) => r.ageYears },
  { header: "Role", get: (r) => GENDER_LABELS[r.gender] ?? r.gender },
  { header: "Expecting", get: (r) => EXPECTING_LABELS[r.expecting] ?? r.expecting },
  { header: "Status", get: (r) => r.status },
  { header: "Due date", get: (r) => r.dueDate },
  { header: "Country", get: (r) => r.country },
  { header: "Province", get: (r) => r.province },
  { header: "Heritage", get: (r) => r.heritage },
  { header: "Invite code", get: (r) => r.inviteCode },
  { header: "Paired", get: (r) => r.isPaired },
  { header: "Partner name", get: (r) => r.partnerName },
  { header: "Partner email", get: (r) => r.partnerEmail },
  { header: "Reveal date", get: (r) => formatDate(r.revealDate) },
  { header: "Reveal date confirmed", get: (r) => r.revealDateConfirmed },
  { header: "Push enabled", get: (r) => r.pushEnabled },
  { header: "Liked names", get: (r) => r.likedNames },
  { header: "Favourite names", get: (r) => r.favouriteNames },
  { header: "Names submitted", get: (r) => r.submittedNames },
  { header: "User ID", get: (r) => r.id },
];

function csvCell(value: unknown): string {
  let text: string;
  if (value === null || value === undefined) text = "";
  else if (Array.isArray(value)) text = value.join("; ");
  else if (typeof value === "boolean") text = value ? "Yes" : "No";
  else text = String(value);

  // Neutralise spreadsheet formula injection — a name or heritage entry
  // starting with = + - @ would otherwise execute when opened in Excel.
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;

  return '"' + text.replace(/"/g, '""') + '"';
}

export function buildUsersCsv(rows: AdminUserRow[]): string {
  const lines = [USER_CSV_COLUMNS.map((c) => csvCell(c.header)).join(",")];
  for (const row of rows) {
    lines.push(USER_CSV_COLUMNS.map((c) => csvCell(c.get(row))).join(","));
  }
  // Leading BOM so Excel opens it as UTF-8; CRLF line endings for Excel/Sheets.
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export function usersCsvFilename(now: number): string {
  return "bump-match-users-" + formatDate(now) + ".csv";
}

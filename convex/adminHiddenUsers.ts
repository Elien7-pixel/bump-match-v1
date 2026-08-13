// Accounts suppressed from the admin dashboard and its CSV exports.
//
// These are internal, staff, and test registrations. Hiding them keeps the
// headline user numbers honest without touching the database: every row below
// still exists, still has its liked names and partner links, and still works as
// a login. Nothing here deletes or edits a user — this list only decides what
// `adminUsers.getAllUsers` hands to the dashboard.
//
// To un-hide someone, delete their line. To hide someone new, add their email in
// lowercase. The dashboard shows how many accounts this list is suppressing so
// the totals are never silently short.
export const HIDDEN_EMAILS: ReadonlySet<string> = new Set([
  "matandaevans@gmail.com",
  "phologokgaphola@gmail.com",
  "caylar1492@gmail.com",
  "champion1adk@gmail.com",
  "lesedidgwebu@gmail.com",
  "testreviewer@bumpmatch.com",
  "elton@gmail.com",
  "lara@sherbetagency.com",
  "raffmccreadie@gmail.com",
  "icrane205@gmail.com",
  "kazemberacheal2@gmail.com",
  "fiercetiger1007@gmail.com",
  "raff@sherbetagency.com",
  "v@gmail.com",
  "lesedigwebu01@gmail.com",
  "mccoyleonard566@gmail.com",
  "tomhanny@sherbet.com",
  "ai@sherbetagency.com",
  "chiara.richa74242@icloud.com",
  "dakilenkanyezi@gmail.com",
  // Second pass. Note the two Elton accounts are different people-records, and
  // that this hides Caroline Bankart but deliberately not Caroline Magorimbo.
  "urmafritz@gmail.com",
  "eltonmatanda@gmailcom",
  "elton@sherbetagency.com",
  "ingeliebenberg@yahoo.com",
  "caroline@sherbetagency.com",
  "nickypersonal@icloud.com",
  "everything4quizley@gmail.com",
  "angelika.sansotta@gmail.com",
  "mhindorussell@gmail.com",
  "tonymackey741@gmail.com",
  "tigerx1007@gmail.com",
]);

/** Case- and whitespace-insensitive, because stored emails are not all clean. */
export function isHiddenUser(email: string | undefined): boolean {
  if (!email) return false;
  return HIDDEN_EMAILS.has(email.trim().toLowerCase());
}

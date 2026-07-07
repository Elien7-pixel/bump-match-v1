// Turns raw backend/Convex errors into clean, user-facing messages.
//
// Convex surfaces a thrown server error to the client as a long string like:
//   "[CONVEX M(auth:login)] [Request ID: abc] Server Error
//    Uncaught Error: Invalid email or password at handler (../convex/auth.ts:113)"
// Showing that verbatim leaks "Convex" and stack details to the user, so we
// extract just the human message our backend threw, or fall back to a generic.

export const cleanErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  const raw = typeof error === 'string' ? error : (error as any)?.message ?? '';
  if (!raw) return fallback;

  let msg = String(raw);

  // Prefer the message our backend actually threw ("Uncaught Error: <msg>").
  const match = msg.match(/Uncaught\s+(?:Convex)?Error:?\s*([^\n]*)/i);
  if (match && match[1]) msg = match[1];

  // Strip stack fragments and Convex framing noise.
  msg = msg
    .replace(/\s+at\s+.*/s, '')
    .replace(/\[Request ID:[^\]]*\]/gi, '')
    .replace(/\[CONVEX[^\]]*\]/gi, '')
    .replace(/Server Error/gi, '')
    .trim();

  // If anything technical survived, don't show it.
  if (!msg || /convex|uncaught|https?:\/\/|[{}]/i.test(msg)) return fallback;

  return msg;
};

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Refresh the trending list every Monday morning from the past week's likes.
crons.weekly(
  "refresh-trending",
  { dayOfWeek: "monday", hourUTC: 6, minuteUTC: 0 },
  internal.trending.refreshTrendingWeekly,
  {}
);

export default crons;

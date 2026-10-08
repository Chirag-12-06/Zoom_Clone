// A fixed locale so the server render and the browser render produce the same text
const LOCALE = "en-US";

/** "84213976502" -> "842 1397 6502", the way Zoom displays meeting IDs */
export function formatMeetingCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3, 7)} ${code.slice(7)}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
}

/** "Thursday, October 8" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" });
}

/** "Today", "Tomorrow" or e.g. "Sat, Oct 10" */
export function formatDayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString(LOCALE, { weekday: "short", month: "short", day: "numeric" });
}

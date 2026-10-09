import type { DayHours } from "./types";

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const TZ = "America/Toronto";

/** "09:00" → "9 a.m.", "19:30" → "7:30 p.m." */
export function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hh = h % 12 || 12;
  return `${hh}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "a.m." : "p.m."}`;
}

export function fmtDay(h: DayHours | undefined) {
  if (!h || h.closed) return "Closed";
  return `${fmtTime(h.open)} – ${fmtTime(h.close)}`;
}

/** Current day/minute in the shop's time zone (not the visitor's). */
export function shopNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };

export type OpenState = { open: boolean; label: string; sub: string };

/** "Open now · until 7 p.m." / "Closed · opens 9 a.m. tomorrow" */
export function openState(hours: DayHours[], now = new Date()): OpenState {
  const { day, minutes } = shopNow(now);
  const today = hours.find((h) => h.day === day);
  if (today && !today.closed && minutes >= mins(today.open) && minutes < mins(today.close)) {
    const left = mins(today.close) - minutes;
    return { open: true, label: left <= 60 ? "Closing soon" : "Open now", sub: `until ${fmtTime(today.close)}` };
  }
  if (today && !today.closed && minutes < mins(today.open)) return { open: false, label: "Closed", sub: `opens ${fmtTime(today.open)} today` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const h = hours.find((x) => x.day === d);
    if (h && !h.closed) return { open: false, label: "Closed", sub: `opens ${fmtTime(h.open)} ${i === 1 ? "tomorrow" : DAYS[d]}` };
  }
  return { open: false, label: "Closed", sub: "see hours" };
}

/** Monday-first rows for tables. */
export const weekRows = (hours: DayHours[]) =>
  [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: d, name: DAYS[d], hours: hours.find((h) => h.day === d) }));

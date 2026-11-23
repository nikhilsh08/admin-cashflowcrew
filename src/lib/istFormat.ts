const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export const istDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const istDateTime = (iso: string | null | undefined) => (iso ? `${dateTimeFmt.format(new Date(iso))} IST` : "—");

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

// A date typed in a form, moved by whole days: ("2026-11-25", 1) -> "2026-11-26".
// "" while the date is not complete.
export const addDaysYmd = (ymd: string, days: number): string => {
  const m = YMD.exec(ymd);
  if (!m || !Number.isFinite(days)) return "";
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days)).toISOString().slice(0, 10);
};

// Whole days from one typed date to another; null while either is not complete.
export const daysBetweenYmd = (fromYmd: string, toYmd: string): number | null => {
  const a = YMD.exec(fromYmd);
  const b = YMD.exec(toYmd);
  if (!a || !b) return null;
  const at = (m: RegExpExecArray) => Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.round((at(b) - at(a)) / 86_400_000);
};

// IST is UTC+05:30 all year, so a fixed shift is exact.
const inIst = (iso: string) => new Date(new Date(iso).getTime() + 330 * 60_000).toISOString();

// An instant as a date field takes it, in IST: "2026-11-21".
export const istYmd = (iso: string): string => inIst(iso).slice(0, 10);

// An instant as a time field takes it, in IST: "19:00".
export const istHm = (iso: string): string => inIst(iso).slice(11, 16);

// The two days a batch runs on, from the dates typed in a form:
// ("2026-11-25", "2026-11-28") -> "Day 1: Wednesday 25 Nov · Day 2: Saturday 28 Nov".
// Day 1 can be any day of the week and day 2 any later date; while day 2 is
// not typed yet it is taken as the day after day 1. "" while day 1 is not
// complete.
export const batchDaysText = (day1Ymd: string, day2Ymd = ""): string => {
  const dayText = (ymd: string) => {
    const m = YMD.exec(ymd);
    if (!m) return "";
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  };
  const day1 = dayText(day1Ymd);
  if (!day1) return "";
  return `Day 1: ${day1} · Day 2: ${dayText(day2Ymd) || dayText(addDaysYmd(day1Ymd, 1))}`;
};

export const rupees = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `₹${n.toLocaleString("en-IN")}`;

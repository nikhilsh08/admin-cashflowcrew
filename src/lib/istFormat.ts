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

// The two days a batch runs on, from the day-1 date typed in a form:
// "2026-11-25" -> "Day 1: Wednesday 25 Nov · Day 2: Thursday 26 Nov".
// Day 1 can be any day of the week; day 2 is always the day after.
// "" while the date is not complete.
export const batchDaysText = (day1Ymd: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day1Ymd);
  if (!m) return "";
  const dayText = (offset: number) => {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + offset));
    return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  };
  return `Day 1: ${dayText(0)} · Day 2: ${dayText(1)}`;
};

export const rupees = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `₹${n.toLocaleString("en-IN")}`;

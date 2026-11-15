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

export const rupees = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `₹${n.toLocaleString("en-IN")}`;

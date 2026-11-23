import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { daysBetweenYmd, istYmd } from "@/lib/istFormat";

const SERVER = import.meta.env.VITE_SERVER_URL;

type Status = "live" | "batch_full" | "no_batch_on_sale" | "course_missing" | "course_unpublished" | "not_sold_in_batches";

interface LandingPage {
  key: string;
  // "v10" | "v20" | "v30": the value chosen on the course form.
  page: string;
  name: string;
  url: string;
  paths: { landing: string; checkout: string; thankYou: string };
  status: Status;
  course: { id: string; title: string; slug: string } | null;
  sharesCourseWith: string[];
  batchOnSale: {
    id: string;
    batchNumber: number;
    day1StartAt: string;
    day2StartAt: string;
    bookingCloseAt: string;
    priceRupees: number;
    paidSeats: number;
    // Seats per batch on this page; null = no limit (/v10).
    seatLimit?: number | null;
    seatsLeft: number | null;
  } | null;
  orders: {
    paid: number;
    revenueRupees: number;
    pending: number;
    failed: number;
    paidLast30Days: number;
    revenueLast30DaysRupees: number;
  };
}

interface Tracking {
  metaPixelId: string | null;
  metaCapi: boolean;
  metaCapiTestMode: boolean;
  ga4Id: string | null;
  ga4ViaGtm: boolean;
  gtmId: string | null;
  clarityId: string | null;
  events: { landing: string[]; checkout: string[]; thankYou: string[] };
}

// What each status means and what the owner does about it.
const STATUS: Record<Status, { label: string; tone: "ok" | "warn" | "bad"; fix?: { text: string; to: string } }> = {
  live: { label: "Live, selling", tone: "ok" },
  batch_full: { label: "Batch full, not selling", tone: "warn", fix: { text: "Open the next batch", to: "/admin/batches" } },
  no_batch_on_sale: { label: "No batch on sale", tone: "warn", fix: { text: "Open a batch", to: "/admin/batches" } },
  course_missing: { label: "No course linked", tone: "bad", fix: { text: "Link a course in Masterclasses", to: "/admin/masterclasses" } },
  course_unpublished: { label: "Course not published", tone: "bad", fix: { text: "Publish the course", to: "/admin/masterclasses" } },
  not_sold_in_batches: { label: "Course not sold in batches", tone: "bad", fix: { text: "Link the course to this page again in Masterclasses", to: "/admin/masterclasses" } },
};

const TONE = {
  ok: "bg-green-100 text-green-800 border-green-200",
  warn: "bg-amber-100 text-amber-800 border-amber-200",
  bad: "bg-red-100 text-red-800 border-red-200",
};

const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
const istDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(new Date(iso));
const istWeekday = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" }).format(new Date(iso));
const istTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

// The two days of the batch on sale, each with its own weekday:
//   "Sat 21 Nov – Sun 22 Nov, 10:00 am IST"                      two days in a row, one start time
//   "Sat 21 Nov and Sat 28 Nov, 10:00 am IST"                    not in a row
//   "Sat 21 Nov, 10:00 am IST and Wed 25 Nov, 7:00 pm IST"       each day at its own time
const batchDaysLine = (day1Iso: string, day2Iso: string) => {
  const day1 = `${istWeekday(day1Iso)} ${istDate(day1Iso)}`;
  const day2 = `${istWeekday(day2Iso)} ${istDate(day2Iso)}`;
  const time1 = istTime(day1Iso);
  const time2 = istTime(day2Iso);
  if (time1 !== time2) return `${day1}, ${time1} IST and ${day2}, ${time2} IST`;
  const inARow = daysBetweenYmd(istYmd(day1Iso), istYmd(day2Iso)) === 1;
  return `${day1} ${inARow ? "–" : "and"} ${day2}, ${time1} IST`;
};

const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && (error.response?.data?.message as string)) || fallback;

function TagRow({ name, value, ok, note }: { name: string; value: string; ok: boolean; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0 text-sm">
      <span className="font-medium">{name}</span>
      <span className="flex items-center gap-2 text-right">
        <span className="text-muted-foreground">{value}</span>
        {note && <span className="text-xs text-muted-foreground">({note})</span>}
        <Badge variant="outline" className={ok ? TONE.ok : TONE.bad}>{ok ? "On" : "Off"}</Badge>
      </span>
    </div>
  );
}

const LandingPagesPage = () => {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [since, setSince] = useState("");
  const [loading, setLoading] = useState(true);
  // A failed load is shown as a failure, never as "no landing pages".
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await axios.get(`${SERVER}/api/admin/landing-pages`, { withCredentials: true });
      setPages(res.data.pages ?? []);
      setTracking(res.data.tracking ?? null);
      setSince(res.data.ordersCountedSince ?? "");
    } catch (error) {
      const message = errorMessage(error, "Failed to load landing pages");
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nameOf = (key: string) => pages.find((p) => p.key === key)?.name ?? key;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Each page is linked to its own course (Masterclasses → Workshop landing page). Dates, time and price come from that course's batch on sale (Batches); a change shows on the page within about a minute. No page has a seat limit.
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {pages.map((p) => {
          // A status this build does not know (a newer website) is shown as
          // it is, instead of breaking the screen.
          const s = STATUS[p.status] ?? { label: String(p.status), tone: "warn" as const };
          return (
            <Card key={p.key} data-testid={`landing-${p.key}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant="outline" className={TONE[s.tone]}>{s.label}</Badge>
                </div>
                <CardDescription>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                    {p.paths.landing} <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Linked course</p>
                  <p>
                    {p.course ? (
                      p.course.title
                    ) : (
                      <em>None. Create or edit a course and set "Workshop landing page" to /{p.page}.</em>
                    )}
                  </p>
                  {p.sharesCourseWith.length > 0 && (
                    <p className="text-xs text-red-700">
                      Also linked to {p.sharesCourseWith.map(nameOf).join(", ")}. Each page should have its own course.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-muted-foreground">Batch on sale</p>
                  {p.batchOnSale ? (
                    <>
                      <p>
                        Batch {p.batchOnSale.batchNumber} · {batchDaysLine(p.batchOnSale.day1StartAt, p.batchOnSale.day2StartAt)}
                      </p>
                      <p>
                        {inr(p.batchOnSale.priceRupees)} · {p.batchOnSale.paidSeats} booked ·{" "}
                        {p.batchOnSale.seatsLeft === null || p.batchOnSale.seatsLeft === undefined
                          ? "no seat limit"
                          : `${p.batchOnSale.seatsLeft} of ${p.batchOnSale.seatLimit ?? 50} left`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Booking closes {istDate(p.batchOnSale.bookingCloseAt)}, {istTime(p.batchOnSale.bookingCloseAt)} IST
                      </p>
                    </>
                  ) : (
                    <p>None</p>
                  )}
                  {s.fix && (
                    <Link to={s.fix.to} className="text-xs underline">{s.fix.text} →</Link>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <p className="text-muted-foreground text-xs">Paid orders</p>
                    <p className="text-lg font-semibold">{p.orders.paid}</p>
                    <p className="text-xs text-muted-foreground">{inr(p.orders.revenueRupees)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last 30 days</p>
                    <p className="text-lg font-semibold">{p.orders.paidLast30Days}</p>
                    <p className="text-xs text-muted-foreground">{inr(p.orders.revenueLast30DaysRupees)}</p>
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    {p.orders.pending} pending · {p.orders.failed} failed or cancelled
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!loading && loadError && (
          <p role="alert" className="text-sm text-red-700 lg:col-span-3">
            Could not load the landing pages: {loadError}. Check that you are signed in and that the website is running, then press Refresh.
          </p>
        )}
        {!loading && !loadError && pages.length === 0 && <p className="text-sm text-muted-foreground">No landing pages returned.</p>}
      </div>

      {since && (
        <p className="text-xs text-muted-foreground">
          Order counts include orders placed from {istDate(since)} onwards, when orders started recording their landing page.
        </p>
      )}

      {tracking && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracking on all three pages</CardTitle>
            <CardDescription>
              Set in the environment variables of the website's host (Render or Vercel). The same tags load on every landing, checkout and thank-you page; each page's events carry its own course ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <TagRow name="Meta Pixel" value={tracking.metaPixelId ?? "not set"} ok={!!tracking.metaPixelId} />
              <TagRow
                name="Meta Conversions API"
                value={tracking.metaCapi ? "server-side Purchase" : "access token not set"}
                ok={tracking.metaCapi}
                note={tracking.metaCapiTestMode ? "test mode: remove META_CAPI_TEST_EVENT_CODE for live" : undefined}
              />
              <TagRow
                name="Google Analytics 4"
                value={tracking.ga4ViaGtm ? "through Tag Manager" : tracking.ga4Id ?? "not set"}
                ok={tracking.ga4ViaGtm ? !!tracking.gtmId : !!tracking.ga4Id}
              />
              <TagRow name="Google Tag Manager" value={tracking.gtmId ?? "not set"} ok={!!tracking.gtmId} />
              <TagRow name="Microsoft Clarity" value={tracking.clarityId ?? "not set"} ok={!!tracking.clarityId} />
            </div>
            <div className="text-sm space-y-2">
              <p><span className="font-medium">Landing page:</span> {tracking.events.landing.join(", ")}</p>
              <p><span className="font-medium">Checkout:</span> {tracking.events.checkout.join(", ")}</p>
              <p><span className="font-medium">Thank-you (paid):</span> {tracking.events.thankYou.join(", ")}</p>
              <p className="text-muted-foreground text-xs">
                The server also sends Purchase to Meta when Cashfree confirms the payment, with the same order ID, so a buyer who closes the tab is still counted and Meta counts each purchase once. Clarity does not record the checkout form or the buyer's details on the thank-you page.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LandingPagesPage;

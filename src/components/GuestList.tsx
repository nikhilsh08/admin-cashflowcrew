import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { istDateTime, rupees } from "@/lib/istFormat";

const SERVER = import.meta.env.VITE_SERVER_URL;

interface Guest {
  registrationId: string;
  name: string;
  email: string;
  phone: string;
  paidAmount: number | null;
  coupon: string | null;
  orderId: string | null;
  paidAt: string | null;
  zohoState: "PENDING" | "REGISTERED" | "FAILED";
  zohoLastError: string | null;
  joinLinkPresent: boolean;
  whatsappOptIn: boolean;
  msgConfirmationAt: string | null;
  msgReminder24hAt: string | null;
  msgReminderDay1At: string | null;
  msgReminderDay2At: string | null;
  msgSurveyAt: string | null;
}

interface Totals {
  booked: number;
  pending: number;
  failed: number;
  revenueRupees: number;
}

const stateVariant: Record<Guest["zohoState"], "default" | "secondary" | "destructive"> = {
  REGISTERED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
};

const tick = (iso: string | null) => (iso ? <span title={istDateTime(iso)}>✓</span> : <span className="text-muted-foreground">—</span>);

const GuestList = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [totals, setTotals] = useState<Totals>({ booked: 0, pending: 0, failed: 0, revenueRupees: 0 });
  const [batchNumber, setBatchNumber] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/admin/batches/${id}/guests`, {
        params: { search: search || undefined, state: state || undefined },
        withCredentials: true,
      });
      setGuests(res.data.guests ?? []);
      setTotals(res.data.totals);
      setBatchNumber(res.data.batchNumber ?? null);
    } catch {
      toast.error("Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [id, search, state]);

  useEffect(() => {
    const handle = setTimeout(load, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const retry = async (guest: Guest) => {
    setRetrying(guest.registrationId);
    try {
      const res = await axios.post(`${SERVER}/api/admin/registrations/${guest.registrationId}/retry-zoho`, {}, { withCredentials: true });
      const next = res.data.registration;
      toast[next.zohoState === "REGISTERED" ? "success" : "error"](
        next.zohoState === "REGISTERED" ? "Registered in Zoho" : `Still ${next.zohoState.toLowerCase()}: ${next.zohoLastError ?? "unknown error"}`,
      );
      await load();
    } catch {
      toast.error("Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  const downloadCsv = () => {
    const url = new URL(`${SERVER}/api/admin/batches/${id}/guests`);
    url.searchParams.set("format", "csv");
    if (search) url.searchParams.set("search", search);
    if (state) url.searchParams.set("state", state);
    window.location.assign(url.toString());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate("/admin/batches")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Batches
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={downloadCsv} disabled={!id}>
            <Download className="h-4 w-4 mr-2" /> Download CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Booked", String(totals.booked)],
          ["Zoho pending", String(totals.pending)],
          ["Zoho failed", String(totals.failed)],
          ["Revenue", rupees(totals.revenueRupees)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name, email, phone or order ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select value={state} onChange={(e) => setState(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Zoho states</option>
          <option value="REGISTERED">Registered</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Coupon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Paid at</TableHead>
                <TableHead>Zoho</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead title="Confirmation / 24h / Day 1 / Day 2 / Survey">Messages</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">
                    {loading ? "Loading…" : batchNumber ? `No guests in batch ${batchNumber} match.` : "No guests."}
                  </TableCell>
                </TableRow>
              )}
              {guests.map((g) => (
                <TableRow key={g.registrationId}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>{g.email}</TableCell>
                  <TableCell>{g.phone}</TableCell>
                  <TableCell>{rupees(g.paidAmount)}</TableCell>
                  <TableCell>{g.coupon ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{g.orderId ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{istDateTime(g.paidAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={stateVariant[g.zohoState]}>{g.zohoState}</Badge>
                      <span className="text-xs text-muted-foreground">{g.joinLinkPresent ? "link ready" : "no link"}</span>
                      {g.zohoLastError && <span className="text-xs text-red-600">{g.zohoLastError}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{g.whatsappOptIn ? "opted in" : "no"}</TableCell>
                  <TableCell className="whitespace-nowrap space-x-1">
                    {tick(g.msgConfirmationAt)} {tick(g.msgReminder24hAt)} {tick(g.msgReminderDay1At)} {tick(g.msgReminderDay2At)} {tick(g.msgSurveyAt)}
                  </TableCell>
                  <TableCell>
                    {g.zohoState !== "REGISTERED" && (
                      <Button size="sm" variant="outline" disabled={retrying === g.registrationId} onClick={() => retry(g)}>
                        {retrying === g.registrationId ? "Retrying…" : "Retry Zoho"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestList;

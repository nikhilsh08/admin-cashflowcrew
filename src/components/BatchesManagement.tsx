import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { addDaysYmd, batchDaysText, istDate, istDateTime, istHm, istYmd, rupees } from "@/lib/istFormat";

const SERVER = import.meta.env.VITE_SERVER_URL;

export interface AdminBatch {
  id: string;
  courseId: string;
  batchNumber: number;
  status: "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED";
  day1StartAt: string;
  day2StartAt: string;
  bookingCloseAt: string;
  durationMinutes: number;
  // Length of day 2; null or absent = the same as day 1.
  day2DurationMinutes?: number | null;
  startTimeIst: string;
  // Day 2 as the website gives it: "Wednesday, 9 December 2026", "2026-12-09", "19:00".
  day2Text?: string;
  day2Date?: string;
  day2StartTimeIst?: string;
  language: string | null;
  priceRupees: number;
  zohoWebinarKeyDay1: string | null;
  zohoWebinarKeyDay2: string | null;
  zohoInstanceIdDay1: string | null;
  zohoInstanceIdDay2: string | null;
  whatsappGroupLink: string | null;
  surveyUrl: string | null;
  day1Text: string;
  bookedCount: number;
  isOnSaleNow: boolean;
  zohoReady: boolean;
  whatsappReady: boolean;
  zohoPending: number;
  zohoFailed: number;
}

interface BatchCourse {
  id: string;
  title: string;
  // The workshop landing page this course is sold on ("/v10", "/v20"), if any.
  landingPath?: string | null;
}

const courseLabel = (c: BatchCourse) => (c.landingPath ? `${c.title} (${c.landingPath})` : c.title);

interface FormState {
  courseId: string;
  day1Date: string;
  startTimeIst: string;
  priceRupees: string;
  closeHoursBefore: string;
  durationMinutes: string;
  // Day 2 has its own date, start time and length. Each follows day 1 (the
  // day after, same time, same length) until it is given its own value.
  day2Date: string;
  day2StartTimeIst: string;
  day2DurationMinutes: string;
  language: string;
  zohoWebinarKeyDay1: string;
  zohoWebinarKeyDay2: string;
  zohoInstanceIdDay1: string;
  zohoInstanceIdDay2: string;
  whatsappGroupLink: string;
  surveyUrl: string;
}

const emptyForm = (courseId = ""): FormState => ({
  courseId,
  day1Date: "",
  startTimeIst: "19:00",
  priceRupees: "",
  closeHoursBefore: "24",
  durationMinutes: "120",
  day2Date: "",
  day2StartTimeIst: "19:00",
  day2DurationMinutes: "120",
  language: "",
  zohoWebinarKeyDay1: "",
  zohoWebinarKeyDay2: "",
  zohoInstanceIdDay1: "",
  zohoInstanceIdDay2: "",
  whatsappGroupLink: "",
  surveyUrl: "",
});

// Day 2 of a batch, as shown in the table and the form.
const day2TimeOf = (b: AdminBatch) => b.day2StartTimeIst ?? istHm(b.day2StartAt);
const day2MinutesOf = (b: AdminBatch) => b.day2DurationMinutes ?? b.durationMinutes;

// A change to day 1 in the form. Day 2 follows it (the day after, same time,
// same length) for as long as day 2 still matches day 1; once day 2 has been
// given its own date, time or length, that value is left alone.
const withDay1 = (f: FormState, key: "day1Date" | "startTimeIst" | "durationMinutes", value: string): FormState => {
  const next = { ...f, [key]: value };
  if (key === "day1Date" && (f.day2Date === "" || f.day2Date === addDaysYmd(f.day1Date, 1))) next.day2Date = addDaysYmd(value, 1);
  if (key === "startTimeIst" && f.day2StartTimeIst === f.startTimeIst) next.day2StartTimeIst = value;
  if (key === "durationMinutes" && f.day2DurationMinutes === f.durationMinutes) next.day2DurationMinutes = value;
  return next;
};

const closeHoursOf = (b: AdminBatch) =>
  String(Math.round(((new Date(b.day1StartAt).getTime() - new Date(b.bookingCloseAt).getTime()) / 3_600_000) * 100) / 100);

const formFromBatch = (b: AdminBatch): FormState => ({
  courseId: b.courseId,
  day1Date: istYmd(b.day1StartAt),
  startTimeIst: b.startTimeIst,
  priceRupees: String(b.priceRupees),
  closeHoursBefore: closeHoursOf(b),
  durationMinutes: String(b.durationMinutes),
  day2Date: b.day2Date ?? istYmd(b.day2StartAt),
  day2StartTimeIst: day2TimeOf(b),
  day2DurationMinutes: String(day2MinutesOf(b)),
  language: b.language ?? "",
  zohoWebinarKeyDay1: b.zohoWebinarKeyDay1 ?? "",
  zohoWebinarKeyDay2: b.zohoWebinarKeyDay2 ?? "",
  zohoInstanceIdDay1: b.zohoInstanceIdDay1 ?? "",
  zohoInstanceIdDay2: b.zohoInstanceIdDay2 ?? "",
  whatsappGroupLink: b.whatsappGroupLink ?? "",
  surveyUrl: b.surveyUrl ?? "",
});

const statusVariant: Record<AdminBatch["status"], "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  OPEN: "default",
  CLOSED: "secondary",
  COMPLETED: "secondary",
};

const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && (error.response?.data?.message as string)) || fallback;

const BatchesManagement = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<AdminBatch[]>([]);
  const [courses, setCourses] = useState<BatchCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBatch | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  // "" = all courses. Batch numbers restart at 1 for each course.
  const [courseFilter, setCourseFilter] = useState("");
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const shownBatches = courseFilter ? batches.filter((b) => b.courseId === courseFilter) : batches;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, settingsRes] = await Promise.all([
        axios.get(`${SERVER}/api/admin/batches`, { withCredentials: true }),
        axios.get(`${SERVER}/api/admin/batch-settings`, { withCredentials: true }),
      ]);
      setBatches(batchRes.data.batches ?? []);
      setCourses(settingsRes.data.courses ?? []);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load batches"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(courseFilter || courses[0]?.id || ""));
    setDialogOpen(true);
  };

  const openEdit = (batch: AdminBatch) => {
    setEditing(batch);
    setForm(formFromBatch(batch));
    setDialogOpen(true);
  };

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  // Day 1's date, start time and length: day 2 follows until it has its own.
  const day1Field = (key: "day1Date" | "startTimeIst" | "durationMinutes") => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => withDay1(f, key, e.target.value)),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const textOrNull = (v: string) => (v.trim() === "" ? null : v.trim());
    const payload = {
      day1Date: form.day1Date,
      startTimeIst: form.startTimeIst,
      priceRupees: Number(form.priceRupees),
      closeHoursBefore: Number(form.closeHoursBefore),
      durationMinutes: Number(form.durationMinutes),
      // Day 2: its own date, start time and length.
      day2Date: form.day2Date,
      day2StartTimeIst: form.day2StartTimeIst,
      day2DurationMinutes: Number(form.day2DurationMinutes),
      language: textOrNull(form.language),
      zohoWebinarKeyDay1: textOrNull(form.zohoWebinarKeyDay1),
      zohoWebinarKeyDay2: textOrNull(form.zohoWebinarKeyDay2),
      zohoInstanceIdDay1: textOrNull(form.zohoInstanceIdDay1),
      zohoInstanceIdDay2: textOrNull(form.zohoInstanceIdDay2),
      whatsappGroupLink: textOrNull(form.whatsappGroupLink),
      surveyUrl: textOrNull(form.surveyUrl),
    };
    try {
      if (editing) {
        await axios.patch(`${SERVER}/api/admin/batches/${editing.id}`, payload, { withCredentials: true });
        toast.success(`Batch ${editing.batchNumber} updated`);
      } else {
        await axios.post(`${SERVER}/api/admin/batches`, { courseId: form.courseId, ...payload }, { withCredentials: true });
        toast.success("Batch created as draft");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(errorMessage(error, "Could not save batch"));
    } finally {
      setSaving(false);
    }
  };

  const transition = async (batch: AdminBatch, action: "open" | "close") => {
    try {
      await axios.post(`${SERVER}/api/admin/batches/${batch.id}/${action}`, {}, { withCredentials: true });
      toast.success(`Batch ${batch.batchNumber} ${action === "open" ? "opened" : "closed"}`);
      await load();
    } catch (error) {
      // Only the Zoho keys / WhatsApp link are missing: offer "Open anyway".
      const canForce = action === "open" && axios.isAxiosError(error) && error.response?.data?.canForce === true;
      if (canForce) {
        const ok = window.confirm(
          `${errorMessage(error, "Setup is incomplete.")}\n\n` +
            "Open anyway? The batch goes on sale now, but buyers will NOT be registered for the Zoho sessions " +
            "or sent the WhatsApp link until you add them in Edit. Use this for testing, or add the keys straight after.",
        );
        if (!ok) return;
        try {
          await axios.post(`${SERVER}/api/admin/batches/${batch.id}/open`, { force: true }, { withCredentials: true });
          toast.warning(`Batch ${batch.batchNumber} opened without Zoho / WhatsApp. Add them in Edit before real buyers book.`);
          await load();
        } catch (forceError) {
          toast.error(errorMessage(forceError, "Could not open batch"));
        }
        return;
      }
      toast.error(errorMessage(error, `Could not ${action} batch`));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          A batch is on sale while it is OPEN and before its booking close time. There is no seat limit on /v10, /v20 or /v30.
        </p>
        <div className="flex flex-wrap gap-2">
          {courses.length > 1 && (
            <select
              aria-label="Course"
              className="border rounded px-3 py-2 text-sm"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{courseLabel(c)}</option>
              ))}
            </select>
          )}
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={openCreate} disabled={courses.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> New batch
          </Button>
        </div>
      </div>

      {courses.length === 0 && !loading && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            No course is set up for batches yet. In Courses, edit the course and set "Sold in batches" to Yes, then configure Batch settings.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Day 1</TableHead>
                <TableHead>Day 2</TableHead>
                <TableHead>Booking closes</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Booked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ready</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shownBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">
                    {loading ? "Loading…" : "No batches yet."}
                  </TableCell>
                </TableRow>
              )}
              {shownBatches.map((b) => (
                <TableRow key={b.id} data-testid={`batch-row-${b.batchNumber}`}>
                  <TableCell className="font-medium">{b.batchNumber}</TableCell>
                  <TableCell className="text-sm">
                    {courseById.get(b.courseId)?.title ?? "—"}
                    {courseById.get(b.courseId)?.landingPath && (
                      <span className="ml-1 text-xs text-muted-foreground">{courseById.get(b.courseId)?.landingPath}</span>
                    )}
                  </TableCell>
                  {/* Each day with its own date, start time (IST) and length. */}
                  <TableCell data-testid={`batch-day1-${b.batchNumber}`}>
                    {b.day1Text || istDate(b.day1StartAt)}
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{b.startTimeIst} IST · {b.durationMinutes} min</div>
                  </TableCell>
                  <TableCell data-testid={`batch-day2-${b.batchNumber}`}>
                    {b.day2Text || istDate(b.day2StartAt)}
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{day2TimeOf(b)} IST · {day2MinutesOf(b)} min</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{istDateTime(b.bookingCloseAt)}</TableCell>
                  <TableCell>{b.language ?? "—"}</TableCell>
                  <TableCell>{rupees(b.priceRupees)}</TableCell>
                  <TableCell>
                    {b.bookedCount}
                    {b.zohoFailed > 0 && <span className="ml-1 text-xs text-red-600">({b.zohoFailed} Zoho failed)</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={statusVariant[b.status]}>{b.status}</Badge>
                      {b.isOnSaleNow && <Badge className="bg-green-600 hover:bg-green-600">On sale</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    <span title="Zoho webinar keys" className={b.zohoReady ? "text-green-600" : "text-red-600"}>
                      {b.zohoReady ? "✓" : "✗"} Zoho
                    </span>
                    <span title="WhatsApp group link" className={`ml-2 ${b.whatsappReady ? "text-green-600" : "text-red-600"}`}>
                      {b.whatsappReady ? "✓" : "✗"} WhatsApp
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>Edit</Button>
                    {b.status === "OPEN" ? (
                      <Button size="sm" variant="outline" onClick={() => transition(b, "close")}>Close</Button>
                    ) : b.status !== "COMPLETED" ? (
                      <Button size="sm" variant="outline" onClick={() => transition(b, "open")}>Open</Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/batches/${b.id}/guests`)}>Guests</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit batch ${editing.batchNumber}` : "New batch"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {!editing && (
              <div>
                <Label className="py-1">Course</Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.courseId}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{courseLabel(c)}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Each day has its own date, start time and length. Day 2 is filled
                in from day 1 (the day after, same time, same length) and can
                then be changed to any later date, time or length. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="py-1">Day 1 date (any day of the week)</Label>
                <Input type="date" required {...day1Field("day1Date")} />
              </div>
              <div>
                <Label className="py-1">Day 1 start time (IST)</Label>
                <Input type="time" required {...day1Field("startTimeIst")} />
              </div>
              <div>
                <Label className="py-1">Day 1 length (minutes)</Label>
                <Input type="number" min="30" step="15" required {...day1Field("durationMinutes")} />
              </div>
              <div>
                <Label className="py-1">Day 2 date (any later date)</Label>
                <Input
                  type="date"
                  required
                  min={addDaysYmd(form.day1Date, 1) || undefined}
                  data-testid="day2-date"
                  {...field("day2Date")}
                />
              </div>
              <div>
                <Label className="py-1">Day 2 start time (IST)</Label>
                <Input type="time" required data-testid="day2-time" {...field("day2StartTimeIst")} />
              </div>
              <div>
                <Label className="py-1">Day 2 length (minutes)</Label>
                <Input type="number" min="30" step="15" required data-testid="day2-length" {...field("day2DurationMinutes")} />
              </div>
              {/* Both days as the pages will name them, with their weekdays. */}
              {batchDaysText(form.day1Date, form.day2Date) && (
                <p className="md:col-span-3 -mt-2 text-xs text-muted-foreground" data-testid="batch-days">
                  {batchDaysText(form.day1Date, form.day2Date)}
                </p>
              )}
              <div>
                <Label className="py-1">Price (₹, charged as shown)</Label>
                <Input type="number" min="1" step="1" required {...field("priceRupees")} />
              </div>
              <div>
                <Label className="py-1">Booking closes (hours before day 1 starts)</Label>
                <Input type="number" min="0" step="0.5" required {...field("closeHoursBefore")} />
              </div>
              <div>
                <Label className="py-1">Language (blank hides it)</Label>
                <Input {...field("language")} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="py-1">Zoho webinar key — day 1</Label>
                <Input {...field("zohoWebinarKeyDay1")} />
              </div>
              <div>
                <Label className="py-1">Zoho webinar key — day 2</Label>
                <Input {...field("zohoWebinarKeyDay2")} />
              </div>
              <div>
                <Label className="py-1">Zoho instance id — day 1 (recurring only)</Label>
                <Input {...field("zohoInstanceIdDay1")} />
              </div>
              <div>
                <Label className="py-1">Zoho instance id — day 2 (recurring only)</Label>
                <Input {...field("zohoInstanceIdDay2")} />
              </div>
              <div>
                <Label className="py-1">WhatsApp group link</Label>
                <Input type="url" {...field("whatsappGroupLink")} />
              </div>
              <div>
                <Label className="py-1">Survey URL (overrides default)</Label>
                <Input type="url" {...field("surveyUrl")} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create draft"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchesManagement;

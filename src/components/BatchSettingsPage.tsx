import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "./ui/switch";

const SERVER = import.meta.env.VITE_SERVER_URL;

interface BatchCourse {
  id: string;
  title: string;
  // The workshop landing page this course is sold on ("/v10", "/v20"), if any.
  landingPath?: string | null;
}

interface SettingsForm {
  courseId: string;
  anchorDay1Date: string;
  cadenceDays: string;
  defaultPriceRupees: string;
  defaultStartTimeIst: string;
  durationMinutes: string;
  defaultLanguage: string;
  closeHoursBefore: string;
  newBatchStatus: "DRAFT" | "OPEN";
  futureBatchCount: string;
  autoCreate: boolean;
  defaultWhatsappGroupLink: string;
  defaultSurveyUrl: string;
  alertEmails: string;
}

interface Preview {
  date: string;
  text: string;
}

const emptyForm = (courseId = ""): SettingsForm => ({
  courseId,
  anchorDay1Date: "",
  cadenceDays: "14",
  defaultPriceRupees: "",
  defaultStartTimeIst: "19:00",
  durationMinutes: "120",
  defaultLanguage: "",
  closeHoursBefore: "24",
  newBatchStatus: "DRAFT",
  futureBatchCount: "2",
  autoCreate: true,
  defaultWhatsappGroupLink: "",
  defaultSurveyUrl: "",
  alertEmails: "",
});

// One saved settings record, as GET /api/admin/batch-settings returns it.
interface SavedSettings {
  courseId: string;
  anchorDay1Date: string;
  cadenceDays: number;
  defaultPriceRupees: number;
  defaultStartTimeIst: string;
  durationMinutes: number;
  defaultLanguage?: string | null;
  closeHoursBefore: number;
  newBatchStatus: "DRAFT" | "OPEN";
  futureBatchCount: number;
  autoCreate: boolean;
  defaultWhatsappGroupLink?: string | null;
  defaultSurveyUrl?: string | null;
  alertEmails?: string[];
  preview?: Preview[];
}

const formFromSettings = (s: SavedSettings): SettingsForm => ({
  courseId: s.courseId,
  anchorDay1Date: s.anchorDay1Date,
  cadenceDays: String(s.cadenceDays),
  defaultPriceRupees: String(s.defaultPriceRupees),
  defaultStartTimeIst: s.defaultStartTimeIst,
  durationMinutes: String(s.durationMinutes),
  defaultLanguage: s.defaultLanguage ?? "",
  closeHoursBefore: String(s.closeHoursBefore),
  newBatchStatus: s.newBatchStatus,
  futureBatchCount: String(s.futureBatchCount),
  autoCreate: s.autoCreate,
  defaultWhatsappGroupLink: s.defaultWhatsappGroupLink ?? "",
  defaultSurveyUrl: s.defaultSurveyUrl ?? "",
  alertEmails: (s.alertEmails ?? []).join(", "),
});

const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && (error.response?.data?.message as string)) || fallback;

const BatchSettingsPage = () => {
  const [courses, setCourses] = useState<BatchCourse[]>([]);
  const [form, setForm] = useState<SettingsForm>(emptyForm());
  const [preview, setPreview] = useState<Preview[]>([]);
  const [allSettings, setAllSettings] = useState<SavedSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Each course has its own settings: show the chosen course's saved values,
  // or an empty form when it has none yet.
  const showCourse = (courseId: string, list: SavedSettings[]) => {
    const existing = list.find((s) => s.courseId === courseId);
    setForm(existing ? formFromSettings(existing) : emptyForm(courseId));
    setPreview(existing?.preview ?? []);
  };

  const load = useCallback(async (keepCourseId?: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/admin/batch-settings`, { withCredentials: true });
      const courseList: BatchCourse[] = res.data.courses ?? [];
      const settingsList: SavedSettings[] = res.data.settings ?? [];
      setCourses(courseList);
      setAllSettings(settingsList);
      // Keep the course being edited; on first load, the first course in the list.
      const courseId = keepCourseId && courseList.some((c) => c.id === keepCourseId) ? keepCourseId : courseList[0]?.id ?? "";
      showCourse(courseId, settingsList);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load batch settings"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const field = (key: keyof SettingsForm) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `${SERVER}/api/admin/batch-settings`,
        {
          courseId: form.courseId,
          anchorDay1Date: form.anchorDay1Date,
          cadenceDays: Number(form.cadenceDays),
          defaultPriceRupees: Number(form.defaultPriceRupees),
          defaultStartTimeIst: form.defaultStartTimeIst,
          durationMinutes: Number(form.durationMinutes),
          defaultLanguage: form.defaultLanguage.trim() || null,
          closeHoursBefore: Number(form.closeHoursBefore),
          newBatchStatus: form.newBatchStatus,
          futureBatchCount: Number(form.futureBatchCount),
          autoCreate: form.autoCreate,
          defaultWhatsappGroupLink: form.defaultWhatsappGroupLink.trim() || null,
          defaultSurveyUrl: form.defaultSurveyUrl.trim() || null,
          alertEmails: form.alertEmails.split(",").map((s) => s.trim()).filter(Boolean),
        },
        { withCredentials: true },
      );
      toast.success("Batch settings saved");
      // Reload so the saved record for this course is the one shown.
      await load(form.courseId);
    } catch (error) {
      toast.error(errorMessage(error, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Cycle</CardTitle>
          <CardDescription>New batches are created automatically from these defaults. /v20 and /v30 sell 50 seats per batch; /v10 has no seat limit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="py-1">Course</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.courseId}
              onChange={(e) => showCourse(e.target.value, allSettings)}
              required
              disabled={loading}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.landingPath ? `${c.title} (${c.landingPath})` : c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="py-1">First Saturday the cycle counts from</Label>
            <Input type="date" required {...field("anchorDay1Date")} />
          </div>
          <div>
            <Label className="py-1">Cadence (days)</Label>
            <Input type="number" min="7" step="7" required {...field("cadenceDays")} />
          </div>
          <div>
            <Label className="py-1">Future batches to keep ready</Label>
            <Input type="number" min="0" max="12" required {...field("futureBatchCount")} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.autoCreate} onCheckedChange={(v) => setForm((f) => ({ ...f, autoCreate: v }))} />
            <Label>Create future batches automatically</Label>
          </div>
          <div>
            <Label className="py-1">New batches start as</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.newBatchStatus}
              onChange={(e) => setForm((f) => ({ ...f, newBatchStatus: e.target.value as "DRAFT" | "OPEN" }))}
            >
              <option value="DRAFT">Draft (staff add webinar keys and group link, then open)</option>
              <option value="OPEN">Open</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batch defaults</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="py-1">Price (₹, charged as shown)</Label>
            <Input type="number" min="1" step="1" required {...field("defaultPriceRupees")} />
          </div>
          <div>
            <Label className="py-1">Start time (IST)</Label>
            <Input type="time" required {...field("defaultStartTimeIst")} />
          </div>
          <div>
            <Label className="py-1">Duration per day (minutes)</Label>
            <Input type="number" min="30" step="15" required {...field("durationMinutes")} />
          </div>
          <div>
            <Label className="py-1">Booking closes (hours before Saturday's start)</Label>
            <Input type="number" min="0" step="1" required {...field("closeHoursBefore")} />
          </div>
          <div>
            <Label className="py-1">Language shown on the page (blank hides it)</Label>
            <Input {...field("defaultLanguage")} />
          </div>
          <div>
            <Label className="py-1">Default WhatsApp group link (if one shared group)</Label>
            <Input type="url" {...field("defaultWhatsappGroupLink")} />
          </div>
          <div>
            <Label className="py-1">Default survey URL</Label>
            <Input type="url" {...field("defaultSurveyUrl")} />
          </div>
          <div>
            <Label className="py-1">Alert emails (comma separated)</Label>
            <Input {...field("alertEmails")} placeholder="ops@cashflowcrew.in" />
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Next Saturdays on this cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm">
              {preview.map((p) => (
                <li key={p.date}>{p.text}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || loading || courses.length === 0}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
};

export default BatchSettingsPage;

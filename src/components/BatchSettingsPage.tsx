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

const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && (error.response?.data?.message as string)) || fallback;

const BatchSettingsPage = () => {
  const [courses, setCourses] = useState<BatchCourse[]>([]);
  const [form, setForm] = useState<SettingsForm>(emptyForm());
  const [preview, setPreview] = useState<Preview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER}/api/admin/batch-settings`, { withCredentials: true });
      const courseList: BatchCourse[] = res.data.courses ?? [];
      setCourses(courseList);
      const existing = res.data.settings?.[0];
      if (existing) {
        setForm({
          courseId: existing.courseId,
          anchorDay1Date: existing.anchorDay1Date,
          cadenceDays: String(existing.cadenceDays),
          defaultPriceRupees: String(existing.defaultPriceRupees),
          defaultStartTimeIst: existing.defaultStartTimeIst,
          durationMinutes: String(existing.durationMinutes),
          defaultLanguage: existing.defaultLanguage ?? "",
          closeHoursBefore: String(existing.closeHoursBefore),
          newBatchStatus: existing.newBatchStatus,
          futureBatchCount: String(existing.futureBatchCount),
          autoCreate: existing.autoCreate,
          defaultWhatsappGroupLink: existing.defaultWhatsappGroupLink ?? "",
          defaultSurveyUrl: existing.defaultSurveyUrl ?? "",
          alertEmails: (existing.alertEmails ?? []).join(", "),
        });
        setPreview(existing.preview ?? []);
      } else {
        setForm(emptyForm(courseList[0]?.id ?? ""));
      }
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
      const res = await axios.put(
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
      setPreview(res.data.settings?.preview ?? []);
      toast.success("Batch settings saved");
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
          <CardDescription>New batches are created automatically from these defaults. There is no seat limit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="py-1">Course</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              required
              disabled={loading}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
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
            <Input type="number" min="0" step="0.5" required {...field("closeHoursBefore")} />
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

// components/EmailFilterClient.tsx
"use client";

import React, { useState } from "react";
import {
  Upload,
  Mail,
  Filter,
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
} from "lucide-react";
// If you don't have shadcn/ui components, replace these imports with your UI library or simple HTML
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

type FilterStatus = "not_found" | "accepted" | "all";
type EmailType =
  | "complete_registration"
  | "complete_transaction"
  | "reminder"
  | "welcome"
  | string; // allow custom slugs

interface CsvRecord {
  [key: string]: string | undefined;
}

const DEFAULT_EMAIL_TYPES: { value: EmailType; label: string }[] = [
  { value: "complete_registration", label: "Complete Registration" },
  { value: "complete_transaction", label: "Complete Transaction" },
  { value: "reminder", label: "Reminder Message" },
  { value: "welcome", label: "Welcome Message" },
];

export default function EmailFilterClient() {
  const [csvData, setCsvData] = useState<CsvRecord[]>([]);
  const [filteredData, setFilteredData] = useState<CsvRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("not_found");
  const [emailType, setEmailType] = useState<EmailType>(
    DEFAULT_EMAIL_TYPES[0].value
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // --- Utilities ---
  const detectSeparator = (text: string) => {
    // prefer tab if present, else comma
    if (text.indexOf("\t") !== -1) return "\t";
    return ",";
  };

  const parseCSV = (text: string): { headers: string[]; rows: CsvRecord[] } => {
    const sep = detectSeparator(text);
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return { headers: [], rows: [] };

    // handle quoted values by splitting using a simple CSV parser for comma,
    // for tabs we can do naive split
    const rawHeaders = lines[0].split(sep).map((h) => h.trim());
    const headers = rawHeaders.filter(Boolean);

    const rows: CsvRecord[] = lines.slice(1).map((line) => {
      let vals: string[] = [];
      if (sep === ",") {
        // basic CSV parse (handles quoted fields)
        const result: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"' && line[i + 1] === '"') {
            cur += '"';
            i++;
            continue;
          }
          if (ch === '"') {
            inQuotes = !inQuotes;
            continue;
          }
          if (ch === "," && !inQuotes) {
            result.push(cur);
            cur = "";
            continue;
          }
          cur += ch;
        }
        result.push(cur);
        vals = result.map((v) => v.trim());
      } else {
        // tab-separated: simple split
        vals = line.split("\t").map((v) => v.trim());
      }

      const row: CsvRecord = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx] ?? "";
      });
      return row;
    });

    return { headers, rows };
  };

  const findReconcileKey = (row: CsvRecord): string | undefined => {
    const keys = Object.keys(row);
    // prefer exact matches (case-insensitive)
    const prefer = ["reconcile", "reconciliation"];
    for (const p of prefer) {
      const k = keys.find((kk) => kk.toLowerCase() === p.toLowerCase());
      if (k) return k;
    }
    // fallback: any key that contains 'reconcile'
    const found = keys.find((kk) => kk.toLowerCase().includes("reconcile"));
    return found;
  };

  const getReconcileValue = (row: CsvRecord): string => {
    const k = findReconcileKey(row);
    if (!k) return "";
    return (row[k] ?? "").toString().toLowerCase().trim();
  };

  const applyFilter = (data: CsvRecord[], status: FilterStatus) => {
    const f = data.filter((r) => {
      const val = getReconcileValue(r);
      if (status === "not_found") {
        // accept variants like 'not found', 'not_found', 'notfound'
        return (
          val === "not found" ||
          val === "not_found" ||
          val === "notfound" ||
          val === "notfound" ||
          val.includes("not") && val.includes("found") || // defensive
          val === "notfound" // extra
        );
      } else if (status === "accepted") {
        return val === "accepted" || val === "accept" || val.includes("accept");
      } else {
        return true;
      }
    });
    setFilteredData(f);
  };

  // --- File handling ---
  const handleFileUpload = (file?: File) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setMessage("Please upload a .csv file");
      return;
    }
    setMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows } = parseCSV(text);
      setCsvData(rows);
      applyFilter(rows, filterStatus);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileUpload(file);
  };

  // --- Actions ---
  const downloadFilteredCSV = () => {
    if (filteredData.length === 0) {
      setMessage("No filtered rows to download.");
      return;
    }
    const headers = Object.keys(filteredData[0]);
    const rows = filteredData.map((r) =>
      headers.map((h) => {
        const v = r[h] ?? "";
        // escape quotes for CSV
        if (typeof v === "string" && (v.includes(",") || v.includes('"'))) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filtered_reconcile_${filterStatus}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const sendToBackend = async () => {
    if (filteredData.length === 0) {
      setMessage("No recipients selected to send.");
      return;
    }
    setIsProcessing(true);
    setMessage(null);

    try {
      const payload = {
        emailType, // slug that backend will use to select HTML template
        recipients: filteredData.map((r) => {
          // ensure common fields exist (email, first name, order id, amount, currency, etc)
          return {
            email: (r["Email"] ?? r["email"] ?? "").toString(),
            firstName:
              (r["First Name"] ?? r["first_name"] ?? r["first"] ?? "").toString(),
            orderId: (r["Order ID"] ?? r["order_id"] ?? "").toString(),
            amount: (r["Amount"] ?? "").toString(),
            currency: (r["Currency"] ?? "").toString(),
            raw: r, // include raw row for backend flexibility
          };
        }),
      };

      const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/admin/emails/send`, payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          // Add auth headers if needed
        },
      });




      // expecting { success: true, sentCount: number } or similar
      if (res.data?.success) {
        setMessage(`Successfully sent to ${res.data.sentCount} recipients.`);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`Error sending to backend: ${err?.message ?? err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">CSV Filter — Reconcile</CardTitle>
                <CardDescription>
                  Upload CSV, extract rows by Reconcile column (case-insensitive)
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-medium">
                <Upload className="w-5 h-5" /> Upload CSV
              </h3>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2">Drag & drop your CSV here</p>
                <p className="text-sm text-muted-foreground mb-4">or</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Button asChild>
                    <span>Browse files</span>
                  </Button>
                </label>
              </div>

              {csvData.length > 0 && (
                <Alert className="mt-3">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {csvData.length} records loaded
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {csvData.length > 0 && (
              <>
                <Separator />

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter by Reconcile status
                    </label>
                    <Select
                      value={filterStatus}
                      onValueChange={(v: FilterStatus) => {
                        setFilterStatus(v);
                        applyFilter(csvData, v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_found">Not Found Only</SelectItem>
                        <SelectItem value="accepted">Accepted Only</SelectItem>
                        <SelectItem value="all">All Records</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                      {filteredData.length} record(s) selected
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Type (slug)
                    </label>
                    <Select
                      value={emailType}
                      onValueChange={(v: EmailType) => setEmailType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_EMAIL_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom (set slug manually)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* manual slug input if custom */}
                    {emailType === "custom" && (
                      <input
                        className="mt-2 w-full p-2 border rounded"
                        placeholder="Enter custom slug (e.g. payment_reminder)"
                        onChange={(e) => setEmailType(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <Separator />

                {filteredData.length > 0 ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Email Preview (first recipient)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <strong>To:</strong>{" "}
                          {filteredData[0]["Email"] ?? filteredData[0]["email"] ?? "-"}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          You will send <strong>{emailType}</strong> to these
                          recipients. Backend should map the slug to the HTML template.
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Recipients ({filteredData.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {filteredData.map((r, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div>
                                <div className="font-medium">
                                  {r["First Name"] ?? r["first_name"] ?? ""}{" "}
                                  {r["Last Name"] ?? r["last_name"] ?? ""}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {r["Email"] ?? r["email"] ?? "-"}
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {r["City"] ?? r["city"] ?? "-"}
                              </Badge>
                              {/* <a href={`https://wa.me/+91${r["Phone"] ?? r["phone"] ?? ""}`} target="_blank" rel="noopener noreferrer">
                                Send WhatsApp Message
                              </a> */}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-3 items-center pt-4">
                      <Button onClick={downloadFilteredCSV} disabled={isProcessing}>
                        Download Filtered CSV
                      </Button>

                      <Button
                        onClick={sendToBackend}
                        disabled={isProcessing}
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send to Backend ({filteredData.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No records match the selected filter criteria.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {message && (
              <div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

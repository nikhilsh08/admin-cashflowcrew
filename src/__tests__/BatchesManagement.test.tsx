import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import BatchesManagement from "../components/BatchesManagement";

vi.mock("axios");

const batch = {
  id: "b1",
  courseId: "c1",
  batchNumber: 4,
  status: "OPEN",
  day1StartAt: "2026-11-21T13:30:00.000Z",
  day2StartAt: "2026-11-22T13:30:00.000Z",
  bookingCloseAt: "2026-11-20T13:30:00.000Z",
  durationMinutes: 120,
  startTimeIst: "19:00",
  language: null,
  priceRupees: 1999,
  zohoWebinarKeyDay1: "K1",
  zohoWebinarKeyDay2: null,
  zohoInstanceIdDay1: null,
  zohoInstanceIdDay2: null,
  whatsappGroupLink: null,
  surveyUrl: null,
  day1Text: "Saturday, 21 November 2026",
  bookedCount: 12,
  isOnSaleNow: true,
  zohoReady: false,
  whatsappReady: true,
  zohoPending: 0,
  zohoFailed: 1,
};

describe("BatchesManagement (spec 8.2)", () => {
  // Each test starts with an empty screen.
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/api/admin/batches")) return { data: { batches: [batch] } };
      if (url.endsWith("/api/admin/batch-settings")) return { data: { settings: [], courses: [{ id: "c1", title: "Master Mutual Funds" }] } };
      throw new Error(`unexpected ${url}`);
    });
  });

  it("lists batches with booked count, status, sale badge and readiness — and no seats", async () => {
    render(
      <MemoryRouter>
        <BatchesManagement />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId("batch-row-4")).toBeTruthy());
    const row = screen.getByTestId("batch-row-4");
    expect(row.textContent).toContain("Saturday, 21 November 2026");
    expect(row.textContent).toContain("₹1,999");
    expect(row.textContent).toContain("12");
    expect(row.textContent).toContain("OPEN");
    expect(row.textContent).toContain("On sale");
    expect(row.textContent).toContain("✗ Zoho");
    expect(row.textContent).toContain("✓ WhatsApp");
    expect(row.textContent).toContain("1 Zoho failed");
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(document.body.textContent?.toLowerCase()).not.toContain("seats left");
    expect(document.body.textContent).not.toContain("countdown");
  });

  it("does not tie a batch to Saturday and Sunday: day 1 can be any day of the week", async () => {
    render(
      <MemoryRouter>
        <BatchesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId("batch-row-4")).toBeTruthy());

    // The date column is "Day 1", not "Saturday".
    expect(screen.getByRole("columnheader", { name: "Day 1" })).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Saturday" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /New batch/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Day 1 date (any day of the week)");
    expect(dialog.textContent).toContain("Zoho webinar key — day 1");
    expect(dialog.textContent).toContain("Zoho webinar key — day 2");
    expect(dialog.textContent).not.toMatch(/Saturday|Sunday/);

    // 25 November 2026 is a Wednesday: the form says which two days that gives.
    fireEvent.change(dialog.querySelector('input[type="date"]') as HTMLInputElement, { target: { value: "2026-11-25" } });
    expect(screen.getByTestId("batch-days").textContent).toBe("Day 1: Wednesday 25 Nov · Day 2: Thursday 26 Nov");

    // The date goes to the website as typed; nothing in the panel moves it to a Saturday.
    vi.mocked(axios.post).mockResolvedValue({ data: {} });
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    const [url, body] = vi.mocked(axios.post).mock.calls[0];
    expect(url).toMatch(/\/api\/admin\/batches$/);
    expect(body).toMatchObject({ courseId: "c1", day1Date: "2026-11-25" });
  });
});

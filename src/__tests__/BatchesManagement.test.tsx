import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
});

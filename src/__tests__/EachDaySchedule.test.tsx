// Day 2 of a batch can be any later date, with its own start time and its own
// length (owner, 23 Nov 2026). The Batches form, the Batch settings form and
// the Landing pages screen show and save each day's own details.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import BatchesManagement from "../components/BatchesManagement";
import BatchSettingsPage from "../components/BatchSettingsPage";
import LandingPagesPage from "../components/LandingPagesPage";
import { addDaysYmd, batchDaysText, daysBetweenYmd, istHm, istYmd } from "../lib/istFormat";

vi.mock("axios");

// The Switch control measures itself; the test browser has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const baseBatch = {
  courseId: "c1",
  status: "DRAFT",
  language: null,
  priceRupees: 2999,
  zohoWebinarKeyDay1: null,
  zohoWebinarKeyDay2: null,
  zohoInstanceIdDay1: null,
  zohoInstanceIdDay2: null,
  whatsappGroupLink: null,
  surveyUrl: null,
  bookedCount: 0,
  isOnSaleNow: false,
  zohoReady: false,
  whatsappReady: false,
  zohoPending: 0,
  zohoFailed: 0,
};

// Saturday 5 Dec 2026, 10:30 AM, 2 hours; Wednesday 9 Dec, 7:00 PM, 3 hours.
const ownDay2 = {
  ...baseBatch,
  id: "b7",
  batchNumber: 7,
  day1StartAt: "2026-12-05T05:00:00.000Z",
  day2StartAt: "2026-12-09T13:30:00.000Z",
  bookingCloseAt: "2026-12-04T05:00:00.000Z",
  durationMinutes: 120,
  day2DurationMinutes: 180,
  startTimeIst: "10:30",
  day1Text: "Saturday, 5 December 2026",
  day2Text: "Wednesday, 9 December 2026",
  day2Date: "2026-12-09",
  day2StartTimeIst: "19:00",
};

// A batch as an older website sends it: no day 2 fields besides day2StartAt.
const plain = {
  ...baseBatch,
  id: "b4",
  batchNumber: 4,
  day1StartAt: "2026-11-21T13:30:00.000Z",
  day2StartAt: "2026-11-22T13:30:00.000Z",
  bookingCloseAt: "2026-11-20T13:30:00.000Z",
  durationMinutes: 120,
  startTimeIst: "19:00",
  day1Text: "Saturday, 21 November 2026",
};

const course = { id: "c1", title: "Master Mutual Funds" };

afterEach(() => {
  cleanup();
  vi.mocked(axios.get).mockReset();
  vi.mocked(axios.post).mockReset();
  vi.mocked(axios.patch).mockReset();
  vi.mocked(axios.put).mockReset();
});

describe("date helpers", () => {
  it("moves a typed date by days, counts days between two, and reads an instant in IST", () => {
    expect(addDaysYmd("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysYmd("2026-12-05", 4)).toBe("2026-12-09");
    expect(addDaysYmd("2026-12", 1)).toBe("");
    expect(daysBetweenYmd("2026-12-05", "2026-12-09")).toBe(4);
    expect(daysBetweenYmd("2026-12-05", "")).toBeNull();
    expect(istYmd("2026-12-09T13:30:00.000Z")).toBe("2026-12-09");
    expect(istHm("2026-12-09T13:30:00.000Z")).toBe("19:00");
    // 11:30 PM UTC is already the next day in India.
    expect(istYmd("2026-12-09T23:30:00.000Z")).toBe("2026-12-10");
    expect(istHm("2026-12-09T23:30:00.000Z")).toBe("05:00");
  });

  it("names both days of a batch, day 2 being the day after until it has its own date", () => {
    expect(batchDaysText("2026-12-05")).toBe("Day 1: Saturday 5 Dec · Day 2: Sunday 6 Dec");
    expect(batchDaysText("2026-12-05", "2026-12-09")).toBe("Day 1: Saturday 5 Dec · Day 2: Wednesday 9 Dec");
    expect(batchDaysText("", "2026-12-09")).toBe("");
  });
});

describe("Batches: each day's own date, time and length", () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith("/api/admin/batches")) return { data: { batches: [ownDay2, plain] } };
      if (url.endsWith("/api/admin/batch-settings")) return { data: { settings: [], courses: [course] } };
      throw new Error(`unexpected ${url}`);
    });
  });

  const open = async () => {
    render(
      <MemoryRouter>
        <BatchesManagement />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId("batch-row-7")).toBeTruthy());
  };
  const input = (dialog: HTMLElement, selector: string) => dialog.querySelector(selector) as HTMLInputElement;
  const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

  it("lists each batch with both days, each with its own start time and length", async () => {
    await open();
    expect(screen.getByRole("columnheader", { name: "Day 1" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Day 2" })).toBeTruthy();

    expect(screen.getByTestId("batch-day1-7").textContent).toBe("Saturday, 5 December 202610:30 IST · 120 min");
    expect(screen.getByTestId("batch-day2-7").textContent).toBe("Wednesday, 9 December 202619:00 IST · 180 min");

    // From an older website, day 2 is worked out from its own start instant.
    expect(screen.getByTestId("batch-day2-4").textContent).toBe("Sunday, 22 November 202619:00 IST · 120 min");
  });

  it("fills day 2 in from day 1, then leaves it alone once it has its own values", async () => {
    await open();
    fireEvent.click(screen.getByRole("button", { name: /New batch/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Day 2 date (any later date)");
    expect(dialog.textContent).toContain("Day 2 start time (IST)");
    expect(dialog.textContent).toContain("Day 2 length (minutes)");

    const day1Date = input(dialog, 'input[type="date"]');
    const day1Time = input(dialog, 'input[type="time"]');
    const day1Length = input(dialog, 'input[type="number"][min="30"]');
    const day2Date = within(dialog).getByTestId("day2-date") as HTMLInputElement;
    const day2Time = within(dialog).getByTestId("day2-time") as HTMLInputElement;
    const day2Length = within(dialog).getByTestId("day2-length") as HTMLInputElement;

    // Day 2 follows day 1: the day after, the same time, the same length.
    type(day1Date, "2026-12-05");
    type(day1Time, "10:30");
    type(day1Length, "90");
    expect(day2Date.value).toBe("2026-12-06");
    expect(day2Date.min).toBe("2026-12-06");
    expect(day2Time.value).toBe("10:30");
    expect(day2Length.value).toBe("90");
    expect(screen.getByTestId("batch-days").textContent).toBe("Day 1: Saturday 5 Dec · Day 2: Sunday 6 Dec");

    // Day 2 gets its own date, time and length.
    type(day2Date, "2026-12-09");
    type(day2Time, "19:00");
    type(day2Length, "180");
    expect(screen.getByTestId("batch-days").textContent).toBe("Day 1: Saturday 5 Dec · Day 2: Wednesday 9 Dec");

    // Changing day 1 now leaves day 2 as it was set.
    type(day1Time, "11:00");
    type(day1Length, "120");
    type(day1Date, "2026-12-04");
    expect(day2Date.value).toBe("2026-12-09");
    expect(day2Time.value).toBe("19:00");
    expect(day2Length.value).toBe("180");

    vi.mocked(axios.post).mockResolvedValue({ data: {} });
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    const [url, body] = vi.mocked(axios.post).mock.calls[0];
    expect(url).toMatch(/\/api\/admin\/batches$/);
    expect(body).toMatchObject({
      courseId: "c1",
      day1Date: "2026-12-04",
      startTimeIst: "11:00",
      durationMinutes: 120,
      day2Date: "2026-12-09",
      day2StartTimeIst: "19:00",
      day2DurationMinutes: 180,
    });
  });

  it("opens a batch for editing with its own day 2, and saves day 2 with the rest", async () => {
    await open();
    fireEvent.click(within(screen.getByTestId("batch-row-7")).getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByTestId("day2-date") as HTMLInputElement).value).toBe("2026-12-09");
    expect((within(dialog).getByTestId("day2-time") as HTMLInputElement).value).toBe("19:00");
    expect((within(dialog).getByTestId("day2-length") as HTMLInputElement).value).toBe("180");
    expect(screen.getByTestId("batch-days").textContent).toBe("Day 1: Saturday 5 Dec · Day 2: Wednesday 9 Dec");

    vi.mocked(axios.patch).mockResolvedValue({ data: {} });
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(axios.patch).toHaveBeenCalled());
    const [url, body] = vi.mocked(axios.patch).mock.calls[0];
    expect(url).toMatch(/\/api\/admin\/batches\/b7$/);
    expect(body).toMatchObject({
      day1Date: "2026-12-05", startTimeIst: "10:30", durationMinutes: 120,
      day2Date: "2026-12-09", day2StartTimeIst: "19:00", day2DurationMinutes: 180,
    });
  });

  it("opens a batch from an older website with day 2 worked out from its start instant", async () => {
    await open();
    fireEvent.click(within(screen.getByTestId("batch-row-4")).getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByTestId("day2-date") as HTMLInputElement).value).toBe("2026-11-22");
    expect((within(dialog).getByTestId("day2-time") as HTMLInputElement).value).toBe("19:00");
    expect((within(dialog).getByTestId("day2-length") as HTMLInputElement).value).toBe("120");
  });
});

describe("Batch settings: day 2 of each new batch", () => {
  const settings = {
    courseId: "c1",
    anchorDay1Date: "2026-12-05",
    cadenceDays: 14,
    defaultPriceRupees: 2999,
    defaultStartTimeIst: "10:30",
    durationMinutes: 120,
    closeHoursBefore: 24,
    newBatchStatus: "DRAFT",
    futureBatchCount: 2,
    autoCreate: true,
    alertEmails: [],
  };
  const withDay2 = {
    ...settings,
    day2OffsetDays: 4,
    defaultDay2StartTimeIst: "19:00",
    day2DurationMinutes: 180,
    preview: [{ date: "2026-12-05", text: "Saturday, 5 December 2026", day2Date: "2026-12-09", day2Text: "Wednesday, 9 December 2026" }],
  };
  const value = (testId: string) => (screen.getByTestId(testId) as HTMLInputElement).value;
  const load = async (saved: Record<string, unknown>) => {
    vi.mocked(axios.get).mockResolvedValue({ data: { settings: [saved], courses: [course] } });
    render(
      <MemoryRouter>
        <BatchSettingsPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect((document.querySelector('input[type="time"]') as HTMLInputElement).value).toBe("10:30"));
  };

  it("shows the saved day 2, previews both days and sends day 2 when saved", async () => {
    await load(withDay2);
    expect(value("day2-offset")).toBe("4");
    expect(value("day2-time")).toBe("19:00");
    expect(value("day2-length")).toBe("180");
    expect(screen.getByTestId("cycle-preview").textContent).toBe("Saturday, 5 December 2026 and Wednesday, 9 December 2026");

    vi.mocked(axios.put).mockResolvedValue({ data: {} });
    fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    const [url, body] = vi.mocked(axios.put).mock.calls[0];
    expect(url).toMatch(/\/api\/admin\/batch-settings$/);
    expect(body).toMatchObject({
      defaultStartTimeIst: "10:30", durationMinutes: 120,
      day2OffsetDays: 4, defaultDay2StartTimeIst: "19:00", day2DurationMinutes: 180,
    });
  });

  it("with no day 2 saved, day 2 is the next day and follows day 1's time and length until changed", async () => {
    await load({ ...settings, day2OffsetDays: null, defaultDay2StartTimeIst: null, day2DurationMinutes: null });
    expect(value("day2-offset")).toBe("1");
    expect(value("day2-time")).toBe("10:30");
    expect(value("day2-length")).toBe("120");

    const day1Time = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(day1Time, { target: { value: "11:00" } });
    expect(value("day2-time")).toBe("11:00");

    // Once day 2 has its own time, a change to day 1 leaves it.
    fireEvent.change(screen.getByTestId("day2-time"), { target: { value: "19:00" } });
    fireEvent.change(day1Time, { target: { value: "09:00" } });
    expect(value("day2-time")).toBe("19:00");
  });
});

describe("Landing pages: the batch on sale names its own two days", () => {
  const orders = { paid: 0, revenueRupees: 0, pending: 0, failed: 0, paidLast30Days: 0, revenueLast30DaysRupees: 0 };
  const show = async (day1StartAt: string, day2StartAt: string) => {
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        success: true,
        ordersCountedSince: "2026-11-15",
        pages: [
          {
            key: "mpf-v20", page: "v20", name: "v20", url: "https://x/v20",
            paths: { landing: "/v20", checkout: "/v20/checkout", thankYou: "/v20/thank-you" },
            status: "live", course: { id: "c2", title: "Course", slug: "c" }, sharesCourseWith: [],
            batchOnSale: { id: "b9", batchNumber: 3, day1StartAt, day2StartAt, bookingCloseAt: day1StartAt, priceRupees: 2999, paidSeats: 0, seatsLeft: null },
            orders,
          },
        ],
        tracking: {
          metaPixelId: null, metaCapi: false, metaCapiTestMode: false, ga4Id: null, ga4ViaGtm: false, gtmId: null, clarityId: null,
          events: { landing: [], checkout: [], thankYou: [] },
        },
      },
    });
    render(
      <MemoryRouter>
        <LandingPagesPage />
      </MemoryRouter>,
    );
    return (await screen.findByTestId("landing-mpf-v20")).textContent ?? "";
  };

  // 21 November 2026 is a Saturday; 04:30 UTC is 10:00 AM in India.
  it("two days in a row at one time", async () => {
    expect(await show("2026-11-21T04:30:00.000Z", "2026-11-22T04:30:00.000Z")).toMatch(/Batch 3 · Sat 21 Nov – Sun 22 Nov, 10:00\s?am IST/i);
  });

  it("a weekday batch is not called Sat and Sun", async () => {
    const text = await show("2026-11-25T04:30:00.000Z", "2026-11-26T04:30:00.000Z");
    expect(text).toMatch(/Batch 3 · Wed 25 Nov – Thu 26 Nov, 10:00\s?am IST/i);
    expect(text).not.toMatch(/Sat |Sun /);
  });

  it("days that are not in a row, and days at different times", async () => {
    expect(await show("2026-11-21T04:30:00.000Z", "2026-11-28T04:30:00.000Z")).toMatch(/Sat 21 Nov and Sat 28 Nov, 10:00\s?am IST/i);
    cleanup();
    expect(await show("2026-11-21T04:30:00.000Z", "2026-11-25T13:30:00.000Z")).toMatch(
      /Sat 21 Nov, 10:00\s?am IST and Wed 25 Nov, 7:00\s?pm IST/i,
    );
  });
});

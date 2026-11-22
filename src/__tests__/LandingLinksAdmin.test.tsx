// The admin screens that link a course to a workshop landing page:
// Masterclasses (which course each page sells) and Batch settings (each
// course has its own settings).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import MasterclassManagement from "../components/MasterClassManagement";
import BatchSettingsPage from "../components/BatchSettingsPage";

vi.mock("axios");
// The rich-text editor is not needed for these tests.
vi.mock("../components/TiptapEditor", () => ({ default: () => null }));

const course = (over: Record<string, unknown>) => ({
  title: "Course",
  description: "d",
  price: 100,
  type: "LIVE",
  status: "Available",
  visibility: "show",
  isPublished: true,
  tcCourseId: "tc",
  categoryId: "cat1",
  ...over,
});

const courses = [
  course({ id: "c10", _id: "c10", title: "Master Mutual Funds: Invest Smarter", price: 399, useBatches: true, landingPage: "v10" }),
  course({ id: "c20", _id: "c20", title: "Master Personal Finance with AI", price: 2999, useBatches: true, landingPage: "v20" }),
  course({ id: "c99", _id: "c99", title: "Recorded Course", type: "RECORDED", landingPage: null }),
];

const settingsFor = (courseId: string, price: number, time: string) => ({
  courseId,
  anchorDay1Date: "2026-11-21",
  cadenceDays: 14,
  defaultPriceRupees: price,
  defaultStartTimeIst: time,
  durationMinutes: 120,
  closeHoursBefore: 24,
  newBatchStatus: "DRAFT",
  futureBatchCount: 2,
  autoCreate: true,
  alertEmails: [],
  preview: [],
});

// The Switch control measures itself; the test browser has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(axios.isAxiosError).mockReturnValue(false);
  vi.mocked(axios.get).mockImplementation(async (url: string) => {
    if (url.endsWith("/api/admin/category")) return { data: { success: true, categories: [{ id: "cat1", _id: "cat1", name: "Workshops" }] } };
    if (url.endsWith("/api/admin/masterclass/all-classes")) return { data: { success: true, courses } };
    if (url.endsWith("/api/admin/batch-settings")) {
      return {
        data: {
          settings: [settingsFor("c10", 399, "11:30")],
          courses: [
            { id: "c10", title: "Master Mutual Funds: Invest Smarter", landingPath: "/v10" },
            { id: "c20", title: "Master Personal Finance with AI", landingPath: "/v20" },
          ],
        },
      };
    }
    throw new Error(`unexpected ${url}`);
  });
});

describe("Masterclasses: workshop landing pages", () => {
  it("shows which course each page sells, and that /v30 has none", async () => {
    render(<MemoryRouter><MasterclassManagement /></MemoryRouter>);

    const v10 = await screen.findByTestId("landing-link-v10");
    await waitFor(() => expect(within(v10).getByText("Linked")).toBeTruthy());
    expect(within(v10).getByText("Master Mutual Funds: Invest Smarter")).toBeTruthy();

    const v20 = screen.getByTestId("landing-link-v20");
    expect(within(v20).getByText("Master Personal Finance with AI")).toBeTruthy();

    const v30 = screen.getByTestId("landing-link-v30");
    expect(within(v30).getByText("No course linked")).toBeTruthy();
    expect(within(v30).getByText("Create course for /v30")).toBeTruthy();

    // Each linked course carries a badge in the list; the ordinary one does not.
    expect(screen.getByText("Landing page /v10")).toBeTruthy();
    expect(screen.getByText("Landing page /v20")).toBeTruthy();
    expect(screen.queryByText("Landing page /v30")).toBeNull();
  });

  it("the edit form of the v10 course has /v10 selected", async () => {
    render(<MemoryRouter><MasterclassManagement /></MemoryRouter>);
    const v10 = await screen.findByTestId("landing-link-v10");
    fireEvent.click(await within(v10).findByText("Edit this course"));

    const select = (await screen.findByTestId("landing-page-select")) as HTMLSelectElement;
    expect(select.value).toBe("v10");
  });

  it("'Create course for /v30' opens the form with /v30 selected and saves the link", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    render(<MemoryRouter><MasterclassManagement /></MemoryRouter>);
    const v30 = await screen.findByTestId("landing-link-v30");
    fireEvent.click(within(v30).getByText("Create course for /v30"));

    const select = (await screen.findByTestId("landing-page-select")) as HTMLSelectElement;
    expect(select.value).toBe("v30");

    const form = select.closest("form") as HTMLFormElement;
    const byName = (name: string) => form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    fireEvent.change(byName("title"), { target: { value: "Master Personal Finance with AI" } });
    fireEvent.change(byName("description"), { target: { value: "2-day live workshop" } });
    fireEvent.change(byName("categoryId"), { target: { value: "cat1" } });
    fireEvent.change(byName("price"), { target: { value: "2999" } });
    fireEvent.submit(form);

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    const [url, payload] = vi.mocked(axios.post).mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toContain("/api/admin/masterclass/create");
    expect(payload).toMatchObject({ landingPage: "v30", useBatches: true, visibility: "hide", type: "LIVE" });
  });
});

describe("Batch settings: one set per course", () => {
  it("shows the chosen course's own settings, and an empty form for a course without any", async () => {
    render(<MemoryRouter><BatchSettingsPage /></MemoryRouter>);

    const courseSelect = await waitFor(() => {
      const el = document.querySelector("select") as HTMLSelectElement;
      expect(el.value).toBe("c10");
      return el;
    });
    const price = () => (document.querySelector('input[type="number"][min="1"]') as HTMLInputElement).value;
    const time = () => (document.querySelector('input[type="time"]') as HTMLInputElement).value;
    expect(price()).toBe("399");
    expect(time()).toBe("11:30");

    // Switch to the v20 course: it has no saved settings, so v10's values must not show.
    fireEvent.change(courseSelect, { target: { value: "c20" } });
    await waitFor(() => expect(price()).toBe(""));
    expect(courseSelect.value).toBe("c20");

    // And back.
    fireEvent.change(courseSelect, { target: { value: "c10" } });
    await waitFor(() => expect(price()).toBe("399"));
  });
});

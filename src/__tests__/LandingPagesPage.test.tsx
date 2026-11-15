import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import LandingPagesPage from "../components/LandingPagesPage";

vi.mock("axios");

const orders = { paid: 0, revenueRupees: 0, pending: 0, failed: 0, paidLast30Days: 0, revenueLast30DaysRupees: 0 };
const mpfCourse = { id: "c2", title: "Master Personal Finance with AI", slug: "master-personal-finance-with-ai" };
const batch = {
  id: "b9",
  batchNumber: 3,
  day1StartAt: "2026-11-21T04:30:00.000Z",
  day2StartAt: "2026-11-22T04:30:00.000Z",
  bookingCloseAt: "2026-11-20T18:29:00.000Z",
  priceRupees: 2999,
  paidSeats: 8,
  seatsLeft: 42,
};

const data = {
  success: true,
  ordersCountedSince: "2026-11-15",
  pages: [
    {
      key: "mmf-v10", page: "v10", name: "v10 · Master Mutual Funds", url: "https://x/v10",
      paths: { landing: "/v10", checkout: "/v10/checkout", thankYou: "/v10/thank-you" },
      status: "no_batch_on_sale", course: { id: "c1", title: "Master Mutual Funds", slug: "m" },
      sharesCourseWith: [], batchOnSale: null, orders: { ...orders, paid: 5, revenueRupees: 1995 },
    },
    {
      key: "mpf-v20", page: "v20", name: "v20 · Master Personal Finance with AI", url: "https://x/v20",
      paths: { landing: "/v20", checkout: "/v20/checkout", thankYou: "/v20/thank-you" },
      status: "live", course: mpfCourse, sharesCourseWith: [], batchOnSale: batch, orders,
    },
    {
      key: "mpf-v30", page: "v30", name: "v30 · Master Personal Finance with AI (new design)", url: "https://x/v30",
      paths: { landing: "/v30", checkout: "/v30/checkout", thankYou: "/v30/thank-you" },
      status: "course_missing", course: null, sharesCourseWith: [], batchOnSale: null, orders,
    },
  ],
  tracking: {
    metaPixelId: "123", metaCapi: true, metaCapiTestMode: false, ga4Id: "G-1", ga4ViaGtm: false,
    gtmId: null, clarityId: "cl1",
    events: { landing: ["PageView"], checkout: ["InitiateCheckout"], thankYou: ["Purchase"] },
  },
};

describe("LandingPagesPage", () => {
  it("shows the three pages, each with its own linked course, status, sales and tracking", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data });
    render(<MemoryRouter><LandingPagesPage /></MemoryRouter>);

    const v10 = await screen.findByTestId("landing-mmf-v10");
    expect(within(v10).getByText("No batch on sale")).toBeTruthy();
    expect(within(v10).getByText("Open a batch →")).toBeTruthy();
    expect(within(v10).getByText("5")).toBeTruthy();

    const v20 = screen.getByTestId("landing-mpf-v20");
    expect(within(v20).getByText("Live, selling")).toBeTruthy();
    expect(within(v20).getByText("Master Personal Finance with AI")).toBeTruthy();
    expect(within(v20).getByText(/8 booked · 42 of 50 left/)).toBeTruthy();

    // v30 has no course of its own yet: the card says how to link one.
    const v30 = screen.getByTestId("landing-mpf-v30");
    expect(within(v30).getByText("No course linked")).toBeTruthy();
    expect(within(v30).getByText(/set "Workshop landing page" to \/v30/)).toBeTruthy();
    expect(within(v30).getByText("Link a course in Masterclasses →")).toBeTruthy();

    expect(screen.getByText("Meta Conversions API")).toBeTruthy();
    expect(screen.getByText("server-side Purchase")).toBeTruthy();
    // GTM not set -> one "Off" badge.
    expect(screen.getAllByText("Off")).toHaveLength(1);
  });
});

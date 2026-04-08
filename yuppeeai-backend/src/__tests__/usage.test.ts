import type { HttpRequest } from "../types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/authMiddleware", () => ({
  initializeFirebaseAdmin: vi.fn(),
  requireAuth: vi.fn().mockResolvedValue({ uid: "test-user" }),
}));

vi.mock("../services/searchUsageService", () => ({
  getSearchUsage: vi.fn().mockResolvedValue({
    tier: "internal_test",
    tierName: "Internal Test",
    tierDescription: "Internal testing tier with a large monthly search quota.",
    monthlyQuota: 1000000,
    periodKey: "2026-04",
    periodSearchesUsed: 7,
    lifetimeSearchesUsed: 7,
    accessExpiresAtPeriod: "2080-01",
    remainingSearchesThisPeriod: 999993,
  }),
}));

import { handler } from "../handlers/usage";
import { getSearchUsage } from "../services/searchUsageService";

function makeEvent(): Partial<HttpRequest> {
  return {
    httpMethod: "GET",
    body: null,
    headers: {},
  };
}

describe("usage handler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns usage totals for authenticated users", async () => {
    const event = makeEvent();
    const result = await handler(event as HttpRequest);

    expect(result.statusCode).toBe(200);
    expect(getSearchUsage).toHaveBeenCalledWith("test-user");
    expect(JSON.parse(result.body)).toEqual({
      uid: "test-user",
      totalSearches: 7,
      tier: "internal_test",
      tierName: "Internal Test",
      tierDescription:
        "Internal testing tier with a large monthly search quota.",
      monthlyQuota: 1000000,
      periodKey: "2026-04",
      periodSearchesUsed: 7,
      accessExpiresAtPeriod: "2080-01",
      remainingSearchesThisPeriod: 999993,
    });
  });

  it("returns 500 when usage service throws", async () => {
    vi.mocked(getSearchUsage).mockRejectedValueOnce(
      new Error("firestore unavailable"),
    );

    const event = makeEvent();
    const result = await handler(event as HttpRequest);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toMatch(/firestore unavailable/i);
  });
});

import type { HttpRequest } from "../types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/authMiddleware", () => ({
  initializeFirebaseAdmin: vi.fn(),
  requireAuth: vi.fn().mockResolvedValue({ uid: "test-user" }),
}));

vi.mock("../services/searchUsageService", () => ({
  consumeSearchQuota: vi.fn().mockResolvedValue({
    allowed: true,
    usage: {
      tier: "internal_test",
      monthlyQuota: 1000000,
      periodKey: "2026-04",
      periodSearchesUsed: 1,
      lifetimeSearchesUsed: 1,
      accessExpiresAtPeriod: "2080-01",
      remainingSearchesThisPeriod: 999999,
    },
  }),
}));

import { handler } from "../handlers/search";
import { SearchProvider } from "../services/searchProvider";
import { consumeSearchQuota } from "../services/searchUsageService";

function makeEvent(body?: object | null): Partial<HttpRequest> {
  return {
    httpMethod: "POST",
    body: body !== undefined && body !== null ? JSON.stringify(body) : null,
    headers: {},
  };
}

describe("search handler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when query is missing", async () => {
    const event = makeEvent({});
    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/query/i);
  });

  it("returns 400 when body is empty", async () => {
    const event = makeEvent(null);
    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(400);
  });

  it("returns 200 with results when query is provided", async () => {
    vi.spyOn(SearchProvider.prototype, "getSearchResults").mockResolvedValue({
      results: [
        {
          id: "r1",
          title: "Sample Result",
          url: "https://example.com/result",
          snippet: "Sample snippet",
          summary: "A sample summary.",
        },
      ],
      query: "interesting topics",
    });

    const event = makeEvent({ query: "interesting topics" });
    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.results).toBeDefined();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
    expect(consumeSearchQuota).toHaveBeenCalledWith("test-user");
  });

  it("results contain expected fields", async () => {
    vi.spyOn(SearchProvider.prototype, "getSearchResults").mockResolvedValue({
      results: [
        {
          id: "r1",
          title: "Sample Result",
          url: "https://example.com/result",
          snippet: "Sample snippet",
          summary: "A sample summary.",
        },
      ],
      query: "interesting topics",
    });

    const event = makeEvent({ query: "interesting topics" });
    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    const firstResult = body.results[0];
    expect(firstResult).toHaveProperty("id");
    expect(firstResult).toHaveProperty("title");
    expect(firstResult).toHaveProperty("url");
    expect(firstResult).toHaveProperty("snippet");
    expect(firstResult).toHaveProperty("summary");
  });

  it("returns provider results for a valid query", async () => {
    vi.spyOn(SearchProvider.prototype, "getSearchResults").mockResolvedValue({
      results: [
        {
          id: "book-1",
          title: "Book Result",
          url: "https://example.com/book-1",
          snippet: "Book snippet",
          summary: "A book summary.",
        },
        {
          id: "book-2",
          title: "Another Book Result",
          url: "https://example.com/book-2",
          snippet: "Another book snippet",
          summary: "Another book summary.",
        },
      ],
      query: "best book recommendations",
    });

    const event = makeEvent({ query: "best book recommendations" });
    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.query).toBe("best book recommendations");
    expect(body.results.length).toBe(2);
  });

  it("returns 500 when provider throws", async () => {
    vi.spyOn(SearchProvider.prototype, "getSearchResults").mockRejectedValue(
      new Error("search backend unavailable"),
    );

    const event = makeEvent({ query: "top rated movie 2023" });
    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/search backend unavailable/i);
    expect(consumeSearchQuota).not.toHaveBeenCalled();
  });

  it("still returns 200 when usage tracking fails", async () => {
    vi.spyOn(SearchProvider.prototype, "getSearchResults").mockResolvedValue({
      results: [],
      query: "interesting topics",
    });

    vi.mocked(consumeSearchQuota).mockRejectedValueOnce(
      new Error("firestore unavailable"),
    );

    const event = makeEvent({ query: "interesting topics" });
    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(200);
  });

  it("returns 429 when monthly quota is exceeded", async () => {
    vi.spyOn(SearchProvider.prototype, "getSearchResults").mockResolvedValue({
      results: [],
      query: "interesting topics",
    });

    vi.mocked(consumeSearchQuota).mockResolvedValueOnce({
      allowed: false,
      statusCode: 429,
      error: "Monthly search quota exceeded",
      usage: {
        tier: "internal_test",
        monthlyQuota: 1,
        periodKey: "2026-04",
        periodSearchesUsed: 1,
        lifetimeSearchesUsed: 100,
        accessExpiresAtPeriod: "2080-01",
        remainingSearchesThisPeriod: 0,
      },
    });

    const event = makeEvent({ query: "interesting topics" });
    const result = await handler(event as HttpRequest);
    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(429);
    expect(body.error).toMatch(/quota exceeded/i);
    expect(body.usage.accessExpiresAtPeriod).toBe("2080-01");
  });

  it("returns 403 when subscription is expired", async () => {
    vi.spyOn(SearchProvider.prototype, "getSearchResults").mockResolvedValue({
      results: [],
      query: "interesting topics",
    });

    vi.mocked(consumeSearchQuota).mockResolvedValueOnce({
      allowed: false,
      statusCode: 403,
      error: "Subscription has expired",
      usage: {
        tier: "internal_test",
        monthlyQuota: 1000000,
        periodKey: "2080-02",
        periodSearchesUsed: 200,
        lifetimeSearchesUsed: 5000,
        accessExpiresAtPeriod: "2080-01",
        remainingSearchesThisPeriod: 999800,
      },
    });

    const event = makeEvent({ query: "interesting topics" });
    const result = await handler(event as HttpRequest);
    const body = JSON.parse(result.body);
    expect(result.statusCode).toBe(403);
    expect(body.error).toMatch(/expired/i);
    expect(body.usage.accessExpiresAtPeriod).toBe("2080-01");
  });
});

import type { HttpRequest } from "../types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/authMiddleware", () => ({
  initializeFirebaseAdmin: vi.fn(),
  requireAuth: vi.fn().mockResolvedValue({ uid: "test-user" }),
}));

import { handler } from "../handlers/refine";
import { SearchRefiner } from "../services/searchRefiner";

function makeEvent(body?: object | null): Partial<HttpRequest> {
  return {
    httpMethod: "POST",
    body: body !== undefined && body !== null ? JSON.stringify(body) : null,
    headers: {},
  };
}

describe("search refinements handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when query is missing", async () => {
    const event = makeEvent({});
    const result = await handler(event as HttpRequest);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/query/i);
  });

  it("returns 400 when JSON is invalid", async () => {
    const event = {
      httpMethod: "POST",
      body: "{invalid-json}",
      headers: {},
    } as Partial<HttpRequest>;

    const result = await handler(event as HttpRequest);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/invalid json/i);
  });

  it("returns inferred refinements for a valid query", async () => {
    const inferSpy = vi
      .spyOn(SearchRefiner.prototype, "inferSearchRefinements")
      .mockResolvedValue({
        query: "best books about startup fundraising",
        disambiguation: {
          presumed: {
            doYouMean: "analysis",
            query: "best books about startup fundraising analysis",
          },
          alternatives: [],
        },
        widgets: [],
      });

    const event = makeEvent({
      query: "best books about startup fundraising",
    });

    const result = await handler(event as HttpRequest);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.disambiguation).toEqual({
      presumed: {
        doYouMean: "analysis",
        query: "best books about startup fundraising analysis",
      },
      alternatives: [],
    });
    expect(body.widgets).toEqual([]);
    expect(inferSpy).toHaveBeenCalledWith({
      query: "best books about startup fundraising",
    });
  });
});

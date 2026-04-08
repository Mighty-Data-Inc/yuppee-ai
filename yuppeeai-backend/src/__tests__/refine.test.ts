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
  const REFINEMENT_SHOTGUN = 5;

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
        widgets: [
          {
            id: "w1",
            type: "dropdown",
            label: "Topic",
            tooltip: "Filter by topic",
            value: "",
            options: [
              { label: "Fundraising", value: "fundraising" },
              { label: "Pitching", value: "pitching" },
            ],
          },
        ],
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
    expect(body.widgets.length).toBeGreaterThan(0);
    expect(inferSpy).toHaveBeenCalledTimes(REFINEMENT_SHOTGUN);
    for (let i = 1; i <= REFINEMENT_SHOTGUN; i++) {
      expect(inferSpy).toHaveBeenNthCalledWith(i, {
        query: "best books about startup fundraising",
        instructions: undefined,
      });
    }
  });

  it("discards empty-widget results and returns a non-empty result", async () => {
    const inferSpy = vi
      .spyOn(SearchRefiner.prototype, "inferSearchRefinements")
      .mockImplementationOnce(async () => ({
        query: "query",
        widgets: [],
      }))
      .mockImplementationOnce(async () => ({
        query: "query",
        widgets: [
          {
            id: "w1",
            type: "dropdown",
            label: "Topic",
            tooltip: "Filter by topic",
            value: "",
            options: [
              { label: "A", value: "a" },
              { label: "B", value: "b" },
            ],
          },
        ],
      }))
      .mockImplementation(async () => ({
        query: "query",
        widgets: [],
      }));

    const event = makeEvent({ query: "query" });
    const result = await handler(event as HttpRequest);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.widgets.length).toBeGreaterThan(0);
    expect(inferSpy).toHaveBeenCalledTimes(REFINEMENT_SHOTGUN);
  });

  it("returns default empty widgets response when all shotgun runs are empty", async () => {
    const inferSpy = vi
      .spyOn(SearchRefiner.prototype, "inferSearchRefinements")
      .mockResolvedValue({
        query: "query",
        widgets: [],
      });

    const event = makeEvent({ query: "query" });
    const result = await handler(event as HttpRequest);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      query: "query",
      widgets: [],
    });
    expect(inferSpy).toHaveBeenCalledTimes(REFINEMENT_SHOTGUN);
  });
});

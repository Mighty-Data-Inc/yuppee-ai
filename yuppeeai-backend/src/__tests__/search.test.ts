import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/authMiddleware", () => ({
  initializeFirebaseAdmin: vi.fn(),
  requireAuth: vi.fn().mockResolvedValue({ uid: "test-user" }),
}));

import { handler } from "../handlers/search";
import { SearchProvider } from "../services/searchProvider";

const mockContext = {} as Context;

function makeEvent(body?: object | null): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: "POST",
    body: body !== undefined && body !== null ? JSON.stringify(body) : null,
    headers: {},
    queryStringParameters: null,
    pathParameters: null,
    isBase64Encoded: false,
  };
}

describe("search handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when query is missing", async () => {
    const event = makeEvent({});
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/query/i);
  });

  it("returns 400 when body is empty", async () => {
    const event = makeEvent(null);
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
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
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.results).toBeDefined();
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
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
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
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
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
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
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/search backend unavailable/i);
  });
});

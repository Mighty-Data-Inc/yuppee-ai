import type { HttpRequest } from "../types";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/authMiddleware", () => ({
  initializeFirebaseAdmin: vi.fn(),
  requireAuth: vi.fn().mockResolvedValue({ uid: "test-user" }),
}));

import { handler } from "../handlers/inflightmsg";
import { InflightMessageWriter } from "../services/inflightMessageWriter";

function makeEvent(body?: object | null): Partial<HttpRequest> {
  return {
    httpMethod: "POST",
    body: body !== undefined && body !== null ? JSON.stringify(body) : null,
    headers: {},
  };
}

describe("inflight message handler", () => {
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

  it("returns generated inflight message for a valid query", async () => {
    const createMessageSpy = vi
      .spyOn(InflightMessageWriter.prototype, "createInflightMessage")
      .mockResolvedValue({
        query: "crimean war personal accounts",
        message:
          "Searching for books about the Crimean War with a focus on personal accounts.",
      });

    const event = makeEvent({
      query: "crimean war personal accounts",
      instructions: ["Books only", "Prioritize firsthand narratives"],
    });

    const result = await handler(event as HttpRequest);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      query: "crimean war personal accounts",
      message:
        "Searching for books about the Crimean War with a focus on personal accounts.",
    });
    expect(createMessageSpy).toHaveBeenCalledWith({
      query: "crimean war personal accounts",
      instructions: ["Books only", "Prioritize firsthand narratives"],
    });
  });
});

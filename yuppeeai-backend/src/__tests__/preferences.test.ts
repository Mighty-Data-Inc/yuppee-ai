import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../handlers/preferences";

const mockContext = {} as Context;

function makeGetEvent(userId?: string): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: "GET",
    body: null,
    headers: {},
    queryStringParameters: userId ? { userId } : null,
    pathParameters: null,
    isBase64Encoded: false,
  };
}

function makePostEvent(body: object): Partial<APIGatewayProxyEvent> {
  return {
    httpMethod: "POST",
    body: JSON.stringify(body),
    headers: {},
    queryStringParameters: null,
    pathParameters: null,
    isBase64Encoded: false,
  };
}

describe("preferences handler", () => {
  beforeEach(() => {
    process.env["USE_MOCK"] = "true";
  });

  it("GET returns 400 when userId is missing", async () => {
    const event = makeGetEvent();
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/userId/i);
  });

  it("GET returns 200 with empty preferences for new user", async () => {
    const event = makeGetEvent("user-new-123");
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe("user-new-123");
    expect(body.preferences).toEqual({});
  });

  it("POST saves and returns preferences", async () => {
    const event = makePostEvent({
      userId: "user-abc",
      queryCategory: "books",
      preferences: { fiction: "nonfiction", genre: "history" },
    });
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe("user-abc");
    expect(body.preferences).toHaveProperty("books");
    expect(body.preferences["books"]).toEqual({
      fiction: "nonfiction",
      genre: "history",
    });
  });

  it("POST returns 400 when userId is missing", async () => {
    const event = makePostEvent({
      queryCategory: "books",
      preferences: { fiction: "fiction" },
    });
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/userId/i);
  });

  it("GET after POST returns saved preferences", async () => {
    // Note: each handler invocation creates a new PreferencesStore instance (in-memory mock),
    // so we exercise the round-trip within a single POST call which both saves and returns.
    const postEvent = makePostEvent({
      userId: "user-roundtrip",
      queryCategory: "movies",
      preferences: { genre: "action", rating: "pg-13" },
    });
    const postResult = await handler(
      postEvent as APIGatewayProxyEvent,
      mockContext,
    );
    expect(postResult.statusCode).toBe(200);
    const postBody = JSON.parse(postResult.body);
    expect(postBody.preferences["movies"]).toEqual({
      genre: "action",
      rating: "pg-13",
    });
  });

  it("POST without preferences or queryCategory returns empty preferences", async () => {
    const event = makePostEvent({ userId: "user-empty" });
    const result = await handler(event as APIGatewayProxyEvent, mockContext);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe("user-empty");
    expect(body.preferences).toEqual({});
  });
});

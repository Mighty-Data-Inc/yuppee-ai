import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../handlers/refine";
import { SearchRefiner } from "../services/searchRefiner";

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

describe("search refinements handler", () => {
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

  it("returns 400 when JSON is invalid", async () => {
    const event = {
      httpMethod: "POST",
      body: "{invalid-json}",
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      isBase64Encoded: false,
    } as Partial<APIGatewayProxyEvent>;

    const result = await handler(event as APIGatewayProxyEvent, mockContext);
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
      widgets: [
        {
          id: "language",
          type: "dropdown",
          label: "Language",
          value: "en",
        },
      ],
    });

    const result = await handler(event as APIGatewayProxyEvent, mockContext);

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
      widgets: [
        {
          id: "language",
          type: "dropdown",
          label: "Language",
          value: "en",
        },
      ],
    });
  });
});

import type { APIGatewayProxyResult } from "aws-lambda";
import type {
  LambdaHandler,
  RefinementResponse,
  SearchRequest,
} from "../types";
import { SearchRefiner } from "../services/searchRefiner";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export const handler: LambdaHandler = async (event, _context) => {
  try {
    let request: Partial<SearchRequest> = {};

    if (event.body) {
      try {
        request =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch {
        return errorResponse(400, "Invalid JSON in request body");
      }
    }

    if (
      !request.query ||
      typeof request.query !== "string" ||
      request.query.trim() === ""
    ) {
      return errorResponse(400, "Missing required field: query");
    }

    const searchRefiner = new SearchRefiner({
      openaiApiKey: process.env["OPENAI_API_KEY"],
    });

    const response: RefinementResponse =
      await searchRefiner.inferSearchRefinements({
        query: request.query,
        filters: request.filters,
      });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return errorResponse(500, message);
  }
};

function errorResponse(
  statusCode: number,
  message: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

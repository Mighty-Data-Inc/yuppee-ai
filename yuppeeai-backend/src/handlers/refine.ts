import type { APIGatewayProxyResult } from "aws-lambda";
import type {
  LambdaHandler,
  RefinementResponse,
  RefinementRequest,
} from "../types";
import { SearchRefiner } from "../services/searchRefiner";
import {
  requireAuth,
  initializeFirebaseAdmin,
} from "../middleware/authMiddleware";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

// Initialize Firebase Admin on module load
initializeFirebaseAdmin();

export const handler: LambdaHandler = async (event, _context) => {
  try {
    // Require authentication
    const decodedToken = await requireAuth(event);
    console.log(`Authenticated user: ${decodedToken?.uid ?? "unknown"}`);

    let request: Partial<RefinementRequest> = {};

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
        instructions: request.instructions,
      });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (err) {
    const statusCode = (err as any).statusCode || 500;
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return errorResponse(statusCode, message);
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

import type { HttpHandler, HttpResponse, SERPRequest } from "../types";
import { SearchProvider } from "../services/searchProvider";
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

export const handler: HttpHandler = async (event) => {
  try {
    // Require authentication
    const decodedToken = await requireAuth(event);
    console.log(`Authenticated user: ${decodedToken?.uid ?? "unknown"}`);

    let request: Partial<SERPRequest> = {};

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

    const searchProvider = new SearchProvider({
      openaiApiKey: process.env["OPENAI_API_KEY"],
    });

    const response = await searchProvider.getSearchResults({
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

function errorResponse(statusCode: number, message: string): HttpResponse {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

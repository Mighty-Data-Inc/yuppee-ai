import type {
  HttpHandler,
  HttpResponse,
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

// Number of parallel LLM calls to fire simultaneously. The first one to return
// a non-empty widgets array wins; the rest are discarded. This hedges against
// slow or empty responses from the LLM.
const REFINEMENT_SHOTGUN = 5;

const EMPTY_WIDGETS_ERROR = "Empty widgets result";

// Wraps inferSearchRefinements with two behaviours on top:
//   1. Throws if the response has no widgets, so Promise.any treats it as a
//      failed attempt rather than a successful-but-useless result.
//   2. Logs every failure so individual attempts are visible in the logs.
async function inferSearchRefinementsWithLogging(
  searchRefiner: SearchRefiner,
  request: RefinementRequest,
): Promise<RefinementResponse> {
  try {
    const response = await searchRefiner.inferSearchRefinements(request);
    if (!Array.isArray(response.widgets) || response.widgets.length === 0) {
      throw new Error(EMPTY_WIDGETS_ERROR);
    }
    return response;
  } catch (error) {
    const isExpectedEmptyWidgetsError =
      error instanceof Error && error.message === EMPTY_WIDGETS_ERROR;
    if (!isExpectedEmptyWidgetsError) {
      console.error("inferSearchRefinements failed", error);
    }
    throw error;
  }
}

// Initialize Firebase Admin on module load
initializeFirebaseAdmin();

export const handler: HttpHandler = async (event) => {
  try {
    // Require authentication
    const decodedToken = await requireAuth(event);

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

    const refinementRequest: RefinementRequest = {
      query: request.query!,
      instructions: request.instructions,
    };

    // Fire REFINEMENT_SHOTGUN attempts in parallel. Each attempt is an
    // independent LLM call. If a response comes back with no widgets, then
    // the helper throws on empty results so that Promise.any skips it
    // and waits for a better one.
    const refinementAttempts = Array.from({ length: REFINEMENT_SHOTGUN }, () =>
      inferSearchRefinementsWithLogging(searchRefiner, refinementRequest),
    );

    // Resolve with the first attempt that returns non-empty widgets.
    // If every attempt fails or returns empty, fall back to an empty response
    // rather than surfacing an error to the client.
    const defaultEmptyResponse: RefinementResponse = {
      query: request.query!,
      widgets: [],
    };
    const response: RefinementResponse = await Promise.any(
      refinementAttempts,
    ).catch(() => defaultEmptyResponse);

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

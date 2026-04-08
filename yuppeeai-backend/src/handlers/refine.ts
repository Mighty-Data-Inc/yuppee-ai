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

const REFINEMENT_SHOTGUN = 5;

class EmptyWidgetsError extends Error {
  constructor() {
    super("Empty widgets result");
    this.name = "EmptyWidgetsError";
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

    let response: RefinementResponse;
    try {
      response = await Promise.any(
        Array.from({ length: REFINEMENT_SHOTGUN }, async () => {
          const candidate = await searchRefiner.inferSearchRefinements({
            query: request.query!,
            instructions: request.instructions,
          });

          if (
            !Array.isArray(candidate.widgets) ||
            candidate.widgets.length === 0
          ) {
            throw new EmptyWidgetsError();
          }

          return candidate;
        }),
      );
    } catch (err) {
      if (err instanceof AggregateError && err.errors.length > 0) {
        const allEmpty = err.errors.every(
          (e: unknown) => e instanceof EmptyWidgetsError,
        );
        if (allEmpty) {
          response = {
            query: request.query,
            widgets: [],
          };
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (err) {
    if (err instanceof AggregateError && err.errors.length > 0) {
      const firstErr =
        err.errors.find((e: unknown) => !(e instanceof EmptyWidgetsError)) ??
        err.errors[0];
      const statusCode = (firstErr as any).statusCode || 500;
      const message =
        firstErr instanceof Error ? firstErr.message : "Internal server error";
      return errorResponse(statusCode, message);
    }

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

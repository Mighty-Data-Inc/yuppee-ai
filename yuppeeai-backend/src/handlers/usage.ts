import type { HttpHandler, HttpResponse } from "../types";
import { getSearchUsage } from "../services/searchUsageService";
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
    const decodedToken = await requireAuth(event);
    const usage = await getSearchUsage(decodedToken.uid);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        uid: decodedToken.uid,
        totalSearches: usage.lifetimeSearchesUsed,
        tier: usage.tier,
        monthlyQuota: usage.monthlyQuota,
        periodKey: usage.periodKey,
        periodSearchesUsed: usage.periodSearchesUsed,
        accessExpiresAtPeriod: usage.accessExpiresAtPeriod,
        remainingSearchesThisPeriod: usage.remainingSearchesThisPeriod,
      }),
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

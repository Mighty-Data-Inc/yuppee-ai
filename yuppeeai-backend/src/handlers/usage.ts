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
        tierName: usage.tierName,
        tierDescription: usage.tierDescription,
        monthlyQuota: usage.monthlyQuota,
        periodKey: usage.periodKey,
        periodSearchesUsed: usage.periodSearchesUsed,
        accessExpiresAtPeriod: usage.accessExpiresAtPeriod,
        remainingSearchesThisPeriod: usage.remainingSearchesThisPeriod,
      }),
    };
  } catch (err) {
    if ((err as any).statusCode !== 401) {
      console.error("[Usage] Request failed", err);
    }

    const statusCode = (err as any).statusCode || 500;
    const message =
      statusCode === 401
        ? err instanceof Error
          ? err.message
          : "Unauthorized"
        : "Usage data is temporarily unavailable";
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

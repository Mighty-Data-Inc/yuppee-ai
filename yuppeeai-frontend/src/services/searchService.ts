import type {
  SERPRequest,
  SERPResponse,
  RefinementRequest,
  RefinementResponse,
} from "@yuppee-ai/contracts";
import { useAuthStore } from "@/stores/authStore";
import { getAuthToken, getCurrentUser } from "@/services/authService";

export interface InflightMessageResponse {
  query: string;
  message: string;
}

export interface UsageResponse {
  uid: string;
  totalSearches: number;
  tier: string;
  tierName: string;
  tierDescription: string;
  monthlyQuota: number;
  periodKey: string;
  periodSearchesUsed: number;
  accessExpiresAtPeriod: string;
  remainingSearchesThisPeriod: number;
}

export interface CheckoutResponse {
  sessionUrl: string;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function parseJsonBody(response: Response): Promise<unknown | null> {
  if (typeof response.json !== "function") {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const authStore = useAuthStore();
  const headers: Record<string, string> = {};

  let token = authStore.authToken;

  // After a hard refresh, Firebase may restore `currentUser` before the store's
  // auth listener has finished hydrating `authToken`. Recover it lazily here.
  const hasCurrentUser = (() => {
    try {
      return !!getCurrentUser();
    } catch {
      return false;
    }
  })();

  if (!token && (authStore.isAuthenticated || hasCurrentUser)) {
    try {
      token = await getAuthToken();
      authStore.authToken = token;
    } catch (error) {
      console.warn("[Auth] Failed to hydrate auth token for request", error);
      token = null;
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function submitSERPQuery(
  serpRequest: SERPRequest,
  timestamp: number,
): Promise<{
  response: SERPResponse;
  timestamp: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify(serpRequest),
  });

  if (response.status === 401 || response.status === 403) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = response.status;
    throw error;
  }

  if (!response.ok) {
    const errorPayload = await parseJsonBody(response);
    const backendMessage =
      errorPayload &&
      typeof errorPayload === "object" &&
      "error" in errorPayload &&
      typeof (errorPayload as any).error === "string"
        ? (errorPayload as any).error
        : null;

    const error = new Error(
      backendMessage || `Search request failed: ${response.status}`,
    );
    (error as any).statusCode = response.status;
    if (
      errorPayload &&
      typeof errorPayload === "object" &&
      "usage" in errorPayload
    ) {
      (error as any).usage = (errorPayload as any).usage;
    }

    console.error("[SERP] /api/search failed", {
      status: response.status,
      body: JSON.stringify(serpRequest, null, 2),
    });
    throw error;
  }
  const data = (await response.json()) as SERPResponse;
  return {
    response: data,
    timestamp,
  };
}

export async function submitRefinementQuery(
  refinementRequest: RefinementRequest,
  timestamp: number,
): Promise<{
  response: RefinementResponse;
  timestamp: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/refine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify(refinementRequest),
  });

  if (response.status === 401 || response.status === 403) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = response.status;
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Refinements request failed: ${response.status}`);
  }

  const data = (await response.json()) as RefinementResponse;
  return {
    response: data,
    timestamp,
  };
}

export async function submitInflightMessageQuery(
  request: SERPRequest,
): Promise<InflightMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/inflightmsg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify(request),
  });

  if (response.status === 401 || response.status === 403) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = response.status;
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Inflight message request failed: ${response.status}`);
  }

  return (await response.json()) as InflightMessageResponse;
}

export async function fetchUsage(): Promise<UsageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/usage`, {
    method: "GET",
    headers: {
      ...(await getAuthHeaders()),
    },
  });

  if (response.status === 401 || response.status === 403) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = response.status;
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Usage request failed: ${response.status}`);
  }

  return (await response.json()) as UsageResponse;
}

export async function initiateCheckout(
  tierId: string,
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE_URL}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: JSON.stringify({ tierId }),
  });

  if (response.status === 401 || response.status === 403) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = response.status;
    throw error;
  }

  if (!response.ok) {
    const errorPayload = await parseJsonBody(response);
    const backendMessage =
      errorPayload &&
      typeof errorPayload === "object" &&
      "error" in errorPayload &&
      typeof (errorPayload as any).error === "string"
        ? (errorPayload as any).error
        : null;

    throw new Error(backendMessage || `Checkout failed: ${response.status}`);
  }

  return (await response.json()) as CheckoutResponse;
}

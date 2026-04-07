import type {
  SERPRequest,
  SERPResponse,
  RefinementRequest,
  RefinementResponse,
} from "@yuppee-ai/contracts";
import { useAuthStore } from "@/stores/authStore";

export interface InflightMessageResponse {
  query: string;
  message: string;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

function getAuthHeaders(): Record<string, string> {
  const authStore = useAuthStore();
  const headers: Record<string, string> = {};

  if (authStore.authToken) {
    headers["Authorization"] = `Bearer ${authStore.authToken}`;
  }

  return headers;
}

export async function submitSERPQuery(
  serpRequest: SERPRequest,
): Promise<SERPResponse> {
  console.log("[SERP] Submitting query", JSON.stringify(serpRequest, null, 2));

  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(serpRequest),
  });

  if (response.status === 401 || response.status === 403) {
    const error = new Error("Unauthorized");
    (error as any).statusCode = response.status;
    throw error;
  }

  if (!response.ok) {
    console.error("[SERP] /search failed", {
      status: response.status,
      body: JSON.stringify(serpRequest, null, 2),
    });
    throw new Error(`Search request failed: ${response.status}`);
  }
  const data = (await response.json()) as SERPResponse;
  console.log("[SERP] Received response", JSON.stringify(data, null, 2));
  return data;
}

export async function submitRefinementQuery(
  refinementRequest: RefinementRequest,
): Promise<RefinementResponse> {
  console.log(
    "[Refinement] Submitting refinement query",
    JSON.stringify(refinementRequest, null, 2),
  );

  const response = await fetch(`${API_BASE_URL}/refine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
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
  console.log(
    "[Refinement] Received refinement response",
    JSON.stringify(data, null, 2),
  );
  return data;
}

export async function submitInflightMessageQuery(
  request: SERPRequest,
): Promise<InflightMessageResponse> {
  console.log(
    "[InflightMsg] Submitting inflight message query",
    JSON.stringify(request, null, 2),
  );

  const response = await fetch(`${API_BASE_URL}/inflightmsg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
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

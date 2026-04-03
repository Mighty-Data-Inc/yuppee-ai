import type {
  SERPResponse,
  SERPResult,
  RefinementWidget,
} from "@yuppee-ai/contracts";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export async function submitSERPQuery(
  serpRequest: SERPRequest,
): Promise<SERPResponse> {
  console.log("[SERP] Submitting query", JSON.stringify(serpRequest, null, 2));

  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(serpRequest),
  });
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refinementRequest),
  });
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

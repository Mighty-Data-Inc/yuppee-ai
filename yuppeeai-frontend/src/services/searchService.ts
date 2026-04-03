import type { SERPResponse, SERPResult, RefinementWidget } from "@/types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export async function submitSERPQuery(
  query: string,
  widgets?: RefinementWidget[],
  instructions?: string[],
): Promise<SERPResponse> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, widgets, instructions }),
  });
  if (!response.ok) {
    console.error("[SERP] /search failed", {
      status: response.status,
      query,
      widgets,
      instructions,
    });
    throw new Error(`Search request failed: ${response.status}`);
  }
  const data = await response.json();
  const payload = data as { results?: SERPResult[]; summary?: unknown };
  return {
    query,
    results: payload.results ?? [],
    summary: typeof payload.summary === "string" ? payload.summary : undefined,
  };
}

export async function submitRefinementQuery(
  query: string,
  widgets?: RefinementWidget[],
  instructions?: string[],
  knownResults?: SERPResult[],
): Promise<{
  disambiguation: string;
  widgets: RefinementWidget[];
}> {
  const response = await fetch(`${API_BASE_URL}/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      widgets,
      instructions,
      results: knownResults,
    }),
  });
  if (!response.ok) {
    throw new Error(`Refinements request failed: ${response.status}`);
  }

  const data = await response.json();

  const retval = {
    disambiguation: data.disambiguation || "",
    widgets: data.widgets || [],
  };
  return retval;
}

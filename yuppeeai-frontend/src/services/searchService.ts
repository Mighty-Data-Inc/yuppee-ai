import type { SearchResponse, SearchResult, Widget } from "@/types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export async function submitSERPQuery(
  query: string,
  filters?: Record<string, any>,
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `filters` may include `additionalInstructions` from freeform refine text.
    body: JSON.stringify({ query, filters }),
  });
  if (!response.ok) {
    console.error("[SERP] /search failed", {
      status: response.status,
      query,
      filters,
    });
    throw new Error(`Search request failed: ${response.status}`);
  }
  const data = await response.json();
  const payload = data as { results?: SearchResult[]; summary?: unknown };
  return {
    query,
    results: payload.results ?? [],
    summary: typeof payload.summary === "string" ? payload.summary : undefined,
  };
}

export async function submitSearchRefinement(
  query: string,
  currentFilters?: Record<string, any>,
  knownResults?: SearchResult[],
): Promise<{
  disambiguation: string;
  widgets: Widget[];
}> {
  const response = await fetch(`${API_BASE_URL}/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      // Keep filters contract identical to /search for backend consistency.
      filters: currentFilters,
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

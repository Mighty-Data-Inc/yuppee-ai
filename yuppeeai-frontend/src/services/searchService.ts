import type { SearchResult, Widget } from "@/types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export interface SearchResponse {
  results: SearchResult[];
  resultSummary: string;
}

function cleanUpSERPResults(rawResults: unknown): SearchResult[] {
  if (!Array.isArray(rawResults)) {
    return [];
  }

  const seenUrls = new Set<string>();
  const normalized: SearchResult[] = [];

  for (const rawResult of rawResults) {
    const result = rawResult as Record<string, unknown>;
    const url = typeof result.url === "string" ? result.url.trim() : "";
    if (!url || seenUrls.has(url)) {
      continue;
    }
    seenUrls.add(url);

    const title =
      typeof result.title === "string" && result.title.trim()
        ? result.title
        : url;
    const summary = typeof result.summary === "string" ? result.summary : "";
    const snippet = typeof result.snippet === "string" ? result.snippet : "";

    normalized.push({
      title,
      url,
      snippet,
      summary,
    });
  }

  return normalized;
}

export async function submitSearchQuery(
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
  console.log("[SERP] /search payload\n" + JSON.stringify(data, undefined, 2)); // TODO DEBUG DELETE THIS
  const payload = data as { results?: unknown; result_summary?: unknown };
  return {
    results: cleanUpSERPResults(payload.results),
    resultSummary:
      typeof payload.result_summary === "string" ? payload.result_summary : "",
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
  console.log("[SERP] /refine payload\n" + JSON.stringify(data, undefined, 2)); // TODO DEBUG DELETE THIS

  const retval = {
    disambiguation: data.disambiguation || "",
    widgets: data.widgets || [],
  };
  return retval;
}

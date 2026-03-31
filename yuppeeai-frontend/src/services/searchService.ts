import type { SearchResult, Widget } from "@/types";
import { normalizeWidgets } from "@/services/widgetAdapter";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export async function search(
  query: string,
  filters?: Record<string, any>,
): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // `filters` may include `additionalInstructions` from freeform refine text.
    body: JSON.stringify({ query, filters }),
  });
  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.results as SearchResult[];
}

export async function generateWidgets(
  query: string,
  currentFilters?: Record<string, any>,
  knownResults?: SearchResult[],
): Promise<Widget[]> {
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
  return normalizeWidgets(
    Array.isArray(data) ? data : data.widgets,
    currentFilters,
  );
}

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SearchResult, Widget } from "@/types";
import { search, generateWidgets } from "@/services/searchService";

const PREFS_KEY = "yuppee_search_preferences";

export const useSearchStore = defineStore("search", () => {
  const query = ref("");
  const results = ref<SearchResult[]>([]);
  const widgets = ref<Widget[]>([]);
  const refinement = ref("");
  const isLoadingResults = ref(false);
  const isLoadingWidgets = ref(false);
  const isLoading = computed(
    () => isLoadingResults.value || isLoadingWidgets.value,
  );
  const error = ref<string | null>(null);
  const preferences = ref<Record<string, any>>({});
  const activeRequestId = ref(0);

  function loadPreferences() {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        preferences.value = JSON.parse(stored);
      }
    } catch {
      preferences.value = {};
    }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences.value));
    } catch {
      // ignore storage errors
    }
  }

  function getCategoryKey(q: string): string {
    const lower = q.toLowerCase();
    if (
      lower.includes("book") ||
      lower.includes("novel") ||
      lower.includes("fiction") ||
      lower.includes("literature")
    )
      return "books";
    if (
      lower.includes("movie") ||
      lower.includes("film") ||
      lower.includes("cinema")
    )
      return "movies";
    return "general";
  }

  async function performSearch(q: string, widgetValues?: Record<string, any>) {
    const requestId = ++activeRequestId.value;
    query.value = q;
    isLoadingResults.value = true;
    isLoadingWidgets.value = true;
    error.value = null;

    const category = getCategoryKey(q);
    const savedPrefs = preferences.value[category] ?? {};
    const effectiveFilters = widgetValues ?? savedPrefs;

    const searchRequest = search(q, effectiveFilters)
      .then((searchResults) => {
        if (activeRequestId.value !== requestId) return;
        results.value = searchResults;
      })
      .catch((e) => {
        if (activeRequestId.value !== requestId) return;
        error.value =
          e instanceof Error ? e.message : "An error occurred during search";
        results.value = [];
      })
      .finally(() => {
        if (activeRequestId.value !== requestId) return;
        isLoadingResults.value = false;
      });

    const refinementRequest = generateWidgets(q, effectiveFilters)
      .then((generatedWidgets) => {
        if (activeRequestId.value !== requestId) return;
        widgets.value = generatedWidgets;
      })
      .catch((e) => {
        if (activeRequestId.value !== requestId) return;
        if (!error.value) {
          error.value =
            e instanceof Error
              ? e.message
              : "An error occurred while loading refinements";
        }
        widgets.value = [];
      })
      .finally(() => {
        if (activeRequestId.value !== requestId) return;
        isLoadingWidgets.value = false;
      });

    await Promise.allSettled([searchRequest, refinementRequest]);

    if (activeRequestId.value !== requestId) return;

    if (widgetValues && Object.keys(widgetValues).length > 0) {
      preferences.value[category] = widgetValues;
      savePreferences();
    }
  }

  function updateWidgetValue(widgetId: string, value: any) {
    const widget = widgets.value.find((w) => w.id === widgetId);
    if (widget) {
      widget.value = value;
    }
  }

  function clearSearch() {
    activeRequestId.value += 1;
    query.value = "";
    results.value = [];
    widgets.value = [];
    refinement.value = "";
    isLoadingResults.value = false;
    isLoadingWidgets.value = false;
    error.value = null;
  }

  return {
    query,
    results,
    widgets,
    refinement,
    isLoadingResults,
    isLoadingWidgets,
    isLoading,
    error,
    preferences,
    loadPreferences,
    savePreferences,
    performSearch,
    updateWidgetValue,
    clearSearch,
  };
});

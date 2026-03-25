import { defineStore } from "pinia";
import { ref } from "vue";
import type { SearchResult, Widget } from "@/types";
import { search, generateWidgets } from "@/services/searchService";

const PREFS_KEY = "yuppee_search_preferences";

export const useSearchStore = defineStore("search", () => {
  const query = ref("");
  const results = ref<SearchResult[]>([]);
  const widgets = ref<Widget[]>([]);
  const refinement = ref("");
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const preferences = ref<Record<string, any>>({});

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
    query.value = q;
    isLoading.value = true;
    error.value = null;

    const category = getCategoryKey(q);
    const savedPrefs = preferences.value[category] ?? {};
    const effectiveFilters = widgetValues ?? savedPrefs;

    try {
      const [searchResults, generatedWidgets] = await Promise.all([
        search(q, effectiveFilters),
        generateWidgets(q, effectiveFilters),
      ]);

      results.value = searchResults;
      widgets.value = generatedWidgets;

      if (widgetValues) {
        preferences.value[category] = widgetValues;
        savePreferences();
      }
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "An error occurred during search";
      results.value = [];
      widgets.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function updateWidgetValue(widgetId: string, value: any) {
    const widget = widgets.value.find((w) => w.id === widgetId);
    if (widget) {
      widget.value = value;
    }
  }

  function clearSearch() {
    query.value = "";
    results.value = [];
    widgets.value = [];
    refinement.value = "";
    isLoading.value = false;
    error.value = null;
  }

  return {
    query,
    results,
    widgets,
    refinement,
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

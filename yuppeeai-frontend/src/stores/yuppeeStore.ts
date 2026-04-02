import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SearchResult, Widget } from "@/types";
import {
  submitSearchQuery,
  submitSearchRefinement,
} from "@/services/searchService";

export const useYuppeeStore = defineStore("yuppee", () => {
  const query = ref("");

  const serpResults = ref<SearchResult[]>([]);
  const serpSummary = ref("");

  const widgets = ref<Widget[]>([]);
  const additionalInstructionPoints = ref<string[]>([]);

  const isLoadingSERP = ref(false);
  const isLoadingWidgets = ref(false);

  const error = ref("");

  function reset() {
    query.value = "";
    serpResults.value = [];
    serpSummary.value = "";
    widgets.value = [];
    additionalInstructionPoints.value = [];
    error.value = "";
  }

  async function search(q: string, widgetValues?: Record<string, any>) {
    q = q.trim();
    const isNewQuery = q !== query.value;

    console.log("Searching: ", q);

    if (isNewQuery) {
      reset();
    }

    query.value = q;
    isLoadingSERP.value = true;
    isLoadingWidgets.value = true;

    // TODO: Set refinements in flight

    const filters = {
      widgets,
      additionalInstructionPoints,
    };

    // TODO (low priority): Record the timestamp when the last query went out.
    // Ignore the results of any resolved promise that has an earlier timestamp.

    const serpRequest = submitSearchQuery(q, filters)
      .then((searchResponse) => {
        serpResults.value = searchResponse.serpResults;
        serpSummary.value = searchResponse.serpSummary;
      })
      .catch((e) => {
        error.value =
          e instanceof Error ? e.message : "An error occurred during search";
        serpResults.value = [];
        serpSummary.value = "";
      })
      .finally(() => {
        isLoadingSERP.value = false;
      });

    const refinementRequest = submitSearchRefinement(q, filters)
      .then((refinementResponse) => {
        widgets.value = refinementResponse.widgets;
        // TODO: Handle preserving filters
        // TODO: Handle disambiguation
      })
      .catch((e) => {
        if (!error.value) {
          error.value =
            e instanceof Error
              ? e.message
              : "An error occurred while loading refinements";
        }
        widgets.value = [];
      })
      .finally(() => {
        isLoadingWidgets.value = false;
      });

    await Promise.allSettled([serpRequest, refinementRequest]);
  }

  return {
    query,
    serpResults,
    serpSummary,
    widgets,
    additionalInstructionPoints,
    isLoadingSERP,
    isLoadingWidgets,
    error,
    reset,
    search,
  };
});

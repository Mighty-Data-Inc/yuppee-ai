import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SearchResult, Widget } from "@/types";
import {
  submitSearchQuery,
  submitSearchRefinement,
} from "@/services/searchService";
import { showError } from "@/services/errorService";

export const useYuppeeStore = defineStore("yuppee", () => {
  const query = ref("");

  const serpResults = ref<SearchResult[]>([]);
  const serpSummary = ref("");

  const widgets = ref<Widget[]>([]);
  const widgetsFromLastSubmit = ref<Widget[]>([]);
  const newAdditionalInstruction = ref("");
  const additionalInstructionPoints = ref<string[]>([]);

  const isLoadingSERP = ref(false);
  const isLoadingWidgets = ref(false);

  function reset() {
    query.value = "";
    serpResults.value = [];
    serpSummary.value = "";
    widgets.value = [];
    widgetsFromLastSubmit.value = [];
    newAdditionalInstruction.value = "";
    additionalInstructionPoints.value = [];
  }

  async function search(q: string) {
    q = q.trim();
    const isNewQuery = q !== query.value;

    if (isNewQuery) {
      reset();
    }

    query.value = q;
    isLoadingSERP.value = true;
    isLoadingWidgets.value = true;

    // TODO: Set refinements in flight

    const filters = {
      widgets: widgets.value,
      additionalInstructionPoints: additionalInstructionPoints.value,
    };

    // TODO (low priority): Record the timestamp when the last query went out.
    // Ignore the results of any resolved promise that has an earlier timestamp.

    const serpRequest = submitSearchQuery(q, filters)
      .then((searchResponse) => {
        console.log(searchResponse);
        serpResults.value = searchResponse.serpResults;
        serpSummary.value = searchResponse.serpSummary;
      })
      .catch((e) => {
        console.error(e);
        showError(
          e instanceof Error ? e.message : "An error occurred during search",
        );
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
        console.error(e);
        showError(
          e instanceof Error
            ? e.message
            : "An error occurred while loading refinements",
        );
        widgets.value = [];
      })
      .finally(() => {
        widgetsFromLastSubmit.value = JSON.parse(JSON.stringify(widgets.value));
        isLoadingWidgets.value = false;
      });

    await Promise.allSettled([serpRequest, refinementRequest]);
  }

  const hasWidgetChanges = computed(() =>
    widgets.value.some(
      (w) =>
        JSON.stringify(w.value) !==
        JSON.stringify(
          widgetsFromLastSubmit.value.find((b) => b.id === w.id)?.value,
        ),
    ),
  );

  return {
    query,
    serpResults,
    serpSummary,
    widgets,
    widgetsFromLastSubmit,
    newAdditionalInstruction,
    additionalInstructionPoints,
    isLoadingSERP,
    isLoadingWidgets,
    reset,
    search,
    hasWidgetChanges,
  };
});

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { SERPResult, RefinementWidget } from "@/types";
import {
  submitSERPQuery,
  submitRefinementQuery,
} from "@/services/searchService";
import { showError } from "@/services/errorService";

export const useYuppeeStore = defineStore("yuppee", () => {
  const query = ref("");

  const serpResults = ref<SERPResult[]>([]);
  const serpSummary = ref("");

  const widgets = ref<RefinementWidget[]>([]);
  const widgetsFromLastSubmit = ref<RefinementWidget[]>([]);
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

    // TODO (low priority): Record the timestamp when the last query went out.
    // Ignore the results of any resolved promise that has an earlier timestamp.

    const serpRequest = submitSERPQuery(
      q,
      widgets.value,
      additionalInstructionPoints.value,
    )
      .then((searchResponse) => {
        serpResults.value = searchResponse.results;
        serpSummary.value = searchResponse.summary ?? "";
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

    const refinementRequest = submitRefinementQuery(
      q,
      widgets.value,
      additionalInstructionPoints.value,
    )
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

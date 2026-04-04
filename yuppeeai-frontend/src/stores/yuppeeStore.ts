import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  SERPResult,
  RefinementWidget,
  Disambiguation,
} from "@yuppee-ai/contracts";
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

  const disambiguation = ref<Disambiguation | null>(null);

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
    disambiguation.value = null;
  }

  async function search(q: string) {
    q = q.trim();
    const isNewQuery = q !== query.value;

    if (isNewQuery) {
      reset();
    }

    query.value = q;
    disambiguation.value = null;
    isLoadingSERP.value = true;
    isLoadingWidgets.value = true;

    // TODO (low priority): Record the timestamp when the last query went out.
    // Ignore the results of any resolved promise that has an earlier timestamp.

    const serpRequest = submitSERPQuery({
      query: q,
      widgets: widgets.value,
      instructions: additionalInstructionPoints.value,
    })
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

    const refinementRequest = submitRefinementQuery({
      query: q,
      widgets: widgets.value,
      instructions: additionalInstructionPoints.value,
    })
      .then((refinementResponse) => {
        disambiguation.value = refinementResponse.disambiguation ?? null;
        console.log("DISAMBIGUATION", disambiguation.value);

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

  const widgetsWithChangedValues = computed(() =>
    widgets.value.filter(
      (w) =>
        JSON.stringify(w.value) !==
        JSON.stringify(
          widgetsFromLastSubmit.value.find((b) => b.id === w.id)?.value,
        ),
    ),
  );

  const haveAnyValuesChanged = computed(
    () => widgetsWithChangedValues.value.length > 0,
  );

  return {
    query,
    serpResults,
    serpSummary,
    widgets,
    widgetsFromLastSubmit,
    disambiguation,
    newAdditionalInstruction,
    additionalInstructionPoints,
    isLoadingSERP,
    isLoadingWidgets,
    reset,
    search,
    widgetsWithChangedValues,
    haveAnyValuesChanged,
  };
});

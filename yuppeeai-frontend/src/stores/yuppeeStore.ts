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
  submitInflightMessageQuery,
} from "@/services/searchService";
import { showError } from "@/services/errorService";
import { queryRefinementCacheService } from "@/services/queryRefinementCacheService";

export const useYuppeeStore = defineStore("yuppee", () => {
  const query = ref("");

  const serpResults = ref<SERPResult[]>([]);
  const serpSummary = ref("");

  const widgets = ref<RefinementWidget[]>([]);
  const widgetsFromLastSubmit = ref<RefinementWidget[]>([]);
  const newAdditionalInstruction = ref("");
  const additionalInstructionPoints = ref<string[]>([]);

  const disambiguation = ref<Disambiguation | null>(null);
  const inflightMessage = ref<string | null>(null);

  const isLoadingSERP = ref(false);
  const isLoadingWidgets = ref(false);
  const authError = ref<string | null>(null);

  function reset() {
    query.value = "";
    serpResults.value = [];
    serpSummary.value = "";
    widgets.value = [];
    widgetsFromLastSubmit.value = [];
    newAdditionalInstruction.value = "";
    additionalInstructionPoints.value = [];
    disambiguation.value = null;
    inflightMessage.value = null;
  }

  async function search(q: string) {
    q = q.trim();
    const isNewQuery = q !== query.value;

    if (isNewQuery) {
      reset();
    }

    query.value = q;
    disambiguation.value = null;
    inflightMessage.value = null;
    isLoadingSERP.value = true;
    isLoadingWidgets.value = true;
    newAdditionalInstruction.value = newAdditionalInstruction.value.trim();

    additionalInstructionPoints.value.push(
      ...describeChangedWidgetValues.value,
    );
    newAdditionalInstruction.value = "";

    // TODO (low priority): Record the timestamp when the last query went out.
    // Ignore the results of any resolved promise that has an earlier timestamp.

    queryRefinementCacheService.save(q, additionalInstructionPoints.value);

    const serpRequest = submitSERPQuery({
      query: q,
      instructions: additionalInstructionPoints.value,
    })
      .then((searchResponse) => {
        serpResults.value = searchResponse.results;
        serpSummary.value = searchResponse.summary ?? "";
        authError.value = null;
      })
      .catch((e) => {
        console.error(e);
        if ((e as any).statusCode === 401 || (e as any).statusCode === 403) {
          authError.value =
            "You must be signed in to search. Please sign in and try again.";
        } else {
          showError(
            e instanceof Error ? e.message : "An error occurred during search",
          );
        }
        serpResults.value = [];
        serpSummary.value = "";
      })
      .finally(() => {
        isLoadingSERP.value = false;
      });

    const refinementRequest = submitRefinementQuery({
      query: q,
      instructions: additionalInstructionPoints.value,
    })
      .then((refinementResponse) => {
        disambiguation.value = refinementResponse.disambiguation ?? null;

        // Both the "live" widgets and the snapshot of widgets from the "last" submit
        // (i.e. the submit that just happened) should be updated together, so that
        // they stay in sync and the user can see which values have changed since the last submit.
        // We'll make them both be deep clones so that they're initially symmetrical.
        widgets.value = JSON.parse(JSON.stringify(refinementResponse.widgets));
        widgetsFromLastSubmit.value = JSON.parse(
          JSON.stringify(refinementResponse.widgets),
        );

        if (isNewQuery) {
          // Load any additional instructions that we had saved for this query in the past.
          additionalInstructionPoints.value =
            queryRefinementCacheService.load(q) ?? [];
        }

        // If this wasn't a new query, we don't want to see the disambiguation anymore.
        if (!isNewQuery) {
          disambiguation.value = null;
        }
      })
      .catch((e) => {
        console.error(e);
        if ((e as any).statusCode === 401 || (e as any).statusCode === 403) {
          authError.value =
            "You must be signed in to search. Please sign in and try again.";
        } else {
          showError(
            e instanceof Error
              ? e.message
              : "An error occurred while loading refinements",
          );
        }
        widgets.value = [];
      })
      .finally(() => {
        widgetsFromLastSubmit.value = JSON.parse(JSON.stringify(widgets.value));
        isLoadingWidgets.value = false;
      });

    const inflightMessageRequest = submitInflightMessageQuery({
      query: q,
      instructions: additionalInstructionPoints.value,
    })
      .then((inflightResponse) => {
        inflightMessage.value = inflightResponse.message;
        console.log(
          "[InflightMsg] Received inflight message",
          inflightResponse.message,
        );
      })
      .catch((e) => {
        console.warn("[InflightMsg] Failed to load inflight message", e);
      });

    await Promise.allSettled([
      serpRequest,
      refinementRequest,
      inflightMessageRequest,
    ]);
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

  const describeWidgetChanges = computed((): string[] => {
    const lines: string[] = [];
    for (const widget of widgetsWithChangedValues.value) {
      const previousWidgetValue = widgetsFromLastSubmit.value.find(
        (w) => w.id === widget.id,
      )?.value;
      const currentWidgetValue = widget.value;

      if (widget.type === "dropdown") {
        // Map stored values to display labels, falling back to raw values.
        const toLabel = (v: any) =>
          widget.options?.find((o) => o.value === v)?.label ?? v;
        const previousLabel = toLabel(previousWidgetValue);
        const currentLabel = toLabel(currentWidgetValue);

        if (!previousLabel) {
          lines.push(`${widget.label}: Applying criterion "${currentLabel}"`);
        } else if (!currentLabel) {
          lines.push(`${widget.label}: Removing criterion "${previousLabel}"`);
        } else {
          lines.push(
            `${widget.label}: "${previousLabel}" -> "${currentLabel}"`,
          );
        }
      } else if (widget.type === "switch") {
        if (currentWidgetValue) {
          lines.push(`Applying criterion "${widget.label}"`);
        } else {
          lines.push(`Removing criterion "${widget.label}"`);
        }
      } else if (widget.type === "chipgroup") {
        const asStringArray = (value: unknown): string[] =>
          Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string")
            : [];
        const previousChips = asStringArray(previousWidgetValue);
        const currentChips = asStringArray(currentWidgetValue);
        const resolveChipLabel = (value: string) =>
          widget.options?.find((o) => o.value === value)?.label ?? value;
        const added = currentChips
          .filter((v) => !previousChips.includes(v))
          .map(resolveChipLabel);
        const removed = previousChips
          .filter((v) => !currentChips.includes(v))
          .map(resolveChipLabel);

        if (added.length) {
          lines.push(`${widget.label}: Adding "${added.join('", "')}"`);
        }
        if (removed.length) {
          lines.push(`${widget.label}: Removing "${removed.join('", "')}"`);
        }
      } else if (widget.type === "slider") {
        const mode = widget.sliderMode ?? "range";
        if (mode === "exact") {
          lines.push(
            `${widget.label}: Changing value from ${previousWidgetValue} to ${currentWidgetValue}`,
          );
        } else if (mode === "lte") {
          lines.push(
            `${widget.label}: Changing upper bound from ${previousWidgetValue} to ${currentWidgetValue}`,
          );
        } else if (mode === "gte") {
          lines.push(
            `${widget.label}: Changing lower bound from ${previousWidgetValue} to ${currentWidgetValue}`,
          );
        } else if (mode === "range") {
          if (
            Array.isArray(previousWidgetValue) &&
            Array.isArray(currentWidgetValue)
          ) {
            const [prevLow, prevHigh] = previousWidgetValue as [number, number];
            const [currLow, currHigh] = currentWidgetValue as [number, number];

            if (prevLow !== currLow) {
              lines.push(
                `${widget.label}: Changing lower bound from ${prevLow} to ${currLow}`,
              );
            }
            if (prevHigh !== currHigh) {
              lines.push(
                `${widget.label}: Changing upper bound from ${prevHigh} to ${currHigh}`,
              );
            }
          }
        }
      }
    }

    if (newAdditionalInstruction.value.trim()) {
      lines.push(
        `Additional instruction: "${newAdditionalInstruction.value.trim()}"`,
      );
    }

    return lines;
  });

  const describeChangedWidgetValues = computed((): string[] => {
    const lines: string[] = [];

    for (const widget of widgetsWithChangedValues.value) {
      const currentWidgetValue = widget.value;

      if (widget.type === "dropdown") {
        const currentLabel =
          widget.options?.find((o) => o.value === currentWidgetValue)?.label ??
          currentWidgetValue;

        if (currentLabel) {
          lines.push(
            `${widget.label}: Specifically interested in "${currentLabel}"`,
          );
        }
      } else if (widget.type === "switch") {
        if (currentWidgetValue) {
          lines.push(`Applying criterion "${widget.label}"`);
        }
      } else if (widget.type === "chipgroup") {
        const currentChips = Array.isArray(currentWidgetValue)
          ? currentWidgetValue.filter(
              (item): item is string => typeof item === "string",
            )
          : [];
        const resolvedLabels = currentChips.map(
          (value) =>
            widget.options?.find((o) => o.value === value)?.label ?? value,
        );

        if (resolvedLabels.length) {
          lines.push(
            `${widget.label} &mdash; Looking for these criteria: "${resolvedLabels.join('", "')}"`,
          );
        }
      } else if (widget.type === "slider") {
        const mode = widget.sliderMode ?? "range";

        if (mode === "exact") {
          lines.push(
            `${widget.label}: Looking specifically for the value ${currentWidgetValue}`,
          );
        } else if (mode === "lte") {
          lines.push(
            `${widget.label}: Looking for values less than or equal to ${currentWidgetValue}`,
          );
        } else if (mode === "gte") {
          lines.push(
            `${widget.label}: Looking for values greater than or equal to ${currentWidgetValue}`,
          );
        } else if (mode === "range" && Array.isArray(currentWidgetValue)) {
          const [currLow, currHigh] = currentWidgetValue as [number, number];
          lines.push(
            `${widget.label}: Looking for values in the range ${currLow}-${currHigh}`,
          );
        }
      }
    }

    if (newAdditionalInstruction.value.trim()) {
      lines.push(
        `Additional instruction: "${newAdditionalInstruction.value.trim()}"`,
      );
    }

    return lines;
  });

  const haveAnyValuesChanged = computed(
    () =>
      widgetsWithChangedValues.value.length > 0 ||
      newAdditionalInstruction.value.trim() !== "",
  );

  return {
    query,
    serpResults,
    serpSummary,
    widgets,
    widgetsFromLastSubmit,
    disambiguation,
    inflightMessage,
    newAdditionalInstruction,
    additionalInstructionPoints,
    isLoadingSERP,
    isLoadingWidgets,
    authError,
    reset,
    search,
    widgetsWithChangedValues,
    describeWidgetChanges,
    describeChangedWidgetValues,
    haveAnyValuesChanged,
  };
});

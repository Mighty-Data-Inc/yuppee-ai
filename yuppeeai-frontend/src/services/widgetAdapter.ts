import type { Widget } from "@/types";

type BackendWidgetChoice = {
  value: string;
  label: string;
};

type BackendWidget = {
  type: string;
  id?: string;
  variable_name?: string;
  label?: string;
  tooltip?: string;
  options?: BackendWidgetChoice[];
  min?: number;
  max?: number;
  step?: number;
  params?: {
    choices?: BackendWidgetChoice[];
    choices_concat_abbrev?: string;
    value_min?: number;
    value_max?: number;
    user_selects_lowest_value_of_range?: boolean;
    user_selects_highest_value_of_range?: boolean;
  };
  value?: any;
};

function getSliderMode(
  widget: BackendWidget,
  filterValue: unknown,
): NonNullable<Widget["sliderMode"]> {
  const selectsLow = widget.params?.user_selects_lowest_value_of_range;
  const selectsHigh = widget.params?.user_selects_highest_value_of_range;

  if (selectsLow === true && selectsHigh === true) return "range";
  if (selectsLow === true && selectsHigh === false) return "gte";
  if (selectsLow === false && selectsHigh === true) return "lte";
  if (selectsLow === false && selectsHigh === false) return "exact";

  if (Array.isArray(filterValue) || Array.isArray(widget.value)) return "range";
  if (typeof filterValue === "number" || typeof widget.value === "number") {
    return "exact";
  }

  return "range";
}

function normalizeWidgetType(type: string): Widget["type"] | null {
  if (type === "dropdown") return "dropdown";
  if (type === "chipgroup" || type === "checkboxes") return "chipgroup";
  if (type === "checkbox") return "checkbox";
  if (type === "switch") return "switch";
  if (type === "slider" || type === "range-slider") return "range-slider";
  if (type === "radio") return "radio";
  if (type === "freeform") return "freeform";
  return null;
}

export function normalizeWidgets(
  rawWidgets: unknown,
  currentFilters?: Record<string, any>,
): Widget[] {
  if (!Array.isArray(rawWidgets)) {
    return [];
  }

  return rawWidgets
    .map((rawWidget): Widget | null => {
      const widget = rawWidget as BackendWidget;
      const type = normalizeWidgetType(widget.type);
      if (!type) {
        return null;
      }

      const id = widget.id ?? widget.variable_name ?? widget.label ?? "widget";
      const options = widget.options ?? widget.params?.choices;

      if (type === "range-slider") {
        const min = widget.min ?? widget.params?.value_min ?? 0;
        const max = widget.max ?? widget.params?.value_max ?? 100;
        const filterValue = currentFilters?.[id];
        const sliderMode = getSliderMode(widget, filterValue);

        let value: number | [number, number];
        if (sliderMode === "range") {
          if (Array.isArray(filterValue) && filterValue.length >= 2) {
            value = [Number(filterValue[0]), Number(filterValue[1])];
          } else if (Array.isArray(widget.value) && widget.value.length >= 2) {
            value = [Number(widget.value[0]), Number(widget.value[1])];
          } else {
            value = [min, max];
          }
        } else if (sliderMode === "gte") {
          if (typeof filterValue === "number") {
            value = filterValue;
          } else if (Array.isArray(filterValue) && filterValue.length > 0) {
            value = Number(filterValue[0]);
          } else if (typeof widget.value === "number") {
            value = widget.value;
          } else {
            value = min;
          }
        } else if (sliderMode === "lte") {
          if (typeof filterValue === "number") {
            value = filterValue;
          } else if (Array.isArray(filterValue) && filterValue.length >= 2) {
            value = Number(filterValue[1]);
          } else if (typeof widget.value === "number") {
            value = widget.value;
          } else {
            value = max;
          }
        } else {
          if (typeof filterValue === "number") {
            value = filterValue;
          } else if (Array.isArray(filterValue) && filterValue.length > 0) {
            value = Number(filterValue[0]);
          } else if (typeof widget.value === "number") {
            value = widget.value;
          } else {
            value = min;
          }
        }

        return {
          id,
          type,
          label: widget.label ?? id,
          tooltip: widget.tooltip,
          min,
          max,
          step: widget.step ?? 1,
          sliderMode,
          value,
        };
      }

      if (type === "checkbox" || type === "chipgroup") {
        return {
          id,
          type,
          label: widget.label ?? id,
          tooltip: widget.tooltip,
          options,
          value: currentFilters?.[id] ?? widget.value ?? [],
        };
      }

      if (type === "dropdown") {
        const placeholderCandidate =
          widget.params?.choices_concat_abbrev?.trim();
        return {
          id,
          type,
          label: widget.label ?? id,
          tooltip: widget.tooltip,
          dropdownPlaceholder: placeholderCandidate || undefined,
          options,
          value: currentFilters?.[id] ?? widget.value ?? "",
        };
      }

      if (type === "radio") {
        return {
          id,
          type,
          label: widget.label ?? id,
          tooltip: widget.tooltip,
          options,
          value:
            currentFilters?.[id] ?? widget.value ?? options?.[0]?.value ?? "",
        };
      }

      if (type === "switch") {
        return {
          id,
          type,
          label: widget.label ?? id,
          tooltip: widget.tooltip,
          value: Boolean(currentFilters?.[id] ?? widget.value ?? false),
        };
      }

      return {
        id,
        type,
        label: widget.label ?? id,
        tooltip: widget.tooltip,
        value: currentFilters?.[id] ?? widget.value ?? "",
      };
    })
    .filter((widget): widget is Widget => widget !== null);
}

import {
  buildWidgetJsonSchema,
  normalizeWidgetObjectFromLLM,
} from "../services/searchRefiner";

describe("buildWidgetJsonSchema", () => {
  it("keeps disambiguation in schema when no additional instructions are provided", () => {
    const schema = buildWidgetJsonSchema(false);

    expect(schema.properties.disambiguation).toBeDefined();
    expect(schema.required).toContain("disambiguation");
  });

  it("removes disambiguation from schema when additional instructions are provided", () => {
    const schema = buildWidgetJsonSchema(true);

    expect(schema.properties.disambiguation).toBeUndefined();
    expect(schema.required).not.toContain("disambiguation");
  });
});

describe("normalizeWidgetObjectFromLLM", () => {
  it("returns null for hidden widgets", () => {
    const widget = normalizeWidgetObjectFromLLM({
      widget_type: "dropdown",
      widget_variable_name: "topic",
      widget_label: "Topic",
      widget_tooltip: "Filter by topic",
      widget_params: { choices: [] },
      sanity_check: {
        should_we_hide_this_widget_based_on_the_current_search_query: true,
      },
    });

    expect(widget).toBeNull();
  });

  it("normalizes switch widgets", () => {
    const widget = normalizeWidgetObjectFromLLM({
      widget_type: "switch",
      widget_variable_name: "in_stock",
      widget_label: "In Stock",
      widget_tooltip: "Only show available items",
      widget_params: {
        label_for_switch_on: "Show only in-stock items",
        label_for_switch_off: "Show all items",
      },
      sanity_check: {
        should_we_hide_this_widget_based_on_the_current_search_query: false,
        is_widget_redundant: false,
      },
    });

    expect(widget).toMatchObject({
      id: "in_stock",
      type: "switch",
      label: "Show only in-stock items",
      tooltip: "Only show available items",
      value: false,
    });
  });

  it("normalizes dropdown widgets with all options", () => {
    const widget = normalizeWidgetObjectFromLLM({
      widget_type: "dropdown",
      widget_variable_name: "category",
      widget_label: "Category",
      widget_tooltip: "Filter by category",
      widget_params: {
        choices_concat_abbrev: "Trial/Appeal",
        choices: [
          { choice_variable_value: "trial", choice_ui_label: "Trial" },
          { choice_variable_value: "appeal", choice_ui_label: "Appeal" },
        ],
      },
      sanity_check: {
        should_we_hide_this_widget_based_on_the_current_search_query: false,
        is_widget_redundant: false,
      },
    });

    expect(widget).toMatchObject({
      id: "category",
      type: "dropdown",
      label: "Category",
      dropdownPlaceholder: "Trial/Appeal",
      value: "",
    });
    expect(widget?.options).toEqual([
      { value: "trial", label: "Trial" },
      { value: "appeal", label: "Appeal" },
    ]);
  });

  it("normalizes checkboxes into chipgroup and preserves array value", () => {
    const widget = normalizeWidgetObjectFromLLM({
      widget_type: "checkboxes",
      widget_variable_name: "topics",
      widget_label: "Topics",
      widget_tooltip: "Filter topics",
      widget_params: {
        choices: [
          { choice_variable_value: "trial", choice_ui_label: "Trial" },
          { choice_variable_value: "appeal", choice_ui_label: "Appeal" },
        ],
      },
      sanity_check: {
        should_we_hide_this_widget_based_on_the_current_search_query: false,
        is_widget_redundant: false,
      },
    });

    expect(widget?.type).toBe("chipgroup");
    expect(widget?.value).toEqual([]);
    expect(widget?.options).toEqual([
      { value: "trial", label: "Trial" },
      { value: "appeal", label: "Appeal" },
    ]);
  });

  it("normalizes slider widgets from widget_params", () => {
    const widget = normalizeWidgetObjectFromLLM({
      widget_type: "slider",
      widget_variable_name: "year",
      widget_label: "Year",
      widget_tooltip: "Filter by year",
      widget_params: {
        value_min: 1990,
        value_max: 2020,
        user_selects_lowest_value_of_range: true,
        user_selects_highest_value_of_range: true,
      },
      sanity_check: {
        should_we_hide_this_widget_based_on_the_current_search_query: false,
        is_widget_redundant: false,
      },
    });

    expect(widget).toMatchObject({
      type: "slider",
      min: 1990,
      max: 2020,
      sliderMode: "range",
      value: [1990, 2020],
    });
  });
});

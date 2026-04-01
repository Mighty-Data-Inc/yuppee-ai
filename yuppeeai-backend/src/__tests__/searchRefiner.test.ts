import { describe, expect, it } from "@jest/globals";
import { SearchRefiner } from "../services/searchRefiner";

describe("SearchRefiner cleanRefinements", () => {
  function makeBaseRaw() {
    return {
      disambiguation: {
        was_disambiguation_necessary: false,
        assumption_statement: "",
        query_rephrased_with_assumption: "",
        other_alternative_potential_meanings: [],
      },
      describe_current_query: "sample query description",
      widgets: [] as any[],
    };
  }

  it("converts single-choice dropdown into switch", () => {
    const provider = new SearchRefiner();
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "dropdown",
        widget_variable_name: "topic",
        widget_label: "Topic",
        widget_tooltip: "Limit to one topic",
        widget_params: {
          choices: [
            {
              choice_variable_value: "menendez",
              choice_ui_label: "Menendez Brothers",
            },
          ],
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0]).toEqual({
      type: "switch",
      variable_name: "topic",
      label: "Show only results about: Topic",
      tooltip: "Limit to one topic",
    });
    expect(cleaned.widgets[0]).not.toHaveProperty("params");
  });

  it("keeps multi-choice dropdown and normalizes choices", () => {
    const provider = new SearchRefiner();
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "dropdown",
        widget_variable_name: "category",
        widget_label: "Category",
        widget_tooltip: "Filter by category",
        widget_params: {
          choices: [
            { choice_variable_value: "trial", choice_ui_label: "Trial" },
            { choice_variable_value: "appeal", choice_ui_label: "Appeal" },
          ],
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0]).toEqual({
      type: "dropdown",
      variable_name: "category",
      label: "Category",
      tooltip: "Filter by category",
      params: {
        choices: [
          { value: "trial", label: "Trial" },
          { value: "appeal", label: "Appeal" },
        ],
      },
    });
  });

  it("renames checkboxes type to chipgroup", () => {
    const provider = new SearchRefiner();
    const raw = makeBaseRaw();
    raw.widgets = [
      {
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
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0].type).toBe("chipgroup");
  });

  it("uses label_for_switch_on as label for native switch widgets", () => {
    const provider = new SearchRefiner();
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "switch",
        widget_variable_name: "in_stock",
        widget_label: "In Stock",
        widget_tooltip: "Only show available items",
        widget_params: {
          label_for_switch_on: "Show only in-stock items",
          label_for_switch_off: "Show all items regardless of stock status",
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets[0]).toEqual({
      type: "switch",
      variable_name: "in_stock",
      label: "Show only in-stock items",
      tooltip: "Only show available items",
    });
    expect(cleaned.widgets[0]).not.toHaveProperty("params");
  });

  it("removes widgets flagged as hidden by sanity_check", () => {
    const provider = new SearchRefiner();
    const raw = makeBaseRaw();
    raw.widgets = [
      {
        widget_type: "dropdown",
        widget_variable_name: "visible_widget",
        widget_label: "Visible Widget",
        widget_tooltip: "Visible",
        widget_params: {
          choices: [
            { choice_variable_value: "one", choice_ui_label: "One" },
            { choice_variable_value: "two", choice_ui_label: "Two" },
          ],
        },
        sanity_check: {
          effect_of_user_selecting_value_for_this_widget: "Narrows results",
          does_selecting_this_value_make_sense_for_this_search_query: "Yes",
          should_we_hide_this_widget_based_on_the_current_search_query: false,
        },
      },
      {
        widget_type: "dropdown",
        widget_variable_name: "hidden_widget",
        widget_label: "Hidden Widget",
        widget_tooltip: "Hidden",
        widget_params: {
          choices: [{ choice_variable_value: "one", choice_ui_label: "One" }],
        },
        sanity_check: {
          effect_of_user_selecting_value_for_this_widget: "Not relevant",
          does_selecting_this_value_make_sense_for_this_search_query: "No",
          should_we_hide_this_widget_based_on_the_current_search_query: true,
        },
      },
    ];

    const cleaned = (provider as any).cleanRefinements(raw);
    expect(cleaned.widgets).toHaveLength(1);
    expect(cleaned.widgets[0].variable_name).toBe("visible_widget");
  });
});

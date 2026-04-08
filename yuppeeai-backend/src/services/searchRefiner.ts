import OpenAI from "openai";
import { LLMConversation } from "@mightydatainc/llm-conversation";
import type {
  RefinementRequest,
  RefinementResponse,
  RefinementWidget,
  RefinementWidgetOption,
  Disambiguation,
} from "../types";

interface SearchRefinerConfig {
  openaiApiKey?: string;
}

const GPT_MODEL_FAST = "gpt-4.1-nano";

const WIDGET_JSON_SCHEMA = {
  required: ["disambiguation", "explain_query_and_instructions", "widgets"],
  additionalProperties: false,
  type: "object",
  properties: {
    disambiguation: {
      type: "object",
      description:
        "A statement of whether or not you had to apply disambiguation to the search query, and if so, then what assumption you made about the intended meaning of the query.",
      properties: {
        was_disambiguation_necessary: {
          type: "boolean",
          description:
            "Indicates whether disambiguation was applied to the search query.",
        },
        assumption_statement: {
          type: "string",
          description:
            "If disambiguation was applied, this is the assumption made about the intended meaning of the query. Phrase this as a very short present-tense statement directed to the user, e.g. 'I assume you mean the computer company.' Don't bother mentioning alternatives; they'll be covered in the 'other_alternative_potential_meanings' field.",
        },
        query_rephrased_with_assumption: {
          type: "string",
          description:
            `If disambiguation was applied, this is the rephrased query based on the assumption made about the intended meaning of the query.` +
            `If the user had applied this phrasing instead of the one they actually submitted, then you wouldn't have had to apply disambiguation.`,
        },
        other_alternative_potential_meanings: {
          type: "array",
          description:
            "If disambiguation was applied, this is a complete and comprehensive list of other potential meanings of the query that were considered. Each item in this list is distinct and unique from the others, and each one is a plausible interpretation of the user's original query that a reasonable person might have intended. This list should be exhaustive, covering all reasonable interpretations of the query that would require disambiguation.",
          items: {
            type: "object",
            properties: {
              meaning: {
                type: "string",
                description:
                  "A potential alternative meaning of the query that was considered during disambiguation.",
              },
              is_same_as_presumed_meaning: {
                type: "boolean",
                description:
                  "Indicates whether this alternative meaning is essentially the same as the presumed meaning stated in the 'assumption_statement' field. This might be true if the alternative meaning is just a slight variation on the presumed meaning, or if it's a closely related concept that would lead to similar search results.",
              },
              do_you_mean: {
                type: "string",
                description:
                  "A concise 'Do you mean...' suggestion that will appear in the UI. This string **must** start with the phrase 'Do you mean' and be phrased as a question, ending in a question mark. For example: 'Do you mean the fruit?' or 'Do you mean the computer company?' or 'Do you mean the record label?'",
              },
              query_rephrase: {
                type: "string",
                description:
                  "A rephrased version of the original query string that the user should have used if they intended this alternative meaning.",
              },
            },
            required: [
              "meaning",
              "is_same_as_presumed_meaning",
              "do_you_mean",
              "query_rephrase",
            ],
            additionalProperties: false,
          },
        },
      },
      required: [
        "was_disambiguation_necessary",
        "assumption_statement",
        "query_rephrased_with_assumption",
        "other_alternative_potential_meanings",
      ],
      additionalProperties: false,
    },
    explain_query_and_instructions: {
      type: "string",
      description:
        "A detailed explanation of the search query and any additional instructions, " +
        "to demonstrate that you understand what's being requested.",
    },
    widgets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          widget_type: {
            type: "string",
            enum: ["dropdown", "switch", "checkboxes", "slider"],
          },
          widget_variable_name: {
            type: "string",
            description: `A snake_case variable name for the widget, used to identify it in the code.`,
          },
          widget_label: {
            type: "string",
            description:
              `The label for the widget, displayed to the user. ` +
              `NOTE: The widget label must NOT include an imperative verb, such as "Choose" or "Select" or "Pick" or "Specify". ` +
              `We already know damn well that we're here to pick, choose, select, or specify something, because we're using ` +
              `this UI in the first place. The label must simply state the thing being chosen, selected, picked, or specified.`,
          },
          widget_tooltip: {
            type: "string",
            description:
              "A concise tooltip for the widget that explains what filtering objective it helps accomplish.",
          },
          widget_params: {
            anyOf: [
              {
                type: "object",
                description: "Parameters for slider widget.",
                properties: {
                  value_min: { type: "number" },
                  value_max: { type: "number" },
                  user_selects_lowest_value_of_range: { type: "boolean" },
                  user_selects_highest_value_of_range: { type: "boolean" },
                  discuss_is_filter_or_quiz: {
                    type: "string",
                    description:
                      `Discuss whether this slider is meant to be a filter or a quiz. ` +
                      `That is, is the user selecting a value or range that they want to filter results by? ` +
                      `Or are they selecting a value or range that they think is the correct answer to a ` +
                      `question implied by the search query? For example, imagine the search query is ` +
                      `"Restaurants in Hell's Kitchen". Then a slider called "Number of Restaurants" would ` +
                      `be a **quiz**, because it's asking the user to guess the correct number of restaurants. ` +
                      `But a slider called "Maximum Price Level" would be a **filter**, because it's asking the ` +
                      `user to specify a criterion that they want their search results to meet.`,
                  },
                  is_filter_or_quiz: {
                    type: "string",
                    enum: ["filter", "quiz"],
                  },
                },
                required: [
                  "value_min",
                  "value_max",
                  "user_selects_lowest_value_of_range",
                  "user_selects_highest_value_of_range",
                  "discuss_is_filter_or_quiz",
                  "is_filter_or_quiz",
                ],
                additionalProperties: false,
              },
              {
                type: "object",
                description:
                  "Parameters for choice selector widgets, like dropdowns or checkboxes.",
                properties: {
                  choices: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: [
                        "choice_variable_value",
                        "choice_ui_label",
                        "what_it_means_if_this_choice_is_selected",
                        "discuss_if_instructions_describe_this_choice",
                        "do_instructions_describe_this_choice",
                      ],
                      properties: {
                        choice_variable_value: {
                          type: "string",
                          description:
                            "The snake_case value that will be used in the search query when this choice is selected.",
                        },
                        choice_ui_label: {
                          type: "string",
                          description:
                            "The label that will be displayed to the user for this choice.",
                        },
                        what_it_means_if_this_choice_is_selected: {
                          type: "string",
                          description:
                            "A detailed explanation, in plain English, of what it means if this widget's value is set to this choice. " +
                            "Explicitly state the widget label and the choice label in your explanation.",
                        },
                        discuss_if_instructions_describe_this_choice: {
                          type: "string",
                          description:
                            `Discuss whether the search query and/or additional instructions already describe this specific choice. ` +
                            `Look at what it means if this choice is selected, and then see if the search query or instructions ` +
                            `already contain that meaning.`,
                        },
                        do_instructions_describe_this_choice: {
                          type: "boolean",
                          description:
                            "Indicates whether this choice is described by the search query or additional instructions.",
                        },
                      },
                    },
                  },
                  choices_concat_abbrev: {
                    type: "string",
                    description:
                      `A very short (under 30 chars) concatenated abbreviation of the choices for display purposes. ` +
                      `For example: If the choices are "Paris", "London", "New York City", this might be "Paris/London/NYC". ` +
                      `If the choices are "Steve Jobs", "Bill Gates", "Elon Musk", this might be "Steve Jobs, Bill Gates, etc.". ` +
                      `If the choices are "In Search of Lost Time", "Don Quixote", "Ulysses", this might be "e.g. Don Quixote...". ` +
                      `Use your judgment, but keep it under 30 characters.`,
                  },
                },
                required: ["choices", "choices_concat_abbrev"],
                additionalProperties: false,
              },
              {
                type: "object",
                description:
                  "Parameters for the switch widget. When turned on, this widget will apply a specific filter, constraining the search results accordingly. When turned off, the widget will remove the filter or constraint, permitting a less restricted view of results.",
                properties: {
                  label_for_switch_on: {
                    type: "string",
                    description: `The prompt to show users to explain what happens when the switch is turned on, e.g. "Show only in-stock items" or "Only show shops in your area"`,
                  },
                  label_for_switch_off: {
                    type: "string",
                    description: `The prompt to show users to explain what happens when the switch is turned off, e.g. "Show all items regardless of in-stock status" or "Show all shops regardless of distance from you"`,
                  },
                  discuss_value_given_by_instructions: {
                    type: "string",
                    description: `State which value for this switch widget (on or off) is described by the search query and/or additional instructions. For example, if the query is for Apple Computers, and this switch widget is "Show results about Apple Computers", then we would say that the value of this widget that is given by the instructions would be "on".`,
                  },
                  value_given_by_instructions: {
                    type: "string",
                    enum: ["on", "off", "none"],
                  },
                },
                required: [
                  "label_for_switch_on",
                  "label_for_switch_off",
                  "discuss_value_given_by_instructions",
                  "value_given_by_instructions",
                ],
                additionalProperties: false,
              },
            ],
          },
          sanity_check: {
            type: "object",
            description: "Sanity check for the widget configuration.",
            properties: {
              effect_of_user_selecting_value_for_this_widget: {
                type: "string",
                description:
                  "An explanation of how the selection of a value for this widget will affect the search results.",
              },
              does_selecting_this_value_make_sense_for_this_search_query: {
                type: "string",
                description:
                  `Having described the effect of selecting this value, discuss whether it makes sense ` +
                  `in the context of the current search query. Maybe it's better suited to another query or context?`,
              },
              should_we_hide_this_widget_based_on_the_current_search_query: {
                type: "boolean",
                description:
                  `Indicates whether this widget should be hidden based on the current search query. ` +
                  `Set this to true if the widget is not relevant for the current query, or if it doesn't ` +
                  `make sense in the current context.`,
              },
              discuss_how_widget_is_redundant_with_other_widgets: {
                type: "string",
                description:
                  `Explain how this widget might be redundant with other widgets in the current search context. ` +
                  `If there are other widgets that provide similar functionality or overlap in purpose, ` +
                  `describe the redundancy. For example, if this is a switch widget that filters results by ` +
                  `some kind of status, and there is already a drop-down that selects this same status, ` +
                  `then this widget would be redundant.`,
              },
              is_widget_redundant: {
                type: "boolean",
                description:
                  `Indicates whether this widget is redundant with other widgets in the current search context. ` +
                  `Set this to true if the widget is redundant.`,
              },
            },
            required: [
              "effect_of_user_selecting_value_for_this_widget",
              "does_selecting_this_value_make_sense_for_this_search_query",
              "should_we_hide_this_widget_based_on_the_current_search_query",
              "discuss_how_widget_is_redundant_with_other_widgets",
              "is_widget_redundant",
            ],
            additionalProperties: false,
          },
        },
        required: [
          "widget_type",
          "widget_variable_name",
          "widget_label",
          "widget_tooltip",
          "widget_params",
          "sanity_check",
        ],
        additionalProperties: false,
      },
    },
  },
};

export const buildWidgetJsonSchema = (hasAdditionalInstructions: boolean) => {
  // Always work on a deep-cloned schema so request-specific changes never mutate
  // the shared base schema used by subsequent requests.
  const schemaCopy = JSON.parse(JSON.stringify(WIDGET_JSON_SCHEMA));

  // When explicit additional instructions are present, we skip disambiguation
  // for this structured response and request only widgets.
  if (hasAdditionalInstructions) {
    delete schemaCopy.properties.disambiguation;
    if (Array.isArray(schemaCopy.required)) {
      schemaCopy.required = schemaCopy.required.filter(
        (requiredKey: string) => requiredKey !== "disambiguation",
      );
    }
  }

  return schemaCopy;
};

export const normalizeWidgetObjectFromLLM = (
  llmWidgetObj: any,
): RefinementWidget | null => {
  // First we determine whether or not this widget is even worth keeping.
  const sanityCheckObj = llmWidgetObj?.sanity_check;
  if (
    sanityCheckObj?.should_we_hide_this_widget_based_on_the_current_search_query ||
    sanityCheckObj?.is_widget_redundant
  ) {
    return null;
  }

  // Look at widget_params. If it has choices, and if *exactly one* of those choices
  // are implicitly selected by the instructions, then we should return null.
  if (
    llmWidgetObj.widget_params?.choices &&
    Array.isArray(llmWidgetObj.widget_params.choices)
  ) {
    let implicitChoiceCount = 0;
    for (const choice of llmWidgetObj.widget_params.choices) {
      if (choice.do_instructions_describe_this_choice) {
        implicitChoiceCount++;
      }
    }
    if (implicitChoiceCount === 1) {
      return null;
    }
  }

  const widget: RefinementWidget = {
    id: llmWidgetObj.widget_variable_name,
    type: llmWidgetObj.widget_type,
    label: llmWidgetObj.widget_label,
    tooltip: llmWidgetObj.widget_tooltip,
    value: "", // default value; will be overridden below based on widget type
  };

  if (llmWidgetObj.widget_type === "switch") {
    if (llmWidgetObj.widget_params.value_given_by_instructions !== "none") {
      return null;
    }
    widget.label =
      llmWidgetObj.widget_params.label_for_switch_on || widget.label;
    widget.value = false;
  } else if (llmWidgetObj.widget_type === "checkboxes") {
    widget.type = "chipgroup";
    widget.value = [];
  } else if (llmWidgetObj.widget_type === "dropdown") {
    widget.type = "dropdown";
    widget.value = "";
    widget.dropdownPlaceholder =
      llmWidgetObj.widget_params.choices_concat_abbrev;
  } else if (llmWidgetObj.widget_type === "slider") {
    if (llmWidgetObj.widget_params.is_filter_or_quiz === "quiz") {
      return null;
    }

    widget.min = llmWidgetObj.widget_params.value_min || 0;
    widget.max = llmWidgetObj.widget_params.value_max || 0;
    widget.value = widget.min || 0;

    widget.sliderMode = "exact";
    if (llmWidgetObj.widget_params.user_selects_lowest_value_of_range) {
      if (llmWidgetObj.widget_params.user_selects_highest_value_of_range) {
        widget.sliderMode = "range";
        widget.value = [widget.min || 0, widget.max || 0];
      } else {
        widget.sliderMode = "gte";
      }
    } else if (llmWidgetObj.widget_params.user_selects_highest_value_of_range) {
      widget.sliderMode = "lte";
    }
  }

  if (widget.type === "dropdown" || widget.type === "chipgroup") {
    // Validate that choices exists and is an array before iterating
    if (!Array.isArray(llmWidgetObj.widget_params?.choices)) {
      return null;
    }

    widget.options = [];
    for (const llmChoice of llmWidgetObj.widget_params.choices) {
      const choice: RefinementWidgetOption = {
        label: llmChoice.choice_ui_label,
        value: llmChoice.choice_variable_value,
      };
      widget.options!.push(choice);
    }

    if (widget.type === "dropdown") {
      widget.value = "";
    }

    if (!widget.options || widget.options.length < 2) {
      return null;
    }
  }

  return widget;
};

export class SearchRefiner {
  private readonly config: Required<SearchRefinerConfig>;

  constructor(config: SearchRefinerConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey ?? "",
    };
  }

  async inferSearchRefinements(
    request: RefinementRequest,
  ): Promise<RefinementResponse> {
    if (!this.config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const openaiClient = new OpenAI({ apiKey: this.config.openaiApiKey });

    const convo = new LLMConversation(openaiClient, undefined, GPT_MODEL_FAST);
    convo.addDeveloperMessage(`
You're an AI that powers the back end of a new smart search engine.

The user will submit a search query.

Your job will be to perform the following steps in response to this query:

I. Disambiguate
Determine whether or not this query uniquely specifies a topic, or if the wording might refer to radically different things. For example, if they query for "apple", do they mean the fruit, the computer company, or the record label? If the query is indeed ambiguous, then make an assumption about **one** particular meaning, to facilitate the rest of the query process.

II. Mock Results
Write a list of 10 sample results that might look like the kind of thing the SERP might produce in response to this query. Include only the titles; don't include URLs, snippets, or any other fancy fields. Just the titles will do.

III. Categorization
Can these potential SERP results be sorted into categories and subcategories? For example, if the query were "Apple computer company", one category of results could be "Significant people", with subcategories being "Steve Jobs", "Steve Wozniak", and "Tim Cook", allowing the user to find articles specifically about, say, Steve Jobs, for example. Can you give a similar treatment to the user's search query? Or no? If so, write a two-level bulletted list, listing categories and subcategories -- it should consist of at least one category, and each category should contain a minimum of two subcategories.

IV. Ensuring Completeness and Filling In Omissions
Some of the categories you came up with in Section III may be missing important subcategories or may not fully cover the range of potential results. For example, imagine that the query was "Beatles" and one of the categories you identified in Section III was "Band Members", and your subcategories only included "John Lennon", "Paul McCartney", but left out "George Harrison" and "Ringo Starr"; in this case, you would need to add "George Harrison" and "Ringo Starr" to ensure completeness. In this section (Section IV), review the categories and subcategories you identified in Section III and ensure that they are comprehensive. Add any missing subcategories that are relevant to the user's query and the potential SERP results. Make sure that each category has at least two subcategories, and that the subcategories collectively cover the full scope of the category. When you're done, write a revised outline, using the same structure as the outline you wrote for Section III, but with the missing subcategories added.

V. Redundant Category and Subcategory Cleanup
Now that we've ensured completeness in Section IV, we can move on to identifying redundancies. Some of the categories may overlap with one another, and/or some categories may have overlapping or redundant subcategories. Here are a few illustrations of what I mean:
- Imagine the query is for "Apple computer company", and your category outline includes one category called "Significant People" and also a category called "Founders". These two categories overlap, because the founders are a subset of the significant people. In this case, you should merge these categories or remove one to avoid redundancy.
- In a similar vein, imagine that a category called "Company History" includes two subcategories: "Founding" and "Creation". These two subcategories are essentially referring to the same event, so it would make sense to merge them into a single subcategory to avoid redundancy.
In this section (Section V), discuss whether or not there are any redundancies and overlaps in the categories and subcategories you've devised so far. Identify any categories that could be merged or removed to avoid redundancy, and any subcategories that could be combined for the same reason. Then, when you're done, write a revised outline, using the same structure as the outline you wrote for the previous section, but with the redundancies removed and the categories and subcategories cleaned up.

VI. Discussion of Possible UI Widgets for Selecting Categories
The revised categories you described in the previous section can be represented as UI widgets to allow the user to filter their search results. We have the following library of widgets to choose from:
- **Dropdown**. The category name becomes the dropdown's label, and the subcategories become values that can be selected in the dropdown. The user can select 1 specific subcategory to drill down into.
- **Chip Group**: The category name becomes the label for a groupbox containing a set of chips, and the subcategories become the chips. The user can select any number of chips at a time.
- **Switch**: The user can globally filter the search results for one particular aspect.
(Note that we don't HAVE TO use every possible widget. I'm not MAKING you use a switch if no category is appropriate for representation as a switch, for example. I'm simply giving you a menu of known widget types to apply at your discretion.)
Take the categories you came up with in the previous section, and map each one to either a dropdown, a chip group, or a switch, depending on what you feel is most appropriate. Present your results as the same bullet list of categories as you showed in the previous section, but instead of listing subcategories you should instead state which widget to use for that category and what that widget's values should be.

VII. Numerical Range Selection
Do this query's search results lend themselves to any kind of filtration by a numerical value or range of values? For example, would it make sense for the user to ask for results that are "greater than" some number, or "later than" some year, etc.? Or no? (Note that I am *not* asking for questions with numerical answers. "Date of Apple Computer founding" would not be a selectable criterion.) Write this section in the following format:
- Re-state, in plain English, what exactly the user is searching for.
- Explain the purpose of this section
- Describe at least one numerical range that might be applicable, if any.
- Determine whether or not the thing you picked is a *dependent* variable, entirely determined by the "ground truth" of the search topic itself, and is not something that a user can filter results on. For example, if the search topic is "Battle of Hastings", then a numerical query such as "Number of casualties" does not make sense as a slider because it's a fixed numerical answer; it doesn't make sense for the user to select some number for it.
- A discussion of whether or not a user would realistically be likely to use this as a selection criterion, given the ability to select by categories above. I'm not asking if you could hypothetically contrive some esoteric scenario in which you can argue that it's useful; I'm asking you to assess whether or not it *would* be useful.
- A final determination of whether or not to include a range slider. If yes, describe the slider UI widget -- its minimum and maximum values, and whether the user would be selecting a single value or a range with an upper and lower bound. If not, say that it wouldn't be worth it.
`);
    convo.addDeveloperMessage(`The user will now show you their search query.`);
    convo.addUserMessage(request.query);

    const requestInstructions: string[] = request.instructions ?? [];
    const hasAdditionalInstructions = requestInstructions.length > 0;
    if (hasAdditionalInstructions) {
      convo.push({
        role: "user",
        content:
          `Also, I've specifically provided the following additional special instructions. ` +
          `I want you to make sure that any reasoning you do and any widgets you generate ` +
          `take these instructions into consideration. !IMPORTANT: Do *not* define criteria ` +
          `or numerical ranges that have already been covered by these additional instructions. ` +
          `For example, if an instruction says, "Only show me results from the last 5 years", then you should NOT create a slider for "Publication Date" with a range that includes the last 5 years, because that would be redundant and unnecessary. ` +
          `Or, if an instruction says, "Only show me results about the Beatles' music", then you should NOT create a category for "Topic" with a subcategory for "Beatles music", because that would also be redundant and unnecessary. ` +
          `\n\n---\n\n` +
          `${requestInstructions.join("\n")}`,
      });
    }

    await convo.submit();

    const retval = {
      query: request.query,
      widgets: [],
    } as RefinementResponse;

    try {
      // Build a request-local schema copy and optionally strip disambiguation
      // when the user already supplied additional instructions.
      const widgetJsonSchema = buildWidgetJsonSchema(hasAdditionalInstructions);

      // The above "submit" was simply to trigger chain-of-thought reasoning in the conversation.
      // The below "submit" is used to get the structured JSON response for the search refinements.
      // Both are necessary for good results.
      const refinements: any = await convo.submit(undefined, undefined, {
        jsonResponse: {
          format: {
            type: "json_schema",
            strict: true,
            name: "json_schema_for_structured_response",
            schema: widgetJsonSchema,
          },
        },
      });

      retval.widgets = ((refinements.widgets || []) as any[])
        .map(normalizeWidgetObjectFromLLM)
        .filter((w) => w) as RefinementWidget[];

      // Check for disambiguation info
      if (
        refinements.disambiguation &&
        refinements.disambiguation.was_disambiguation_necessary &&
        refinements.disambiguation.other_alternative_potential_meanings &&
        refinements.disambiguation.other_alternative_potential_meanings.length >
          0
      ) {
        retval.disambiguation = {
          presumed: {
            doYouMean: refinements.disambiguation.assumption_statement || "",
            query:
              refinements.disambiguation.query_rephrased_with_assumption || "",
          },
          alternatives:
            refinements.disambiguation.other_alternative_potential_meanings
              .filter((alt: any) => !alt.is_same_as_presumed_meaning)
              .map((alt: any) => ({
                doYouMean: rephraseDisambiguationOptionString(alt.do_you_mean),
                query: alt.query_rephrase,
              })),
        } as Disambiguation;
      }
      if (retval.disambiguation?.alternatives.length === 0) {
        delete retval.disambiguation;
      }
    } catch (error) {
      console.error(
        "Error during structured output request for refinements:",
        error,
      );
      throw error;
    }

    return retval;
  }
}

const rephraseDisambiguationOptionString = (s: string): string => {
  s = s.trim();

  // Strip off the "Do you mean..." prefix and the "?" suffix
  if (s.toLowerCase().startsWith("do you mean")) {
    s = s.slice("do you mean".length).trim();
  }
  if (s.endsWith("?")) {
    s = s.slice(0, -1).trim();
  }

  // Make the first letter uppercase.
  if (s.length > 0) {
    s = s[0].toUpperCase() + s.slice(1);
  }
  return s;
};

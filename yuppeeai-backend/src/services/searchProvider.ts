import OpenAI from "openai";
import type { SearchRequest, SearchResponse, SearchResult } from "../types";
import { ResponseInput } from "openai/resources/responses/responses";
import {
  JSONSchemaFormat,
  LLMConversation,
} from "@mightydatainc/llm-conversation";

interface SearchProviderConfig {
  useMock?: boolean;
  openaiApiKey?: string;
}

const MOCK_BOOK_RESULTS: SearchResult[] = [
  {
    id: "b1",
    title: "The Great Gatsby",
    url: "https://example.com/gatsby",
    snippet: "A novel by F. Scott Fitzgerald set in the Jazz Age.",
  },
  {
    id: "b2",
    title: "To Kill a Mockingbird",
    url: "https://example.com/mockingbird",
    snippet: "Harper Lee's Pulitzer Prize-winning masterpiece.",
  },
  {
    id: "b3",
    title: "1984",
    url: "https://example.com/1984",
    snippet: "George Orwell's dystopian social science fiction novel.",
  },
  {
    id: "b4",
    title: "Pride and Prejudice",
    url: "https://example.com/pride",
    snippet: "Jane Austen's romantic novel of manners.",
  },
  {
    id: "b5",
    title: "The Hobbit",
    url: "https://example.com/hobbit",
    snippet:
      "J.R.R. Tolkien's fantasy novel and prelude to The Lord of the Rings.",
  },
  {
    id: "b6",
    title: "Brave New World",
    url: "https://example.com/brave",
    snippet: "Aldous Huxley's dystopian novel set in a futuristic world state.",
  },
];

const MOCK_MOVIE_RESULTS: SearchResult[] = [
  {
    id: "m1",
    title: "The Shawshank Redemption",
    url: "https://example.com/shawshank",
    snippet:
      "Two imprisoned men bond over years, finding solace and redemption.",
  },
  {
    id: "m2",
    title: "The Godfather",
    url: "https://example.com/godfather",
    snippet:
      "The aging patriarch of an organized crime dynasty transfers control to his son.",
  },
  {
    id: "m3",
    title: "The Dark Knight",
    url: "https://example.com/dark-knight",
    snippet:
      "Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy.",
  },
  {
    id: "m4",
    title: "Pulp Fiction",
    url: "https://example.com/pulp-fiction",
    snippet:
      "The lives of two mob hitmen, a boxer, and others intertwine in interconnected stories.",
  },
  {
    id: "m5",
    title: "Schindler's List",
    url: "https://example.com/schindler",
    snippet:
      "In German-occupied Poland, Oskar Schindler saves over a thousand Jewish lives.",
  },
  {
    id: "m6",
    title: "Inception",
    url: "https://example.com/inception",
    snippet:
      "A thief who steals corporate secrets through dream-sharing technology.",
  },
];

const MOCK_GENERAL_RESULTS: SearchResult[] = [
  {
    id: "g1",
    title: "Introduction to Artificial Intelligence",
    url: "https://example.com/ai-intro",
    snippet:
      "A comprehensive overview of AI concepts, history, and applications.",
  },
  {
    id: "g2",
    title: "The Future of Technology",
    url: "https://example.com/tech-future",
    snippet:
      "Exploring emerging technologies shaping the world in the next decade.",
  },
  {
    id: "g3",
    title: "Understanding Machine Learning",
    url: "https://example.com/ml",
    snippet:
      "An accessible guide to machine learning algorithms and use cases.",
  },
  {
    id: "g4",
    title: "Climate Change: An Overview",
    url: "https://example.com/climate",
    snippet: "The science behind climate change and its global implications.",
  },
  {
    id: "g5",
    title: "Healthy Living Tips",
    url: "https://example.com/health",
    snippet:
      "Evidence-based strategies for improving your physical and mental health.",
  },
  {
    id: "g6",
    title: "World History: A Timeline",
    url: "https://example.com/history",
    snippet:
      "Key events and developments in human civilization from ancient times to present.",
  },
];

const GPT_MODEL_FAST = "gpt-4.1-nano";
const GPT_MODEL_SMART = "gpt-4.1";

const WIDGET_JSON_SCHEMA = {
  required: ["disambiguation", "widgets"],
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
            "If disambiguation was applied, this is the assumption made about the intended meaning of the query.",
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
            "If disambiguation was applied, this is a list of other potential meanings of the query that were considered.",
          items: {
            type: "object",
            properties: {
              meaning: {
                type: "string",
                description:
                  "A potential alternative meaning of the query that was considered during disambiguation.",
              },
              query_rephrase: {
                type: "string",
                description:
                  "A rephrased version of the original query that the user should have used if they intended this alternative meaning.",
              },
            },
            required: ["meaning", "query_rephrase"],
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
    widgets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          widget_type: {
            type: "string",
            enum: ["dropdown", "switch", "checkboxes", "radio", "slider"],
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
          widget_descriptive_title: {
            type: "object",
            description: `Similar to "widget_label", but more verbose and detailed. We'll offer a few different variants on phrasing.`,
            properties: {
              teleological: {
                type: "string",
                description: `An explanation of what objectives the user might achieve by specifying these filter criteria.`,
              },
              provides_examples: {
                type: "string",
                description: `Provides examples of some of the filter values that the user might want to specify.`,
              },
              direct: {
                type: "string",
                description: `A version of the descriptive title that is neither teleological nor provides examples.`,
              },
            },
            required: ["teleological", "provides_examples", "direct"],
            additionalProperties: false,
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
                },
                required: [
                  "value_min",
                  "value_max",
                  "user_selects_lowest_value_of_range",
                  "user_selects_highest_value_of_range",
                ],
                additionalProperties: false,
              },
              {
                type: "object",
                description:
                  "Parameters for choice selector widgets, like dropdown, checkboxes, or radio buttons.",
                properties: {
                  choices: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["choice_variable_value", "choice_ui_label"],
                      properties: {
                        choice_variable_value: {
                          type: "string",
                          description:
                            "The snake_casevalue that will be used in the search query when this choice is selected.",
                        },
                        choice_ui_label: {
                          type: "string",
                          description:
                            "The label that will be displayed to the user for this choice.",
                        },
                      },
                    },
                  },
                },
                required: ["choices"],
                additionalProperties: false,
              },
            ],
          },
        },
        required: [
          "widget_type",
          "widget_variable_name",
          "widget_label",
          "widget_descriptive_title",
          "widget_params",
        ],
        additionalProperties: false,
      },
    },
  },
};

export class SearchProvider {
  private readonly config: Required<SearchProviderConfig>;

  constructor(config: SearchProviderConfig = {}) {
    this.config = {
      useMock: config.useMock ?? true,
      openaiApiKey: config.openaiApiKey ?? "",
    };
  }

  async getSearchResults(request: SearchRequest): Promise<SearchResponse> {
    if (this.config.useMock) {
      return this.mockSearch(request);
    }

    return this.realSearch(request);
  }

  async inferSearchRefinements(request: SearchRequest): Promise<{
    report: string;
    refinements: unknown;
  }> {
    if (!this.config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const openaiClient = new OpenAI({ apiKey: this.config.openaiApiKey });

    const convo = new LLMConversation(openaiClient, undefined, GPT_MODEL_FAST);
    convo.addDeveloperMessage(`
You're an AI agent running on the back end of a new AI-powered web search service.
The user has just submitted a search query. Your job is *not* to generate a response yet;
your job is to think about criteria that the user might want to add for refining their
search query. A different portion of the search process will handle generating the actual
search results. *Your* job is to think about the following question: when the user sees
the results, how might they want to refine, filter, or sort them? What additional selection
criteria or attributes might they want to use to narrow down the results?

---

PRELIMINARY DISAMBIGUATION

As a preliminary step, before you begin your proper work as a criteria refinement specialist,
first determine whether or not the search query requires **disambiguation**. For example,
if search query is for "apple", it doesn't even make sense to provide refinement criteria
at all unless you first determine if they mean the fruit, the software company, or the music
label.

Most search queries do not require disambiguation, so hopefully this is a moot point.

If this one *does* require disambiguation, make an assumption about the intended meaning
of the query before proceeding with the refinement criteria. Be sure to state your assumption
clearly before your brainstorming begins.

---

BRAINSTORMING AND DISCUSSION

First, discuss and brainstorm possible refinement criteria for the search results.

When you're done brainstorming, finalize your answer with three or four refinement criteria
that the user would be most likely to use.

Finally, you'll think about what UI widgets would be most appropriate for each of the
selected refinement criteria. Your choices are: 
- dropdown (lets user pick one choice from several options)
- on/off switch (lets user toggle a single global option on or off)
- checkboxes (lets user pick several options from a set)
- radio button (lets user pick one option from several)
- slider (lets user select a value or range of values)

(You may assume that there will also be a free-form text entry field that the user can
use to further refine their search in ways that aren't covered by these widgets.)

---

REPORT

Provide your response as a report, in the following format. Each section is **NOT A BULLET LIST**.
Each section is an **ESSAY**.

0. Disambiguation
Here, you will explain whether or not you decided that disambiguation was
necessary for the search query. If it is, make an assumption about the intended meaning,
and state your assumption clearly before your brainstorming begins.

I. Brainstorming and Discussion
Here, you will discuss and brainstorm possible refinement criteria for the search results.

II. Initial Comprehensive List of Refinement Criteria
Here, you will provide a comprehensive list of all possible refinement criteria that 
could be applied to the search results. This list should be as exhaustive as possible,
including any criteria that might be relevant to the topic of the search query.

III. Eliminate Refinement Criteria Which Only Have One Valid Value
Starting with the comprehensive list you just wrote in the previous section, 
you will eliminate choices that are not yours to make. That is, you will remove any
refinement criteria whose value is already implicitly set by the nature of the search topic.
For example, it doesn't make sense to provide a criterion for "date" when the topic is
"Assassination of JFK" -- yes, the user might be interested in the date of the event,
but it is already implicitly set by the topic itself, so providing a date filter doesn't make sense.
Likewise, it doesn't make sense to provide a dropdown for "Winner" when the topic is
"Muhammad Ali vs George Foreman" -- yes, the user might be interested in the winner of the match,
but *they don't get to CHOOSE*. There aren't, like, web pages that describe one winner and 
web pages that describe the other, and they only want to look for one -- all web pages that
talk about this subject will report the same winner. Understood?

IV. Further Elimination to Most Relevant Criteria
Starting with the whittled-down list you produced in the previous section,
you will further whittle it down to a small number of refinement criteria that are 
most likely to be of interest to the user.
You will discuss whether any given selection criterion is likely to be of interest to the user,
based on the context of their search query and typical user behavior. Of paramount
importance is whether or not a particular refinement criterion is specific to the
topic being search for. 
IMPORTANT:
- Do NOT include generic catch-all criteria that could apply to any search query, 
  such as "sort by relevance" or "filter by date" -- these are already built-in 
  behaviors on the part of any search engine, and listing them here adds no value.
- Do NOT include criteria that have already been eliminated in previous steps.

IV. Final Selection of Refinement Criteria Most Likely to Be Used by the User
Based on the evaluation in the previous section, you will make a concrete, 
specific decision about which UI widgets to use for each refinement criterion. 
Do NOT say, "Dropdown or radio button", or "Either one will work". You must choose a specific widget for
each refinement criterion.

V. Discussion of Possible UI Widgets for Selected Refinement Criteria
Brainstorm appropriate UI components to provide the user with the ability to refine their search results
based on the selected criteria.

VI. Final Selection of UI Widgets
Your decisions should be non-overlapping
and non-redundant. For example, if the user is searching for a house, DO NOT have one widget
be a dropdown representing a couple of possible price ranges, and another be a slider representing
a range of prices. This would be redundant and pointless. Make sure that each widget represents
a distinct non-overlapping refinement criterion.

VII. Values for UI Widgets
Here, you state exactly what the labels, titles, and values of the UI widgets will be.
If a widget involves presenting multiple options (like a dropdown, radio button, or checkboxes),
provide the possible choices. 
For a slider, provide the minimum and maximum values.
DO NOT leave these fields TBD. 
Do NOT be like "(there will be options here)". Actually provide the options.

NOTE: Sliders can work in a few different ways. They involve moving a
knob along a track, but the meaning of that knob can vary. Specify whether it means:
- The value that the knob is set to is interpreted as a singular selection.
- The knob's value represents the highest thing that the user wants, e.g. "Up to N".
    EXAMPLE: Selecting prices, e.g. "No more than $50"
- The knob's value represents the lowest thing that the user wants, e.g. "At least N".
    EXAMPLE: Selecting ratings, e.g. "No fewer than 4 stars"
- There are two knobs, and the values of the knobs represent a range. The user can select a
    minimum and maximum value for the criterion.
    EXAMPLE: Selecting age range, e.g. "From 18 to 35 years old"
If you decide to use a slider, provide its minimum and maximum values, and
    specify whether the knob represents a singular selection, the highest value, the lowest 
    value, or a range.

---

The user will now show you their search query.
`);
    convo.addUserMessage(request.query);
    await convo.submit();

    console.log(convo.getLastReplyStr());

    // The above "submit" was simply to trigger chain-of-thought reasoning in the conversation.
    // The below "submit" is used to get the structured JSON response for the search refinements.
    // Both are necessary for good results.

    const refinements: any = await convo.submit(undefined, undefined, {
      jsonResponse: {
        format: {
          type: "json_schema",
          strict: true,
          name: "json_schema_for_structured_response",
          schema: WIDGET_JSON_SCHEMA,
        },
      },
    });

    return this.cleanRefinements(refinements);
  }

  private cleanRefinements(raw: any): any {
    if (!raw || typeof raw !== "object") return raw;
    console.log("Raw refinements:", JSON.stringify(raw, null, 2));

    const widgets: any[] = Array.isArray(raw.widgets) ? raw.widgets : [];

    const cleanedWidgets = widgets.map((w) => {
      const {
        does_this_criterion_make_sense_for_this_search: _arg,
        widget_type: type,
        widget_variable_name: variable_name,
        widget_label: label,
        widget_descriptive_title,
        widget_params,
      } = w;

      let params = widget_params;
      if (
        params &&
        typeof params === "object" &&
        Array.isArray((params as { choices?: unknown }).choices)
      ) {
        const rawChoices = (params as { choices: unknown[] }).choices;
        const choices = rawChoices
          .filter((choice) => choice && typeof choice === "object")
          .map((choice) => {
            const c = choice as {
              choice_variable_value?: unknown;
              choice_ui_label?: unknown;
              choice_label?: unknown;
            };

            return {
              value: c.choice_variable_value,
              label: c.choice_ui_label ?? c.choice_label,
            };
          });

        params = { ...params, choices };
      }

      const cleanedWidget = {
        type,
        variable_name,
        label,
        tooltip: widget_descriptive_title?.teleological ?? "",
      } as Record<string, unknown>;

      if (type !== "switch") {
        cleanedWidget.params = params;
      }

      return cleanedWidget;
    });

    const d = raw.disambiguation;
    const disambiguation =
      d?.was_disambiguation_necessary === true &&
      Array.isArray(d.other_alternative_potential_meanings) &&
      d.other_alternative_potential_meanings.length > 0
        ? d
        : null;

    return { ...raw, disambiguation, widgets: cleanedWidgets };
  }

  private mockSearch(request: SearchRequest): SearchResponse {
    const query = request.query.toLowerCase();
    let results: SearchResult[];

    if (
      query.includes("book") ||
      query.includes("novel") ||
      query.includes("read")
    ) {
      results = MOCK_BOOK_RESULTS;
    } else if (
      query.includes("movie") ||
      query.includes("film") ||
      query.includes("cinema")
    ) {
      results = MOCK_MOVIE_RESULTS;
    } else {
      results = MOCK_GENERAL_RESULTS;
    }

    return {
      results,
      totalCount: results.length,
      query: request.query,
    };
  }

  private async realSearch(request: SearchRequest): Promise<SearchResponse> {
    // TODO: Implement real search using Google Custom Search API or SerpAPI
    // Example structure for Google Custom Search:
    // const url = new URL('https://www.googleapis.com/customsearch/v1')
    // url.searchParams.set('key', this.config.apiKey)
    // url.searchParams.set('cx', this.config.engineId)
    // url.searchParams.set('q', request.query)
    //
    // const response = await fetch(url.toString())
    // if (!response.ok) {
    //   throw new Error(`Search API error: ${response.status} ${response.statusText}`)
    // }
    // const data = await response.json()
    // return transformGoogleResults(data, request.query)
    throw new Error(
      "Real search not yet implemented. Set USE_MOCK=true or implement the real search provider.",
    );
  }
}

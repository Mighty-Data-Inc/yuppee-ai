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

const WIDGET_JSON_SCHEMA = {
  required: ["widgets"],
  additionalProperties: false,
  type: "object",
  properties: {
    widgets: {
      type: "array",
      items: {
        type: "object",
        required: [
          "widget_type",
          "widget_variable_name",
          "widget_label",
          "widget_tooltip",
          "widget_params",
        ],
        additionalProperties: false,
        properties: {
          widget_type: {
            type: "string",
            enum: [
              "dropdown",
              "switch",
              "checkboxes",
              "radio",
              "slider",
              "datepicker",
            ],
          },
          widget_variable_name: {
            type: "string",
            description: `A snake_case variable name for the widget, used to identify it in the code.`,
          },
          widget_label: {
            type: "string",
            description: "The label for the widget, displayed to the user.",
          },
          widget_tooltip: {
            type: "object",
            description:
              `A tooltip message that provides additional context or explanation to the user. ` +
              `We'll use a couple of different phrasings for it, so that the UI framework can ` +
              `choose one depending on the context.`,
            properties: {
              imperative: {
                type: "string",
                description:
                  'A command to the user, e.g. "Select a range of desired house prices".',
              },
              self_referential: {
                type: "string",
                description:
                  `A description of the widget that makes reference to itself ` +
                  `as a widget, e.g. "A slider for selecting a range of desired house prices".`,
              },
              direct: {
                type: "string",
                description:
                  `A description of what the widget represents, without referring to the widget itself, ` +
                  `and without being phrased as an instruction to the user. E.g. ` +
                  `"A range of desired house prices."`,
              },
            },
            required: ["imperative", "self_referential", "direct"],
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
                description: "Parameters for date picker widget.",
                properties: {
                  date_min: { type: "string", format: "date" },
                  date_max: { type: "string", format: "date" },
                  user_selects_lowest_value_of_range: { type: "boolean" },
                  user_selects_highest_value_of_range: { type: "boolean" },
                  is_specific_calendar_date_important: {
                    type: "boolean",
                    description: `Is selecting a specific calendar date meaningful for this search?`,
                  },
                  should_just_use_slider_instead: {
                    type: "boolean",
                    description: `Indicates whether a slider widget should be used instead of a date picker for this search.`,
                  },
                  slider_value_min: {
                    type: "number",
                    description:
                      "The minimum value for the slider widget, if should_just_use_slider_instead is true. Otherwise, this value is ignored.",
                  },
                  slider_value_max: {
                    type: "number",
                    description:
                      "The maximum value for the slider widget, if should_just_use_slider_instead is true. Otherwise, this value is ignored.",
                  },
                },
                required: [
                  "date_min",
                  "date_max",
                  "user_selects_lowest_value_of_range",
                  "user_selects_highest_value_of_range",
                  "is_specific_calendar_date_important",
                  "should_just_use_slider_instead",
                  "slider_value_min",
                  "slider_value_max",
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

  async search(request: SearchRequest): Promise<SearchResponse> {
    console.log(`Search request: ${JSON.stringify(request)}`); // TODO DEBUG DELETE THIS
    console.log(`QUERY: ${request.query}`); // TODO DEBUG DELETE THIS

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
- date picker (ONLY FOR SELECTING RECENT CALENDAR DATES, **NOT** YEAR RANGES)

(You may assume that there will also be a free-form text entry field that the user can
use to further refine their search in ways that aren't covered by these widgets.)

---

Provide your response as a report, in the following format:
I. Brainstorming and Discussion
II. Initial Comprehensive List of Refinement Criteria
III. Evaluation of User's Likely Interest In Items From the Initial Comprehensive List
IV. Final Selection of Refinement Criteria Most Likely to Be Used by the User
V. Discussion of Possible UI Widgets for Selected Refinement Criteria
VI. Final Selection of UI Widgets
VII. Values for UI Widgets

NOTE: For the "Final Selection of UI Widgets" section, your decisions have to be concrete
and specific. DO NOT say, "Dropdown or radio button", or "Either one will work". You must
choose a specific widget for each refinement criterion.

NOTE: For the "Final Selection of UI Widgets" section, your decisions should be non-overlapping
and non-redundant. For example, if the user is searching for a house, DO NOT have one widget
be a dropdown representing a couple of possible price ranges, and another be a slider representing
a range of prices. This would be redundant and pointless. Make sure that each widget represents
a distinct non-overlapping refinement criterion.

NOTE: For the "Values for UI Widgets" section, if a widget involves presenting multiple options
(like a dropdown, radio button, or checkboxes), provide the possible choices. For a slider,
provide the minimum and maximum values. For a date picker, provide the date range.
DO NOT leave these fields TBD. Do NOT be like "(there will be options here)". Actually
provide the options.

NOTE: Sliders and date pickers can work in a few different ways. They all involve moving a
knob along a track, sure; but the meaning of that knob can vary. Specify whether it means:
- The value that the knob is set to is interpreted as a singular selection.
- The knob's value represents the highest thing that the user wants, e.g. "Up to N".
    EXAMPLE: Selecting prices, e.g. "No more than $50"
- The knob's value represents the lowest thing that the user wants, e.g. "At least N".
    EXAMPLE: Selecting ratings, e.g. "No fewer than 4 stars"
- There are two knobs, and the values of the knobs represent a range. The user can select a
    minimum and maximum value for the criterion.
    EXAMPLE: Selecting dates, e.g. "From Jan 1, 2020 to Dec 31, 2020"
If you decide to use a slider or date picker, provide its minimum and maximum values, and
    specify whether the knob represents a singular selection, the highest value, the lowest 
    value, or a range.

NOTE: Date pickers are inappropriate for selecting dates that are far in the past or when the
user is only interested in a general/approximate time range. In such cases, a slider is more
appropriate as it allows the user to select a range of years without needing to specify an
exact day.

---

The user will now show you their search query.
`);
    convo.addUserMessage(request.query);
    await convo.submit();
    console.log(convo.getLastReplyStr());

    try {
      await convo.submit(undefined, undefined, {
        jsonResponse: {
          format: {
            type: "json_schema",
            strict: true,
            name: "json_schema_for_structured_response",
            schema: WIDGET_JSON_SCHEMA,
          },
        },
      });
    } catch (error) {
      console.error("Error submitting conversation:", error);
    }

    console.log(JSON.stringify(convo.getLastReplyDict(), null, 2));

    if (this.config.useMock) {
      return this.mockSearch(request);
    }

    return this.realSearch(request);
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

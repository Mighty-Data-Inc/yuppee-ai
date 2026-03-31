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
                            "The snake_case value that will be used in the search query when this choice is selected.",
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
              {
                type: "object",
                description: "Parameters for the switch widget.",
                properties: {
                  label_for_switch_on: {
                    type: "string",
                    description: `The prompt to show users to explain what happens when the switch is turned on, e.g. "Show only in-stock items" or "Only show shops in your area"`,
                  },
                  label_for_switch_off: {
                    type: "string",
                    description: `The prompt to show users to explain what happens when the switch is turned off, e.g. "Show all items regardless of in-stock status" or "Show all shops regardless of distance from you"`,
                  },
                },
                required: ["label_for_switch_on", "label_for_switch_off"],
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
You're an AI that powers the back end of a new smart search engine.

The user will submit a search query.

Your job will be to perform the following steps in response to this query:

I. Disambiguate
Determine whether or not this query uniquely specifies a topic, or if the wording might refer to radically different things. For example, if they query for "apple", do they mean the fruit, the computer company, or the record label? If the query is indeed ambiguous, then make an assumption to facilitate the rest of the query process.

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
    await convo.submit();

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
    if (!raw || typeof raw !== "object") {
      return raw;
    }

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

      const normalizedType = type === "checkboxes" ? "chipgroup" : type;
      const hasSingleChoiceDropdown =
        normalizedType === "dropdown" &&
        params &&
        typeof params === "object" &&
        Array.isArray((params as { choices?: unknown[] }).choices) &&
        (params as { choices: unknown[] }).choices.length === 1;

      const emittedType = hasSingleChoiceDropdown ? "switch" : normalizedType;
      const isNativeSwitch = normalizedType === "switch";
      const emittedLabel = hasSingleChoiceDropdown
        ? `Show only results about: ${label}`
        : isNativeSwitch && widget_params?.label_for_switch_on
          ? widget_params.label_for_switch_on
          : label;

      const cleanedWidget = {
        type: emittedType,
        variable_name,
        label: emittedLabel,
        tooltip: widget_descriptive_title?.teleological ?? "",
      } as Record<string, unknown>;

      if (emittedType !== "switch") {
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

    const retval = {
      disambiguation,
      widgets: cleanedWidgets,
    };
    return retval;
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

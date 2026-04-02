import OpenAI from "openai";
import type { SearchRequest, SearchResponse } from "../types";
import { ResponseInput } from "openai/resources/responses/responses";

interface SearchProviderConfig {
  openaiApiKey?: string;
}

const GPT_MODEL_SMART = "gpt-4.1";

function stripOpenAiUtmSource(url?: string): string | undefined {
  if (!url) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const utmSourceValues = parsed.searchParams.getAll("utm_source");
    const hasOpenAiSource = utmSourceValues.some(
      (value) => value.toLowerCase() === "openai",
    );

    if (!hasOpenAiSource) {
      return url;
    }

    parsed.searchParams.delete("utm_source");
    for (const value of utmSourceValues) {
      if (value.toLowerCase() !== "openai") {
        parsed.searchParams.append("utm_source", value);
      }
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

const SERP_JSON_SCHEMA = {
  type: "object",
  required: ["summary", "results"],
  additionalProperties: false,
  properties: {
    summary: {
      type: "object",
      description:
        "A concise summary of the search results for the query, in a way that can be presented as a short intro at the top of the page before listing the SERP results.",
      properties: {
        plaintext: {
          type: "string",
          description:
            "A plain text version of the summary, without any HTML tags or formatting.",
        },
        with_light_html_formatting: {
          type: "string",
          description:
            "An exact copy of the plaintext version of the summary, but with light HTML formatting such as <strong> and <em> tags. Use <strong> tags to make specific keywords or phrases stand out, particularly any terms that indicate the main topics and key search terms. Use <em> tags to italicize book and movie titles, scientific names, names of ships and vessels, etc. (per the Chicago Manual of Style).",
        },
      },
      required: ["plaintext", "with_light_html_formatting"],
      additionalProperties: false,
    },
    results: {
      type: "array",
      description: "The list of search results matching the query.",
      items: {
        type: "object",
        required: ["title", "url", "snippet", "summary"],
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            description:
              "The title of the search result, as it would appear in a SERP. Mandatory.",
          },
          url: {
            type: "string",
            description:
              "The canonical URL of the result page. Optional, but strongly encouraged; leave blank if none available.",
          },
          snippet: {
            type: "string",
            description:
              "A short excerpt from the result page that explains its relevance to the query, as typically shown beneath the title in a SERP. **Must be the !!EXACT WORDS!! from the result page.** Optional but strongly encouraged; leave blank if none available.",
          },
          summary: {
            type: "string",
            description:
              "A concise, neutral summary of the result page's content — longer and more informative than the snippet, written in plain prose. Optional but strongly encouraged; leave blank if none available.",
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
      openaiApiKey: config.openaiApiKey ?? "",
    };
  }

  async getSearchResults(request: SearchRequest): Promise<SearchResponse> {
    if (!this.config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const openaiClient = new OpenAI({ apiKey: this.config.openaiApiKey });

    const convo: ResponseInput = [
      {
        role: "developer",
        content: `
You are an AI that powers the back end of a smart search engine.

First, discuss the user's intent, and establish a firm understanding of what they're looking for.

Then, give a ballpark numerical estimate of how many relevant SERP rows the user might want to see. This should be somewhere between, say, 5 results and 200. Very specific searches will of course produce very few results; while very broad ones may produce many results. Ultimately, the bottleneck is not a question of how many results exist, but how many the user is likely to find useful. If they're doing deep research on a topic, they might want more results; if they're just looking for a quick answer, fewer results will suffice.

Finally, having determined the user's intent and the approximate number of results they probably want to see, use web search to gather current relevant SERP-style results for the user's query.

Do not return JSON yet; first reason through likely user intent and source selection.`,
      },
      {
        role: "user",
        content: `Search query:\n${request.query}`,
      },
    ];

    // Clean up the filters object by removing anything falsy or nullsy.
    // If there's anything left, we'll use it as a focus.
    if (request.filters) {
      for (const key of Object.keys(request.filters)) {
        const filterValue = request.filters[key];
        if (
          !filterValue ||
          (Array.isArray(filterValue) && filterValue.length === 0)
        ) {
          delete request.filters[key];
        }
      }
      if (Object.keys(request.filters).length > 0) {
        convo.push({
          role: "user",
          content: `I want the results filtered/specialized as follows:\n${JSON.stringify(request.filters, null, 2)}`,
        });
      }
    }

    const reasoningResponse = await openaiClient.responses.create({
      model: GPT_MODEL_SMART,
      tools: [{ type: "web_search_preview" }],
      input: convo,
    });
    let assistantReply = reasoningResponse.output_text;
    convo.push({ role: "assistant", content: assistantReply });

    const retval = {
      query: request.query,
      summary: "",
      results: [] as SearchResponse["results"],
    };

    convo.push({
      role: "developer",
      content: `
Thank you for that preliminary analysis. Let's now formalize it into an official set of JSON results.
Return only valid JSON matching the provided schema. Preserve relevance ordering from highest to lowest.
`,
    });

    try {
      // The first call performs reasoning and source discovery.
      // The second call requests strict structured output.
      const structuredResponse = await openaiClient.responses.create({
        model: GPT_MODEL_SMART,
        previous_response_id: reasoningResponse.id,
        tools: [{ type: "web_search_preview" }],
        input: convo,
        text: {
          format: {
            type: "json_schema",
            strict: true,
            name: "json_schema_for_serp_results",
            schema: SERP_JSON_SCHEMA,
          },
        },
      });

      if (!structuredResponse.output_text) {
        throw new Error("No structured JSON output was returned.");
      }

      const parsed = JSON.parse(structuredResponse.output_text) as {
        summary?: any;
        results?: SearchResponse["results"];
      };

      retval.summary = parsed.summary?.with_light_html_formatting || "";
      retval.results = Array.isArray(parsed.results)
        ? parsed.results.map((result) => ({
            ...result,
            url: stripOpenAiUtmSource(result.url),
          }))
        : [];
    } catch (error) {
      console.error("Error during structured output request:", error);
      throw error;
    }

    return retval;
  }
}

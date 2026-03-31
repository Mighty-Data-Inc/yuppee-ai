import OpenAI from "openai";
import type {
  SearchRefinementsResponse,
  SearchRequest,
  SearchResponse,
} from "../types";
import { SearchRefiner } from "./searchRefiner";

interface SearchProviderConfig {
  openaiApiKey?: string;
}

const GPT_MODEL_SMART = "gpt-4.1";

const SERP_JSON_SCHEMA = {
  type: "object",
  required: ["result_summary", "results"],
  additionalProperties: false,
  properties: {
    result_summary: {
      type: "string",
      description:
        "A concise summary of the search results for the query, in a way that can be presented as a short intro at the top of the page before listing the SERP results. You may use <strong> and <em> tags to emphasize key points.",
    },
    results: {
      type: "array",
      description: "The list of search results matching the query.",
      items: {
        type: "object",
        required: ["title", "url", "snippet", "summary", "thumbnail_url"],
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
              "A short excerpt from the result page that explains its relevance to the query, as typically shown beneath the title in a SERP. Optional but strongly encouraged; leave blank if none available.",
          },
          summary: {
            type: "string",
            description:
              "A concise, neutral summary of the result page's content — longer and more informative than the snippet, written in plain prose. Optional but strongly encouraged; leave blank if none available.",
          },
          thumbnail_url: {
            type: "string",
            description:
              "A URL pointing to a representative thumbnail image for this result, if one is available. Optional; leave blank if none available.",
          },
        },
      },
    },
  },
};

export class SearchProvider {
  private readonly config: Required<SearchProviderConfig>;
  private readonly searchRefiner: SearchRefiner;

  constructor(config: SearchProviderConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey ?? "",
    };
    this.searchRefiner = new SearchRefiner(this.config);
  }

  async getSearchResults(request: SearchRequest): Promise<SearchResponse> {
    if (!this.config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const openaiClient = new OpenAI({ apiKey: this.config.openaiApiKey });

    const userInput =
      `Search query:\n${request.query}` +
      (request.filters && Object.keys(request.filters).length > 0
        ? `\n\nI want the results filtered as follows:\n${JSON.stringify(request.filters, null, 2)}`
        : "");

    const reasoningResponse = await openaiClient.responses.create({
      model: GPT_MODEL_SMART,
      tools: [{ type: "web_search_preview" }],
      input: [
        {
          role: "developer",
          content:
            "You are an AI that powers the back end of a smart search engine. Use web search to gather realistic, current SERP-style results for the user's query. Do not return JSON yet; first reason through likely user intent and source selection.",
        },
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    const retval = {
      query: request.query,
      result_summary: "",
      results: [] as SearchResponse["results"],
    };

    try {
      // The first call performs reasoning and source discovery.
      // The second call requests strict structured output.
      const structuredResponse = await openaiClient.responses.create({
        model: GPT_MODEL_SMART,
        previous_response_id: reasoningResponse.id,
        tools: [{ type: "web_search_preview" }],
        input: [
          {
            role: "developer",
            content:
              "Return only valid JSON matching the provided schema. Preserve relevance ordering from highest to lowest.",
          },
        ],
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
        result_summary?: string;
        results?: SearchResponse["results"];
      };

      retval.result_summary = parsed.result_summary ?? "";
      retval.results = Array.isArray(parsed.results) ? parsed.results : [];
    } catch (error) {
      console.error("Error during structured output request:", error);
      throw error;
    }

    return retval;
  }

  async inferSearchRefinements(
    request: SearchRequest,
  ): Promise<SearchRefinementsResponse> {
    return this.searchRefiner.inferSearchRefinements(request);
  }
}

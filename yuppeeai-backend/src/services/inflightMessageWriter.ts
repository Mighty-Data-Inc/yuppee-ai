import OpenAI from "openai";
import type { SERPRequest } from "../types";

interface InflightMessageWriterConfig {
  openaiApiKey?: string;
}

const GPT_MODEL_FAST = "gpt-4.1-nano";

export interface InflightMessageResponse {
  query: string;
  message: string;
}

export class InflightMessageWriter {
  private readonly config: Required<InflightMessageWriterConfig>;

  constructor(config: InflightMessageWriterConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey ?? "",
    };
  }

  async createInflightMessage(
    request: SERPRequest,
  ): Promise<InflightMessageResponse> {
    const requestQuery = request.query?.trim() || "";
    if (!requestQuery) {
      throw new Error("Search query is required.");
    }

    if (!this.config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const openaiClient = new OpenAI({ apiKey: this.config.openaiApiKey });

    const requestInstructions: string[] = request.instructions ?? [];
    const instructionsBlock =
      requestInstructions.length > 0
        ? `Additional instructions:\n\n---\n\n${requestInstructions.join("\n")}`
        : "Additional instructions:\n\n---\n\n(none)";

    const response = await openaiClient.responses.create({
      model: GPT_MODEL_FAST,
      input: [
        {
          role: "developer",
          content:
            "You write very short in-progress UI status messages for a search app. " +
            "Given a query and optional instructions, produce one sentence that confirms what is being searched for. " +
            "Keep it under 24 words. Be specific, neutral, and user-facing. Do not use markdown or quotes.",
        },
        {
          role: "user",
          content: `Search query:\n\n---\n\n${requestQuery}\n\n${instructionsBlock}`,
        },
      ],
    });

    const message =
      response.output_text?.trim() ||
      `Searching for ${requestQuery}${requestInstructions.length ? " with your additional instructions." : "."}`;

    return {
      query: request.query,
      message,
    };
  }
}

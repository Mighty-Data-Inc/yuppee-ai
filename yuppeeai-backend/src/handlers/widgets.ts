import type { APIGatewayProxyResult } from "aws-lambda";
import type { LambdaHandler, WidgetsRequest, WidgetsResponse } from "../types";
import { WidgetGenerator } from "../services/widgetGenerator";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export const handler: LambdaHandler = async (event, _context) => {
  try {
    let request: Partial<WidgetsRequest> = {};

    if (event.body) {
      try {
        request =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch {
        return errorResponse(400, "Invalid JSON in request body");
      }
    }

    if (
      !request.query ||
      typeof request.query !== "string" ||
      request.query.trim() === ""
    ) {
      return errorResponse(400, "Missing required field: query");
    }

    const useMock = process.env["USE_MOCK"] !== "false";
    const widgetGenerator = new WidgetGenerator({
      openaiApiKey: process.env["OPENAI_API_KEY"],
      model: process.env["OPENAI_MODEL"],
      useMock,
    });

    const widgets = await widgetGenerator.generateWidgets({
      query: request.query,
      currentFilters: request.currentFilters,
    });

    const response: WidgetsResponse = { widgets };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return errorResponse(500, message);
  }
};

function errorResponse(
  statusCode: number,
  message: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

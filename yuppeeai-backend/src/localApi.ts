import "dotenv/config";
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler as searchHandler } from "./handlers/search";
import { handler as searchRefinementsHandler } from "./handlers/searchRefinements";

const PORT = Number(process.env["PORT"] ?? 3000);
const context = {} as Context;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

if (!process.env["USE_MOCK"]) {
  process.env["USE_MOCK"] = "true";
}

function collectBody(
  req: import("node:http").IncomingMessage,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function toLambdaEvent(params: {
  method: string;
  path: string;
  headers: IncomingHttpHeaders;
  body: string;
}): APIGatewayProxyEvent {
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(params.headers)) {
    if (typeof value === "string") {
      normalizedHeaders[key] = value;
    }
  }

  return {
    body: params.body || null,
    headers: normalizedHeaders,
    multiValueHeaders: {},
    httpMethod: params.method,
    isBase64Encoded: false,
    path: params.path,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    resource: params.path,
  };
}

const server = createServer(async (req, res) => {
  const method = req.method ?? "GET";
  const path = req.url?.split("?")[0] ?? "/";

  if (method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (
    method === "POST" &&
    (path === "/search" || path === "/search/refinements")
  ) {
    const body = await collectBody(req);
    const event = toLambdaEvent({
      method,
      path,
      headers: req.headers,
      body,
    });

    const response =
      path === "/search/refinements"
        ? await searchRefinementsHandler(event, context)
        : await searchHandler(event, context);
    res.writeHead(response.statusCode, {
      ...CORS_HEADERS,
      ...(response.headers ?? {}),
    });
    res.end(response.body);
    return;
  }

  res.writeHead(404, {
    ...CORS_HEADERS,
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify({ error: `Route not found: ${method} ${path}` }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Local backend API running at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log("Mock search mode:", process.env["USE_MOCK"] !== "false");
});

import "dotenv/config";
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { HttpRequest } from "./types";
import {
  searchHandler,
  searchRefinementsHandler,
  inflightMessageHandler,
  usageHandler,
} from "./handlers";

const PORT = Number(process.env["PORT"] ?? 3000);

// TODO: For Firebase Cloud Functions v2 deployment, replace this local HTTP
// server with Firebase Hosting + Cloud Functions. Each handler should be
// exported via onRequest() from firebase-functions/v2/https, and
// firebase.json rewrites should map /search, /refine, /inflightmsg, /usage to the
// corresponding function. Run locally with: firebase emulators:start

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

function toHttpRequest(params: {
  method: string;
  path: string;
  headers: IncomingHttpHeaders;
  body: string;
}): HttpRequest {
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(params.headers)) {
    if (typeof value === "string") {
      normalizedHeaders[key] = value;
    }
  }

  return {
    body: params.body || null,
    headers: normalizedHeaders,
    httpMethod: params.method,
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
    (method === "POST" &&
      (path === "/search" || path === "/refine" || path === "/inflightmsg")) ||
    (method === "GET" && path === "/usage")
  ) {
    const body = method === "POST" ? await collectBody(req) : "";
    const event = toHttpRequest({
      method,
      path,
      headers: req.headers,
      body,
    });

    const response =
      path === "/refine"
        ? await searchRefinementsHandler(event)
        : path === "/inflightmsg"
          ? await inflightMessageHandler(event)
          : path === "/usage"
            ? await usageHandler(event)
            : await searchHandler(event);
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
});

const { onRequest } = require("firebase-functions/v2/https");
const {
  searchHandler,
  searchRefinementsHandler,
  inflightMessageHandler,
  usageHandler,
  checkoutHandler,
  webhookHandler,
} = require("./dist/handlers");

const PUBLIC_INVOKER = { invoker: "public" };
const PUBLIC_INVOKER_WITH_OPENAI_SECRET = {
  invoker: "public",
  secrets: ["OPENAI_API_KEY"],
};
const PUBLIC_INVOKER_WITH_STRIPE_SECRET = {
  invoker: "public",
  secrets: ["STRIPE_SECRET_KEY"],
};
const PUBLIC_INVOKER_WITH_WEBHOOK_SECRET = {
  invoker: "public",
  secrets: ["STRIPE_WEBHOOK_SECRET"],
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function normalizeHeaders(headers) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }
  return normalized;
}

function bodyFromRequest(req, options = {}) {
  const { preferRawBody = false } = options;

  if (req.method !== "POST") {
    return "";
  }

  if (preferRawBody && req.rawBody) {
    return req.rawBody.toString("utf8");
  }

  if (typeof req.body === "string") {
    return req.body;
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  if (req.rawBody) {
    return req.rawBody.toString("utf8");
  }

  return "";
}

async function runHandler(req, res, handler, options = {}) {
  if (req.method === "OPTIONS") {
    res.status(204).set(CORS_HEADERS).send();
    return;
  }

  const response = await handler({
    httpMethod: req.method,
    headers: normalizeHeaders(req.headers),
    body: bodyFromRequest(req, options),
  });

  res.status(response.statusCode).set({
    ...CORS_HEADERS,
    ...(response.headers || {}),
  });
  res.send(response.body || "");
}

exports.search = onRequest(PUBLIC_INVOKER_WITH_OPENAI_SECRET, (req, res) =>
  runHandler(req, res, searchHandler),
);
exports.refine = onRequest(PUBLIC_INVOKER_WITH_OPENAI_SECRET, (req, res) =>
  runHandler(req, res, searchRefinementsHandler),
);
exports.inflightmsg = onRequest(PUBLIC_INVOKER_WITH_OPENAI_SECRET, (req, res) =>
  runHandler(req, res, inflightMessageHandler),
);
exports.usage = onRequest(PUBLIC_INVOKER, (req, res) =>
  runHandler(req, res, usageHandler),
);
exports.checkout = onRequest(PUBLIC_INVOKER_WITH_STRIPE_SECRET, (req, res) =>
  runHandler(req, res, checkoutHandler),
);
exports.webhook = onRequest(PUBLIC_INVOKER_WITH_WEBHOOK_SECRET, (req, res) =>
  runHandler(req, res, webhookHandler, { preferRawBody: true }),
);

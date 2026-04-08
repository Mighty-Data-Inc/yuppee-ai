const fs = require("node:fs");
const path = require("node:path");

require("dotenv/config");

function parseEnvAssignment(entry) {
  const idx = entry.indexOf("=");
  if (idx <= 0) {
    return null;
  }

  return {
    key: entry.slice(0, idx).trim(),
    value: entry.slice(idx + 1),
  };
}

function resolveFirebaseJsonPath() {
  const candidates = [
    path.resolve(process.cwd(), "firebase.json"),
    path.resolve(__dirname, "..", "..", "firebase.json"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function injectFunctionsEnvFromFirebaseJson() {
  const firebaseJsonPath = resolveFirebaseJsonPath();
  if (!firebaseJsonPath) {
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(firebaseJsonPath, "utf8"));
  } catch (error) {
    console.warn("[localApi] Failed to parse firebase.json", error);
    return;
  }

  const functionsConfig = Array.isArray(parsed.functions)
    ? parsed.functions.find((entry) => entry && entry.codebase === "backend") ||
      parsed.functions[0]
    : null;

  const envAssignments = Array.isArray(functionsConfig?.env)
    ? functionsConfig.env
    : [];
  const injectedKeys = [];

  for (const rawEntry of envAssignments) {
    if (typeof rawEntry !== "string") {
      continue;
    }

    const assignment = parseEnvAssignment(rawEntry);
    if (!assignment || !assignment.key) {
      continue;
    }

    // Let explicit shell/.env values win over firebase.json defaults.
    if (process.env[assignment.key] === undefined) {
      process.env[assignment.key] = assignment.value;
      injectedKeys.push(assignment.key);
    }
  }

  if (injectedKeys.length > 0) {
    console.log(
      `[localApi] Injected firebase.json env keys: ${injectedKeys.join(", ")}`,
    );
  }
}

injectFunctionsEnvFromFirebaseJson();

require("../dist/localApi.js");

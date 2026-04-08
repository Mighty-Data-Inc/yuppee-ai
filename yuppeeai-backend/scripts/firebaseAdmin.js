const { existsSync } = require("node:fs");
const { resolve } = require("node:path");
const { config } = require("dotenv");
const admin = require("firebase-admin");

function loadEnv() {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(__dirname, "../.env"),
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      config({ path: envPath, override: false });
      break;
    }
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT && process.env.FIREBASE_PROJECT_ID) {
    process.env.GOOGLE_CLOUD_PROJECT = process.env.FIREBASE_PROJECT_ID;
  }
}

function initializeAdmin() {
  loadEnv();

  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

  if (serviceAccountPath) {
    const resolved = resolve(process.cwd(), serviceAccountPath);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const serviceAccount = require(resolved);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId,
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

function getFirestore() {
  const app = initializeAdmin();
  return admin.firestore(app);
}

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  if (!found) {
    return undefined;
  }
  return found.slice(prefix.length);
}

module.exports = {
  getFirestore,
  getArg,
};

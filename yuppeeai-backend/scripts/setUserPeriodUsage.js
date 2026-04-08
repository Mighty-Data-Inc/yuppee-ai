const admin = require("firebase-admin");
const { getFirestore, getAuth, getArg } = require("./firebaseAdmin");

function getCurrentPeriodKey(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseNonNegativeInt(value, name) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return parsed;
}

async function main() {
  const email = getArg("email");
  const uidArg = getArg("uid");
  const searchesUsedArg = getArg("searchesUsed");

  if ((!email && !uidArg) || (email && uidArg)) {
    throw new Error(
      "Provide exactly one of --email or --uid. Example: npm run set:user-period-usage -- --email=you@example.com --searchesUsed=12",
    );
  }

  if (!searchesUsedArg) {
    throw new Error(
      "Missing --searchesUsed. Example: npm run set:user-period-usage -- --uid=<firebase-uid> --searchesUsed=12",
    );
  }

  const searchesUsed = parseNonNegativeInt(searchesUsedArg, "searchesUsed");

  const db = getFirestore();
  const auth = getAuth();
  const userRecord = email
    ? await auth.getUserByEmail(email)
    : await auth.getUser(String(uidArg));

  const uid = userRecord.uid;
  const currentPeriodKey = getCurrentPeriodKey();
  const usageDocId = `${uid}_${currentPeriodKey}`;
  const usageRef = db.collection("user_monthly_usage").doc(usageDocId);

  const existingSnapshot = await usageRef.get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await usageRef.set(
    {
      uid,
      periodKey: currentPeriodKey,
      searchesUsed,
      updatedAt: now,
      ...(existingSnapshot.exists ? {} : { createdAt: now }),
    },
    { merge: true },
  );

  // eslint-disable-next-line no-console
  console.log(
    `Set period usage for ${userRecord.email || uid} (${uid}) in ${currentPeriodKey} to ${searchesUsed}.`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to set current period usage:", err);
  process.exitCode = 1;
});

const admin = require("firebase-admin");
const { getFirestore, getArg } = require("./firebaseAdmin");

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseBool(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
  }
  return fallback;
}

async function main() {
  const id = getArg("id");
  if (!id) {
    throw new Error(
      "Missing --id. Example: npm run create:tier -- --id=enterprise --name=Enterprise --description=Top%20tier --monthlyQuota=25000 --active=true --isPublic=true",
    );
  }

  const name = getArg("name") || id;
  const description = getArg("description") || "";
  const monthlyQuota = parsePositiveInt(getArg("monthlyQuota"), 1000);
  const active = parseBool(getArg("active"), true);
  const isPublic = parseBool(getArg("isPublic"), true);

  const db = getFirestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const ref = db.collection("subscription_tiers").doc(id);
  const existing = await ref.get();

  await ref.set(
    {
      name,
      description,
      monthlyQuota,
      active,
      isPublic,
      updatedAt: now,
      ...(existing.exists ? {} : { createdAt: now }),
    },
    { merge: true },
  );

  // eslint-disable-next-line no-console
  console.log(
    `Upserted tier ${id} (name=${name}, monthlyQuota=${monthlyQuota}, active=${active}, isPublic=${isPublic}).`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to create tier:", err);
  process.exitCode = 1;
});

const admin = require("firebase-admin");
const { getFirestore, getAuth, getArg } = require("./firebaseAdmin");

const DEFAULT_ACCESS_EXPIRES_AT_PERIOD =
  process.env.SEARCH_DEFAULT_ACCESS_EXPIRES_AT_PERIOD ?? "2080-01";

async function main() {
  const email = getArg("email");
  const tierId = getArg("tierId");

  if (!email || !tierId) {
    throw new Error(
      "Missing required args. Example: npm run set:user-tier -- --email=you@example.com --tierId=pro",
    );
  }

  const db = getFirestore();
  const auth = getAuth();
  const userRecord = await auth.getUserByEmail(email);
  const uid = userRecord.uid;

  const tierRef = db.collection("subscription_tiers").doc(tierId);
  const tierSnapshot = await tierRef.get();
  if (!tierSnapshot.exists) {
    throw new Error(
      `Tier ${tierId} does not exist in subscription_tiers. Create it first with create:tier or seed:tiers.`,
    );
  }

  const subscriptionRef = db.collection("user_subscriptions").doc(uid);
  const existing = await subscriptionRef.get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await subscriptionRef.set(
    {
      tierId,
      status: "active",
      accessExpiresAtPeriod:
        existing.exists && existing.get("accessExpiresAtPeriod")
          ? existing.get("accessExpiresAtPeriod")
          : DEFAULT_ACCESS_EXPIRES_AT_PERIOD,
      lifetimeSearchesUsed:
        existing.exists && typeof existing.get("lifetimeSearchesUsed") === "number"
          ? existing.get("lifetimeSearchesUsed")
          : 0,
      updatedAt: now,
      ...(existing.exists ? {} : { createdAt: now }),
    },
    { merge: true },
  );

  // eslint-disable-next-line no-console
  console.log(`Set tier for ${email} (${uid}) to ${tierId}.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to set user tier:", err);
  process.exitCode = 1;
});

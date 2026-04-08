const { getFirestore, getAuth, getArg } = require("./firebaseAdmin");

function getCurrentPeriodKey(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatFirestoreTimestamp(value) {
  if (!value) {
    return "n/a";
  }
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}

function asPositiveInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function deriveEffectiveTierStatus({
  currentPeriodKey,
  accessExpiresAtPeriod,
  subscriptionStatus,
  tierActive,
}) {
  if (subscriptionStatus !== "active") {
    return "inactive-subscription";
  }
  if (tierActive === false) {
    return "inactive-tier";
  }
  if (
    typeof accessExpiresAtPeriod === "string" &&
    accessExpiresAtPeriod !== "n/a" &&
    currentPeriodKey > accessExpiresAtPeriod
  ) {
    return "expired";
  }
  return "active";
}

async function main() {
  const email = getArg("email");
  const uidArg = getArg("uid");

  if ((!email && !uidArg) || (email && uidArg)) {
    throw new Error(
      "Provide exactly one of --email or --uid. Examples: npm run view:user -- --email=you@example.com OR npm run view:user -- --uid=<firebase-uid>",
    );
  }

  const db = getFirestore();
  const auth = getAuth();
  const userRecord = email
    ? await auth.getUserByEmail(email)
    : await auth.getUser(String(uidArg));
  const uid = userRecord.uid;

  const subscriptionRef = db.collection("user_subscriptions").doc(uid);
  const subscriptionSnapshot = await subscriptionRef.get();

  const subscription = subscriptionSnapshot.exists ? subscriptionSnapshot.data() : {};
  const tierId = subscription.tierId || "n/a";

  let tier = {};
  if (typeof tierId === "string" && tierId !== "n/a") {
    const tierSnapshot = await db.collection("subscription_tiers").doc(tierId).get();
    tier = tierSnapshot.exists ? tierSnapshot.data() : {};
  }

  const usageSnapshot = await db
    .collection("user_monthly_usage")
    .where("uid", "==", uid)
    .get();

  const historyRows = usageSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        periodKey: data.periodKey || "unknown",
        searchesUsed:
          typeof data.searchesUsed === "number" ? data.searchesUsed : 0,
        updatedAt: formatFirestoreTimestamp(data.updatedAt),
      };
    })
    .sort((a, b) => String(a.periodKey).localeCompare(String(b.periodKey)));

  const historyLimit = asPositiveInt(getArg("months"), 12);
  const historyRowsLimited = historyRows.slice(-historyLimit);

  const currentPeriodKey = getCurrentPeriodKey();
  const currentPeriodRow = historyRows.find(
    (row) => row.periodKey === currentPeriodKey,
  );

  const currentSearchCount = currentPeriodRow ? currentPeriodRow.searchesUsed : 0;
  const lifetimeSearchCount =
    typeof subscription.lifetimeSearchesUsed === "number"
      ? subscription.lifetimeSearchesUsed
      : 0;

  const monthlyQuota = asPositiveInt(tier.monthlyQuota, 0);
  const remainingSearchesThisPeriod = Math.max(0, monthlyQuota - currentSearchCount);
  const providerData = Array.isArray(userRecord.providerData)
    ? userRecord.providerData.map((p) => p.providerId)
    : [];

  const effectiveTierStatus = deriveEffectiveTierStatus({
    currentPeriodKey,
    accessExpiresAtPeriod: subscription.accessExpiresAtPeriod || "n/a",
    subscriptionStatus: subscription.status || "n/a",
    tierActive: tier.active,
  });

  const latestHistoryRow = historyRows.length > 0 ? historyRows[historyRows.length - 1] : null;

  // eslint-disable-next-line no-console
  console.log("Auth");
  // eslint-disable-next-line no-console
  console.log({
    email: userRecord.email || "n/a",
    uid,
    emailVerified: userRecord.emailVerified,
    disabled: userRecord.disabled,
    providers: providerData,
    accountCreatedAt: userRecord.metadata.creationTime || "n/a",
    lastSignInAt: userRecord.metadata.lastSignInTime || "n/a",
  });

  // eslint-disable-next-line no-console
  console.log("Subscription");
  // eslint-disable-next-line no-console
  console.log({
    subscriptionTierId: tierId,
    subscriptionTierName: tier.name || "n/a",
    subscriptionTierDescription: tier.description || "n/a",
    tierActive: tier.active !== false,
    tierPublicForPurchase: tier.isPublic !== false,
    subscriptionStatus: subscription.status || "n/a",
    subscriptionCreatedAt: formatFirestoreTimestamp(subscription.createdAt),
    subscriptionUpdatedAt: formatFirestoreTimestamp(subscription.updatedAt),
    accessExpiresAtPeriod: subscription.accessExpiresAtPeriod || "n/a",
    effectiveTierStatus,
  });

  // eslint-disable-next-line no-console
  console.log("Usage");
  // eslint-disable-next-line no-console
  console.log({
    currentPeriodKey,
    currentPeriodQuota: `${currentSearchCount} / ${monthlyQuota}`,
    remainingSearchesThisPeriod,
    lifetimeSearchCount,
    lastUsageUpdatedAt: latestHistoryRow ? latestHistoryRow.updatedAt : "n/a",
  });

  // eslint-disable-next-line no-console
  console.log(`Monthly Search History (last ${historyLimit} periods)`);
  if (historyRows.length === 0) {
    // eslint-disable-next-line no-console
    console.log("No monthly usage history found.");
    return;
  }

  // eslint-disable-next-line no-console
  console.table(historyRowsLimited);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to view user:", err);
  process.exitCode = 1;
});

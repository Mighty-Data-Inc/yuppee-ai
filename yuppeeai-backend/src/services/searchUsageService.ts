import * as admin from "firebase-admin";
import { initializeFirebaseAdmin } from "../middleware/authMiddleware";

const SUBSCRIPTION_TIERS_COLLECTION = "subscription_tiers";
const USER_SUBSCRIPTIONS_COLLECTION = "user_subscriptions";
const USER_MONTHLY_USAGE_COLLECTION = "user_monthly_usage";
const PERIOD_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const DEFAULT_TIER = process.env.SEARCH_DEFAULT_TIER ?? "internal_test";
const DEFAULT_MONTHLY_QUOTA = Number(
  process.env.SEARCH_DEFAULT_MONTHLY_QUOTA ?? "1000000",
);
const DEFAULT_ACCESS_EXPIRES_AT_PERIOD =
  process.env.SEARCH_DEFAULT_ACCESS_EXPIRES_AT_PERIOD ?? "2080-01";
const DEFAULT_TIER_NAME =
  process.env.SEARCH_DEFAULT_TIER_NAME ?? "Internal Test";
const DEFAULT_TIER_DESCRIPTION =
  process.env.SEARCH_DEFAULT_TIER_DESCRIPTION ??
  "Internal testing tier with a large monthly search quota.";

export interface SearchUsage {
  tier: string;
  tierName: string;
  tierDescription: string;
  monthlyQuota: number;
  periodKey: string;
  periodSearchesUsed: number;
  lifetimeSearchesUsed: number;
  accessExpiresAtPeriod: string;
  remainingSearchesThisPeriod: number;
}

export type ConsumeSearchQuotaResult =
  | {
      allowed: true;
      usage: SearchUsage;
    }
  | {
      allowed: false;
      statusCode: 403 | 429;
      error: string;
      usage: SearchUsage;
    };

interface EntitlementDoc {
  tier: string;
  tierName: string;
  tierDescription: string;
  monthlyQuota: number;
  periodSearchesUsed: number;
  lifetimeSearchesUsed: number;
  accessExpiresAtPeriod: string;
}

interface TierDoc {
  name?: string;
  description?: string;
  monthlyQuota: number;
  active?: boolean;
}

interface UserSubscriptionDoc {
  tierId: string;
  accessExpiresAtPeriod: string;
  status?: "active" | "inactive";
  lifetimeSearchesUsed?: number;
}

interface MonthlyUsageDoc {
  searchesUsed?: number;
}

function getCurrentPeriodKey(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function ensureValidPeriodKey(periodKey: string): string {
  return PERIOD_KEY_PATTERN.test(periodKey)
    ? periodKey
    : DEFAULT_ACCESS_EXPIRES_AT_PERIOD;
}

function normalizeMonthlyQuota(quota: unknown): number {
  const asNumber =
    typeof quota === "number" ? quota : Number.parseInt(String(quota), 10);
  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return DEFAULT_MONTHLY_QUOTA;
  }
  return Math.floor(asNumber);
}

function toUsage(doc: EntitlementDoc): SearchUsage {
  const periodKey = getCurrentPeriodKey();
  return {
    tier: doc.tier,
    tierName: doc.tierName,
    tierDescription: doc.tierDescription,
    monthlyQuota: doc.monthlyQuota,
    periodKey,
    periodSearchesUsed: doc.periodSearchesUsed,
    lifetimeSearchesUsed: doc.lifetimeSearchesUsed,
    accessExpiresAtPeriod: doc.accessExpiresAtPeriod,
    remainingSearchesThisPeriod: Math.max(
      0,
      doc.monthlyQuota - doc.periodSearchesUsed,
    ),
  };
}

function getDefaultEntitlement(): EntitlementDoc {
  return {
    tier: DEFAULT_TIER,
    tierName: DEFAULT_TIER_NAME,
    tierDescription: DEFAULT_TIER_DESCRIPTION,
    monthlyQuota: normalizeMonthlyQuota(DEFAULT_MONTHLY_QUOTA),
    periodSearchesUsed: 0,
    lifetimeSearchesUsed: 0,
    accessExpiresAtPeriod: ensureValidPeriodKey(
      DEFAULT_ACCESS_EXPIRES_AT_PERIOD,
    ),
  };
}

function normalizeEntitlement(raw?: Partial<EntitlementDoc>): EntitlementDoc {
  const defaults = getDefaultEntitlement();

  const periodSearchesUsed =
    typeof raw?.periodSearchesUsed === "number" && raw.periodSearchesUsed >= 0
      ? Math.floor(raw.periodSearchesUsed)
      : 0;

  const lifetimeSearchesUsed =
    typeof raw?.lifetimeSearchesUsed === "number" &&
    raw.lifetimeSearchesUsed >= 0
      ? Math.floor(raw.lifetimeSearchesUsed)
      : periodSearchesUsed;

  return {
    tier: raw?.tier || defaults.tier,
    tierName: raw?.tierName || defaults.tierName,
    tierDescription: raw?.tierDescription || defaults.tierDescription,
    monthlyQuota: normalizeMonthlyQuota(raw?.monthlyQuota),
    periodSearchesUsed,
    lifetimeSearchesUsed,
    accessExpiresAtPeriod: ensureValidPeriodKey(
      raw?.accessExpiresAtPeriod || defaults.accessExpiresAtPeriod,
    ),
  };
}

function normalizeUserSubscription(raw?: Partial<UserSubscriptionDoc>) {
  return {
    tierId: raw?.tierId || DEFAULT_TIER,
    accessExpiresAtPeriod: ensureValidPeriodKey(
      raw?.accessExpiresAtPeriod || DEFAULT_ACCESS_EXPIRES_AT_PERIOD,
    ),
    status: raw?.status === "inactive" ? "inactive" : "active",
    lifetimeSearchesUsed:
      typeof raw?.lifetimeSearchesUsed === "number" &&
      raw.lifetimeSearchesUsed >= 0
        ? Math.floor(raw.lifetimeSearchesUsed)
        : 0,
  };
}

function normalizeTier(raw?: Partial<TierDoc>) {
  return {
    name: raw?.name || DEFAULT_TIER_NAME,
    description: raw?.description || DEFAULT_TIER_DESCRIPTION,
    monthlyQuota: normalizeMonthlyQuota(raw?.monthlyQuota),
    active: raw?.active !== false,
  };
}

function resolveTierForUser(
  tierId: string,
  tierSnapshot: admin.firestore.DocumentSnapshot,
) {
  if (tierSnapshot.exists) {
    return normalizeTier(tierSnapshot.data() as Partial<TierDoc>);
  }

  if (tierId === DEFAULT_TIER) {
    return normalizeTier({ monthlyQuota: DEFAULT_MONTHLY_QUOTA, active: true });
  }

  // Unknown tiers are treated as inactive to prevent unintended free access.
  return normalizeTier({ monthlyQuota: 1, active: false });
}

function normalizeMonthlyUsage(raw?: Partial<MonthlyUsageDoc>): number {
  return typeof raw?.searchesUsed === "number" && raw.searchesUsed >= 0
    ? Math.floor(raw.searchesUsed)
    : 0;
}

export async function getSearchUsage(uid: string): Promise<SearchUsage> {
  const app = initializeFirebaseAdmin();
  const db = admin.firestore(app);
  const currentPeriod = getCurrentPeriodKey();

  const userSubscriptionRef = db
    .collection(USER_SUBSCRIPTIONS_COLLECTION)
    .doc(uid);
  const usageDocId = `${uid}_${currentPeriod}`;
  const monthlyUsageRef = db
    .collection(USER_MONTHLY_USAGE_COLLECTION)
    .doc(usageDocId);

  const usage = await db.runTransaction(async (transaction) => {
    const userSubscriptionSnapshot = await transaction.get(userSubscriptionRef);

    let userSubscription = normalizeUserSubscription();
    if (!userSubscriptionSnapshot.exists) {
      transaction.set(userSubscriptionRef, {
        tierId: userSubscription.tierId,
        accessExpiresAtPeriod: userSubscription.accessExpiresAtPeriod,
        status: userSubscription.status,
        lifetimeSearchesUsed: userSubscription.lifetimeSearchesUsed,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      userSubscription = normalizeUserSubscription(
        userSubscriptionSnapshot.data() as Partial<UserSubscriptionDoc>,
      );
    }

    const tierRef = db
      .collection(SUBSCRIPTION_TIERS_COLLECTION)
      .doc(userSubscription.tierId);
    const tierSnapshot = await transaction.get(tierRef);
    const tier = resolveTierForUser(userSubscription.tierId, tierSnapshot);

    if (!tierSnapshot.exists && userSubscription.tierId === DEFAULT_TIER) {
      transaction.set(tierRef, {
        name: tier.name,
        description: tier.description,
        monthlyQuota: tier.monthlyQuota,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const monthlyUsageSnapshot = await transaction.get(monthlyUsageRef);
    const periodSearchesUsed = monthlyUsageSnapshot.exists
      ? normalizeMonthlyUsage(
          monthlyUsageSnapshot.data() as Partial<MonthlyUsageDoc>,
        )
      : 0;

    return toUsage(
      normalizeEntitlement({
        tier: userSubscription.tierId,
        tierName: tier.name,
        tierDescription: tier.description,
        monthlyQuota: tier.monthlyQuota,
        periodSearchesUsed,
        lifetimeSearchesUsed: userSubscription.lifetimeSearchesUsed,
        accessExpiresAtPeriod: userSubscription.accessExpiresAtPeriod,
      }),
    );
  });

  return usage;
}

export async function consumeSearchQuota(
  uid: string,
): Promise<ConsumeSearchQuotaResult> {
  const app = initializeFirebaseAdmin();
  const db = admin.firestore(app);
  const currentPeriod = getCurrentPeriodKey();

  const userSubscriptionRef = db
    .collection(USER_SUBSCRIPTIONS_COLLECTION)
    .doc(uid);
  const usageDocId = `${uid}_${currentPeriod}`;
  const monthlyUsageRef = db
    .collection(USER_MONTHLY_USAGE_COLLECTION)
    .doc(usageDocId);

  const result = await db.runTransaction(async (transaction) => {
    const userSubscriptionSnapshot = await transaction.get(userSubscriptionRef);

    let userSubscription = normalizeUserSubscription();
    if (!userSubscriptionSnapshot.exists) {
      transaction.set(userSubscriptionRef, {
        tierId: userSubscription.tierId,
        accessExpiresAtPeriod: userSubscription.accessExpiresAtPeriod,
        status: userSubscription.status,
        lifetimeSearchesUsed: userSubscription.lifetimeSearchesUsed,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      userSubscription = normalizeUserSubscription(
        userSubscriptionSnapshot.data() as Partial<UserSubscriptionDoc>,
      );
    }

    const tierRef = db
      .collection(SUBSCRIPTION_TIERS_COLLECTION)
      .doc(userSubscription.tierId);
    const tierSnapshot = await transaction.get(tierRef);
    const tier = resolveTierForUser(userSubscription.tierId, tierSnapshot);

    if (!tierSnapshot.exists && userSubscription.tierId === DEFAULT_TIER) {
      transaction.set(tierRef, {
        name: tier.name,
        description: tier.description,
        monthlyQuota: tier.monthlyQuota,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const monthlyUsageSnapshot = await transaction.get(monthlyUsageRef);
    const periodSearchesUsed = monthlyUsageSnapshot.exists
      ? normalizeMonthlyUsage(
          monthlyUsageSnapshot.data() as Partial<MonthlyUsageDoc>,
        )
      : 0;

    const entitlement = normalizeEntitlement({
      tier: userSubscription.tierId,
      tierName: tier.name,
      tierDescription: tier.description,
      monthlyQuota: tier.monthlyQuota,
      periodSearchesUsed,
      lifetimeSearchesUsed: userSubscription.lifetimeSearchesUsed,
      accessExpiresAtPeriod: userSubscription.accessExpiresAtPeriod,
    });

    if (userSubscription.status !== "active") {
      return {
        allowed: false as const,
        statusCode: 403 as const,
        error: "Subscription is inactive",
        usage: toUsage(entitlement),
      };
    }

    if (!tier.active) {
      return {
        allowed: false as const,
        statusCode: 403 as const,
        error: "Subscription tier is inactive",
        usage: toUsage(entitlement),
      };
    }

    if (currentPeriod > entitlement.accessExpiresAtPeriod) {
      return {
        allowed: false as const,
        statusCode: 403 as const,
        error: "Subscription has expired",
        usage: toUsage(entitlement),
      };
    }

    if (entitlement.periodSearchesUsed >= entitlement.monthlyQuota) {
      return {
        allowed: false as const,
        statusCode: 429 as const,
        error: "Monthly search quota exceeded",
        usage: toUsage(entitlement),
      };
    }

    entitlement.periodSearchesUsed += 1;
    entitlement.lifetimeSearchesUsed += 1;

    if (!monthlyUsageSnapshot.exists) {
      transaction.set(monthlyUsageRef, {
        uid,
        periodKey: currentPeriod,
        searchesUsed: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      transaction.update(monthlyUsageRef, {
        searchesUsed: entitlement.periodSearchesUsed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    transaction.update(userSubscriptionRef, {
      lifetimeSearchesUsed: entitlement.lifetimeSearchesUsed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      allowed: true as const,
      usage: toUsage(entitlement),
    };
  });

  return result;
}

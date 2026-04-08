const admin = require("firebase-admin");
const { getFirestore } = require("./firebaseAdmin");

const DEFAULT_TIERS = [
  {
    id: "internal_test",
    name: "Internal Test",
    description: "Internal testing tier with a functionally unlimited search quota.",
    monthlyQuota: 1_000_000,
    active: true,
  },
  {
    id: "free",
    name: "Free",
    description: "",
    monthlyQuota: 20,
    active: true,
  },
  {
    id: "standard",
    name: "Standard",
    description: "",
    monthlyQuota: 250,
    active: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "",
    monthlyQuota: 1_000,
    active: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "",
    monthlyQuota: 5_000,
    active: true,
  },
];

async function main() {
  const db = getFirestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const tier of DEFAULT_TIERS) {
    const ref = db.collection("subscription_tiers").doc(tier.id);
    const existing = await ref.get();

    await ref.set(
      {
        name: tier.name,
        description: tier.description,
        monthlyQuota: tier.monthlyQuota,
        active: tier.active,
        updatedAt: now,
        ...(existing.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    );
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${DEFAULT_TIERS.length} tiers into subscription_tiers.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to seed tiers:", err);
  process.exitCode = 1;
});

const admin = require("firebase-admin");
const { getFirestore } = require("./firebaseAdmin");

const DEFAULT_TIERS = [
  {
    id: "free",
    name: "Free",
    description:
      "Get started with essential search and refinement capabilities at no cost. Great for evaluation and light personal use.",
    monthlyQuota: 20,
    active: true,
    isPublic: true,
  },
  {
    id: "basic",
    name: "Basic",
    description:
      "Lightweight plan for casual users who plan to use AI-enhanced search and refinement capabilities every so often.",
    monthlyQuota: 250,
    active: true,
    isPublic: true,
  },
  {
    id: "standard",
    name: "Standard",
    description:
      "Balanced plan for regular users who expect to make AI-enhanced refinement a regular part of their search experience.",
    monthlyQuota: 1000,
    active: true,
    isPublic: true,
  },
  {
    id: "pro",
    name: "Pro",
    description:
      "High-volume plan for power users and small teams with advanced research needs and frequent search sessions.",
    monthlyQuota: 5_000,
    active: true,
    isPublic: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description:
      "Maximum capacity plan for organizations with large-scale usage, operational rigor, and enterprise-level workflows.",
    monthlyQuota: 20_000,
    active: true,
    isPublic: true,
  },
  {
    id: "internal_test",
    name: "Internal Test",
    description:
      "Internal-only tier for development, QA, and demos. Not purchasable and not visible to customer-facing plan selectors.",
    monthlyQuota: 1_000_000,
    active: true,
    isPublic: false,
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
        isPublic: tier.isPublic,
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

const { getFirestore } = require("./firebaseAdmin");

async function main() {
  const db = getFirestore();
  const snapshot = await db.collection("subscription_tiers").get();

  if (snapshot.empty) {
    // eslint-disable-next-line no-console
    console.log("No tiers found in subscription_tiers.");
    return;
  }

  const rows = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  // eslint-disable-next-line no-console
  console.table(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      monthlyQuota: row.monthlyQuota,
      active: row.active,
      description: row.description,
    })),
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to load tiers:", err);
  process.exitCode = 1;
});

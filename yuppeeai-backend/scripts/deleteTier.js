const { getFirestore, getArg } = require("./firebaseAdmin");

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
  const force = parseBool(getArg("force"), false);
  if (!id) {
    throw new Error(
      "Missing --id. Example: npm run delete:tier -- --id=pro",
    );
  }

  const db = getFirestore();
  const ref = db.collection("subscription_tiers").doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    // eslint-disable-next-line no-console
    console.log(`Tier ${id} does not exist. Nothing to delete.`);
    return;
  }

  const subscriptionRefs = await db
    .collection("user_subscriptions")
    .where("tierId", "==", id)
    .limit(5)
    .get();

  if (!subscriptionRefs.empty && !force) {
    const exampleIds = subscriptionRefs.docs.map((doc) => doc.id).join(", ");
    throw new Error(
      `Refusing to delete tier ${id} because it is referenced by ${subscriptionRefs.size}+ user_subscriptions (e.g. ${exampleIds}). ` +
        `Re-run with --force=true to delete anyway.`,
    );
  }

  await ref.delete();
  // eslint-disable-next-line no-console
  console.log(
    `Deleted tier ${id}${force ? " with force override" : ""}.`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to delete tier:", err);
  process.exitCode = 1;
});

import type { HttpHandler } from "../types";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import {
  requireAuth,
  initializeFirebaseAdmin,
} from "../middleware/authMiddleware";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

initializeFirebaseAdmin();

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] || "");

export const handler: HttpHandler = async (event) => {
  try {
    const decodedToken = await requireAuth(event);
    const db = getFirestore();

    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId as
      | string
      | undefined;

    if (!stripeCustomerId) {
      // No Stripe customer on record — user is on the free tier
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ tier: "free" }),
      };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription — ensure Firestore reflects free tier
      await db.collection("users").doc(decodedToken.uid).update({
        tier: "free",
        subscriptionUpdatedAt: new Date(),
      });
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ tier: "free" }),
      };
    }

    const subscription = subscriptions.data[0];
    const tierId = subscription.metadata?.tierId;

    if (tierId) {
      await db.collection("users").doc(decodedToken.uid).update({
        tier: tierId,
        subscriptionUpdatedAt: new Date(),
      });
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ tier: tierId }),
      };
    }

    // Active subscription exists but tierId not yet stamped (e.g. pre-dates
    // this feature). Return whatever Firestore currently has.
    const currentTier = userDoc.data()?.tier ?? "free";
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ tier: currentTier }),
    };
  } catch (err) {
    console.error("[RefreshTier] Request failed", err);
    const statusCode = (err as any).statusCode || 500;
    const message = err instanceof Error ? err.message : "Refresh failed";
    return {
      statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: message }),
    };
  }
};

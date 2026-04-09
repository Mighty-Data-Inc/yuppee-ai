import type { HttpHandler } from "../types";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { initializeFirebaseAdmin } from "../middleware/authMiddleware";

const STRIPE_SECRET_KEY = process.env["STRIPE_SECRET_KEY"];
const STRIPE_WEBHOOK_SECRET = process.env["STRIPE_WEBHOOK_SECRET"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

// Initialize Firebase Admin on module load
initializeFirebaseAdmin();

const stripe = new Stripe(STRIPE_SECRET_KEY || "");

// Stripe includes a Stripe-Signature header that we need to verify
// Note: HttpRequest may not have lowercase headers; this handler
// assumes case-insensitive header access or expects headers normalized.
export const handler: HttpHandler = async (event) => {
  try {
    const signature = event.headers["stripe-signature"];
    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      return errorResponse(400, "Invalid signature or missing webhook secret");
    }

    // Reconstruct the raw body from event.body
    const rawBody = typeof event.body === "string" ? event.body : "";

    let stripeEvent: any;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed", err);
      return errorResponse(400, "Webhook signature verification failed");
    }

    const db = getFirestore();

    // Handle relevant events
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object as any;
      const userId = session.client_reference_id;
      const tierId = session.metadata?.tierId;

      if (!userId || !tierId) {
        console.warn("Missing userId or tierId in session metadata");
        return errorResponse(200, "OK"); // Return 200 so Stripe doesn't retry
      }

      // Update user tier in Firestore
      await db.collection("users").doc(userId).update({
        tier: tierId,
        stripeCustomerId: session.customer,
        subscriptionUpdatedAt: new Date(),
      });

      // Stamp tierId onto the subscription so refreshTier can look it up later
      if (session.subscription) {
        await stripe.subscriptions.update(session.subscription, {
          metadata: { tierId },
        });
      }

      console.log(`User ${userId} upgraded to tier ${tierId}`);
    }

    if (stripeEvent.type === "customer.subscription.deleted") {
      const subscription = stripeEvent.data.object as any;
      const customerId = subscription.customer as string;

      // Find user by stripeCustomerId and downgrade to free
      const usersSnapshot = await db
        .collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userId = usersSnapshot.docs[0].id;
        await db.collection("users").doc(userId).update({
          tier: "free",
          subscriptionUpdatedAt: new Date(),
        });
        console.log(`User ${userId} downgraded to free tier`);
      }
    }

    // Always return 200 OK to Stripe to acknowledge receipt
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error("[Webhook] Request failed", err);
    // Return 200 to avoid Stripe retrying, but log the error
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ received: true }),
    };
  }
};

function errorResponse(statusCode: number, message: string) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

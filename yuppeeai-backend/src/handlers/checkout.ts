import type { HttpHandler, CheckoutRequest, CheckoutResponse } from "../types";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import {
  requireAuth,
  initializeFirebaseAdmin,
} from "../middleware/authMiddleware";

const STRIPE_API_KEY = process.env["STRIPE_SECRET_KEY"];
const STRIPE_PRICE_ID_MAP: Record<string, string> = {
  free: "", // Free tier has no price ID
  basic: process.env["STRIPE_PRICE_TIER_BASIC"] || "",
  standard: process.env["STRIPE_PRICE_TIER_STANDARD"] || "",
  pro: process.env["STRIPE_PRICE_TIER_PRO"] || "",
  enterprise: process.env["STRIPE_PRICE_TIER_ENTERPRISE"] || "",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

// Initialize Firebase Admin on module load
initializeFirebaseAdmin();

const stripe = new Stripe(STRIPE_API_KEY || "");

export const handler: HttpHandler = async (event) => {
  try {
    const decodedToken = await requireAuth(event);

    let request: Partial<CheckoutRequest> = {};

    if (event.body) {
      try {
        request =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch {
        return errorResponse(400, "Invalid JSON in request body");
      }
    }

    if (!request.tierId || typeof request.tierId !== "string") {
      return errorResponse(400, "Missing required field: tierId");
    }

    // Validate tier exists and is public
    const db = getFirestore();
    const tierDoc = await db
      .collection("subscription_tiers")
      .doc(request.tierId)
      .get();

    if (!tierDoc.exists) {
      return errorResponse(400, "Invalid tier ID");
    }

    const tierData = tierDoc.data();
    if (!tierData?.isPublic) {
      return errorResponse(400, "This tier is not available for purchase");
    }

    const priceId = STRIPE_PRICE_ID_MAP[request.tierId];
    if (!priceId && request.tierId !== "free") {
      return errorResponse(500, "Stripe pricing not configured for this tier");
    }

    // Free tier doesn't need Stripe checkout
    if (request.tierId === "free") {
      // Update user tier directly
      await db.collection("users").doc(decodedToken.uid).update({
        tier: "free",
        updatedAt: new Date(),
      });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          sessionUrl: null,
          message: "Free tier activated",
        } as any),
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env["APP_URL"]}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env["APP_URL"]}/checkout/cancel`,
      client_reference_id: decodedToken.uid,
      metadata: {
        tierId: request.tierId,
        userId: decodedToken.uid,
      },
    });

    const response: CheckoutResponse = {
      sessionUrl: session.url || "",
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error("[Checkout] Request failed", err);
    const statusCode = (err as any).statusCode || 500;
    const message = err instanceof Error ? err.message : "Checkout failed";
    return errorResponse(statusCode, message);
  }
};

function errorResponse(statusCode: number, message: string) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

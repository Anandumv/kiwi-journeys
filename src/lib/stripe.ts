import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// Lazily constructed so the app can boot without keys during early dev.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!key || key === "sk_test_xxx") {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add your Stripe test key to .env.",
    );
  }
  if (!_stripe) {
    // Use the SDK's pinned API version (omit to avoid type/version coupling).
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!key && key !== "sk_test_xxx";
}

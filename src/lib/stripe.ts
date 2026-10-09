import Stripe from "stripe";

/** Server-side Stripe client (secret key never reaches the browser). sk_test_… while testing, sk_live_… to go live. */
let client: Stripe | null = null;
export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

import Stripe from "stripe";
import { NextResponse } from "next/server";

const PRIX_STRIPE = "price_1UbIx6BV3JlfIkhOTWDDnU8G";

export async function POST(request: Request) {
  const cleSecrete = process.env.STRIPE_SECRET_KEY;
  if (!cleSecrete) {
    return NextResponse.json(
      { erreur: "Le paiement n’est pas encore configuré." },
      { status: 500 }
    );
  }

  try {
    const stripe = new Stripe(cleSecrete);
    const origine = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "subscription",
      locale: "fr",
      line_items: [{ price: PRIX_STRIPE, quantity: 1 }],
      return_url: `${origine}/merci?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch {
    return NextResponse.json(
      { erreur: "Le paiement n’a pas pu démarrer. Réessaie dans un instant." },
      { status: 500 }
    );
  }
}

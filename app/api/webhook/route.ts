import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cleSecrete = process.env.STRIPE_SECRET_KEY;
  const secretWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!cleSecrete || !secretWebhook) {
    return NextResponse.json({ erreur: "Webhook non configuré." }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ erreur: "Signature absente." }, { status: 400 });
  }

  const corps = await request.text();
  const stripe = new Stripe(cleSecrete);

  let evenement: Stripe.Event;
  try {
    evenement = stripe.webhooks.constructEvent(corps, signature, secretWebhook);
  } catch {
    return NextResponse.json({ erreur: "Signature invalide." }, { status: 400 });
  }

  switch (evenement.type) {
    case "checkout.session.completed":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "customer.subscription.deleted":
      console.log("Événement Stripe reçu :", evenement.type, evenement.id);
      break;
    default:
      break;
  }

  return NextResponse.json({ recu: true });
}

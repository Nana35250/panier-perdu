import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = "https://qhdcufsqmmbwjycouoqm.supabase.co";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Objet = Record<string, any>;

function identifiant(valeur: unknown): string | null {
  if (typeof valeur === "string") return valeur;
  if (valeur && typeof valeur === "object") {
    const id = (valeur as Objet).id;
    if (typeof id === "string") return id;
  }
  return null;
}

export async function POST(request: Request) {
  const cleStripe = process.env.STRIPE_SECRET_KEY;
  const secretWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  const cleBase = process.env.SUPABASE_SECRET_KEY;
  const signature = request.headers.get("stripe-signature");

  if (!cleStripe || !secretWebhook || !cleBase) {
    return NextResponse.json(
      { erreur: "Webhook non configuré." },
      { status: 500 }
    );
  }
  if (!signature) {
    return NextResponse.json({ erreur: "Signature absente." }, { status: 400 });
  }

  const corps = await request.text();
  const stripe = new Stripe(cleStripe);

  let evenement: Stripe.Event;
  try {
    evenement = stripe.webhooks.constructEvent(corps, signature, secretWebhook);
  } catch {
    return NextResponse.json({ erreur: "Signature invalide." }, { status: 400 });
  }

  const base = createClient(SUPABASE_URL, cleBase, {
    auth: { persistSession: false },
  });
  const objet = evenement.data.object as unknown as Objet;

  async function changerStatut(
    abonnement: string | null,
    statut: "actif" | "impaye" | "resilie"
  ) {
    if (!abonnement) return null;
    const { error } = await base
      .from("abonnements")
      .update({ statut, mis_a_jour_le: new Date().toISOString() })
      .eq("stripe_subscription_id", abonnement);
    return error;
  }

  let erreur: { message: string } | null = null;

  switch (evenement.type) {
    case "checkout.session.completed": {
      const abonnement = identifiant(objet.subscription);
      if (abonnement) {
        const email = objet.customer_details?.email ?? objet.customer_email ?? "";
        const { error } = await base.from("abonnements").upsert(
          {
            email,
            stripe_customer_id: identifiant(objet.customer),
            stripe_subscription_id: abonnement,
            statut: "actif",
            mis_a_jour_le: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
        erreur = error;
      }
      break;
    }
    case "invoice.paid": {
      const abonnement =
        identifiant(objet.subscription) ??
        identifiant(objet.parent?.subscription_details?.subscription);
      erreur = await changerStatut(abonnement, "actif");
      break;
    }
    case "invoice.payment_failed": {
      const abonnement =
        identifiant(objet.subscription) ??
        identifiant(objet.parent?.subscription_details?.subscription);
      erreur = await changerStatut(abonnement, "impaye");
      break;
    }
    case "customer.subscription.deleted": {
      erreur = await changerStatut(identifiant(objet.id), "resilie");
      break;
    }
    default:
      break;
  }

  if (erreur) {
    console.error("Erreur base de données :", evenement.type, erreur.message);
    return NextResponse.json({ erreur: "Enregistrement impossible." }, { status: 500 });
  }

  await base
    .from("evenements_stripe")
    .upsert(
      { id: evenement.id, type: evenement.type },
      { onConflict: "id", ignoreDuplicates: true }
    );

  console.log("Événement Stripe traité :", evenement.type, evenement.id);
  return NextResponse.json({ recu: true });
}

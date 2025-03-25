// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  console.log("Webhook endpoint hit!");

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Webhook error: Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  // Verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("Webhook event verified:", { type: event.type, id: event.id });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error during webhook signature verification";
    console.error("Webhook error: Signature verification failed", {
      error: errorMessage,
      signature,
    });
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log("Webhook event: Unhandled event type", { type: event.type, id: event.id });
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error processing webhook event";
    console.error("Webhook error: Failed to process event", {
      eventType: event.type,
      eventId: event.id,
      error: errorMessage,
    });
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}

// Handler for successful checkout sessions
const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.clerkUserId;
  const planType = session.metadata?.planType;
  const sessionId = session.id;

  console.log("Webhook: Handling checkout.session.completed", { sessionId, userId, planType });

  if (!userId) {
    console.error("Webhook error: No userId found in session metadata", { sessionId });
    throw new Error("No userId found in session metadata");
  }

  if (!planType) {
    console.error("Webhook error: No planType found in session metadata", { sessionId, userId });
    throw new Error("No planType found in session metadata");
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("Webhook error: No subscription ID found in session", { sessionId, userId });
    throw new Error("No subscription ID found in session");
  }

  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    console.log(profile);
    console.log("Webhook: Updating profile for user", { userId, subscriptionId, planType });
    await prisma.profile.update({
      where: { userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        subscriptionActive: true,
        subscriptionTier: planType,
      },
    });

    console.log("Webhook: Subscription activated for user", { userId, subscriptionId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error updating profile";
    console.error("Webhook error: Prisma update failed in checkout.session.completed", {
      userId,
      sessionId,
      subscriptionId,
      error: errorMessage,
    });
    throw new Error(`Failed to update profile: ${errorMessage}`);
  }
};

// Handler for failed invoice payments
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  const subscriptionId = invoice.subscription as string;
  const invoiceId = invoice.id;

  console.log("Webhook: Handling invoice.payment_failed", { invoiceId, subscriptionId });

  if (!subscriptionId) {
    console.error("Webhook error: No subscription ID found in invoice", { invoiceId });
    throw new Error("No subscription ID found in invoice");
  }

  let userId: string | undefined;
  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      select: { userId: true },
    });

    if (!profile?.userId) {
      console.error("Webhook error: No profile found for subscription ID", { subscriptionId, invoiceId });
      throw new Error("No profile found for this subscription ID");
    }

    userId = profile.userId;
    console.log("Webhook: Found user for subscription", { userId, subscriptionId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error querying profile";
    console.error("Webhook error: Prisma query failed in invoice.payment_failed", {
      subscriptionId,
      invoiceId,
      error: errorMessage,
    });
    throw new Error(`Failed to query profile: ${errorMessage}`);
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionActive: false,
      },
    });
    console.log("Webhook: Subscription deactivated due to payment failure", { userId, subscriptionId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error updating profile";
    console.error("Webhook error: Prisma update failed in invoice.payment_failed", {
      userId,
      subscriptionId,
      invoiceId,
      error: errorMessage,
    });
    throw new Error(`Failed to update profile: ${errorMessage}`);
  }
};

// Handler for subscription deletions (e.g., cancellations)
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  const subscriptionId = subscription.id;

  console.log("Webhook: Handling customer.subscription.deleted", { subscriptionId });

  let userId: string | undefined;
  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      select: { userId: true },
    });

    if (!profile?.userId) {
      console.error("Webhook error: No profile found for subscription ID", { subscriptionId });
      throw new Error("No profile found for this subscription ID");
    }

    userId = profile.userId;
    console.log("Webhook: Found user for subscription", { userId, subscriptionId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error querying profile";
    console.error("Webhook error: Prisma query failed in customer.subscription.deleted", {
      subscriptionId,
      error: errorMessage,
    });
    throw new Error(`Failed to query profile: ${errorMessage}`);
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionActive: false,
        stripeSubscriptionId: null,
      },
    });
    console.log("Webhook: Subscription canceled and profile updated", { userId, subscriptionId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error updating profile";
    console.error("Webhook error: Prisma update failed in customer.subscription.deleted", {
      userId,
      subscriptionId,
      error: errorMessage,
    });
    throw new Error(`Failed to update profile: ${errorMessage}`);
  }
};
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getPriceIDFromType } from "@/lib/plans";

export async function POST(request: NextRequest) {
  console.log("Checkout API route hit!");

  try {
    console.log("Parsing request body...");
    const { planType, userId, email } = await request.json();
    console.log("Request body parsed:", { planType, userId, email });

    if (!planType || !userId || !email) {
      console.log("Missing required fields!");
      return NextResponse.json(
        { error: "planType, userId, and email are required" },
        { status: 400 }
      );
    }

    const allowedPlanTypes = ["week", "month", "year"];
    if (!allowedPlanTypes.includes(planType)) {
      console.log("Invalid plan type!");
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error("NEXT_PUBLIC_BASE_URL is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    console.log("Creating Stripe checkout session...");
    const priceId = getPriceIDFromType(planType);
    console.log("Price ID:", priceId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      mode: "subscription",
      metadata: {
        clerkUserId: userId,
        planType,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?SESSION_ID={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe`,
    });

    console.log("Stripe checkout session created:", {
      id: session.id,
      url: session.url,
      subscription: session.subscription,
      status: session.status,
      metadata: session.metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) { // Changed from 'Error' to 'unknown'
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    console.error("Error in checkout API route:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
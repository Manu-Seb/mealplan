  import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getPriceIDFromType } from "@/lib/plans";

export async function POST(request: NextRequest) {
  console.log("Checkout API route hit!"); // Added log

  try {
    console.log("Parsing request body..."); // Added log
    const { planType, userId, email } = await request.json();
    console.log("Request body parsed:", { planType, userId, email }); // Added log

    if (!planType || !userId || !email) {
      console.log("Missing required fields!"); // Added log
      return NextResponse.json(
        { error: "plantype, user, email are required" },
        { status: 400 }
      );
    }
    const allowedPlanTypes = ["week", "month", "year"];
    if (!allowedPlanTypes.includes(planType)) {
      console.log("Invalid plan type!"); // Added log
      return NextResponse.json({ error: "invalid plan type" }, { status: 400 });
    }

    console.log("Creating Stripe checkout session..."); // Added log
    const priceId = getPriceIDFromType(planType);
    console.log("Price ID: ", priceId);

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

    console.log("Stripe checkout session created:", session); // Added log
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    // Changed error:error to error:any
    console.error("Error in checkout API route:", error); // Added log
    return NextResponse.json({ error: error.message }, { status: 500 }); //Added return and error message.
  }
}

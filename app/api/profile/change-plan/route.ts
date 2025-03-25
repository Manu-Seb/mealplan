import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getPriceIDFromType } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "User unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const { newPlan } = await request.json();
    if (!newPlan) {
      return NextResponse.json({ error: "No new plan provided" }, { status: 400 });
    }

    // Validate the new plan against available plans
    const validPlan = ["week", "month", "year"].includes(newPlan);
    if (!validPlan) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Fetch the user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    // Check if the user has an active Stripe subscription
    if (!profile.stripeSubscriptionId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    // Retrieve the current Stripe subscription
    const subscriptionId = profile.stripeSubscriptionId;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get the subscription item ID
    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return NextResponse.json({ error: "No active subscription items found" }, { status: 400 });
    }

    // Get the new price ID for the plan
    const newPriceId = getPriceIDFromType(newPlan);
    if (!newPriceId) {
      return NextResponse.json({ error: "Invalid price ID for the new plan" }, { status: 400 });
    }

    // Update the Stripe subscription
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    // Update the profile in Prisma with the new plan details
    const updatedProfile = await prisma.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: newPlan,
        stripeSubscriptionId: updatedSubscription.id,
        subscriptionActive: true,
      }, // Only return the subscriptionTier
    });

    // Return the updated subscription data in the same format as /api/profile/subscription-status
    return NextResponse.json({ subscription: updatedProfile });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscription" },
      { status: 500 }
    );
  }
}
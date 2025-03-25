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

    // Update the Stripe subscription
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      
    });

    // Update the profile in Prisma with the new plan details
    const updatedProfile = await prisma.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
      }, // Only return the subscriptionTier
    });

    // Return the updated subscription data in the same format as /api/profile/subscription-status
    return NextResponse.json({ subscription: cancelledSubscription });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscription" },
      { status: 500 }
    );
  }
}
// app/api/profile/unsubscribe/route.ts
import { currentUser } from "@clerk/nextjs/server";
import {  NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() { // Log the request to avoid the unused variable error
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "User unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    if (!profile.stripeSubscriptionId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    const subscriptionId = profile.stripeSubscriptionId;

    await stripe.subscriptions.cancel(subscriptionId);

    await prisma.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
      },
    });

    return NextResponse.json({ subscription: { subscriptionActive: false } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to unsubscribe";
    console.error("Error in unsubscribe API route:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
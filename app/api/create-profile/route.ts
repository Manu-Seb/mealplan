// app/api/create-profile/route.ts
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    }

    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Email not found in Clerk user data" }, { status: 400 });
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (existingProfile) {
      return NextResponse.json({ message: "Profile already exists" }, { status: 200 });
    }

    const newProfile = await prisma.profile.create({
      data: {
        userId: clerkUser.id,
        email,
        subscriptionTier: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
      },
    });

    console.log("Profile created:", newProfile);

    return NextResponse.json(
      { message: "Profile created successfully", profile: newProfile },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("Error creating profile:", errorMessage);
    return NextResponse.json(
      { error: errorMessage, details: errorMessage },
      { status: 500 }
    );
  }
}
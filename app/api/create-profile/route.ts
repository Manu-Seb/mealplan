import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }

    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "Email not found in Clerk user data" },
        { status: 400 }
      );
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { message: "Profile already exists" },
        { status: 200 } // 409 (Conflict) could also work
      );
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

    console.log("Profile created:", newProfile); // Debug log

    return NextResponse.json(
      { message: "Profile created successfully", profile: newProfile },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating profile:", error); // Log the full error
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
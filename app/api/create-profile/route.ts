import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "user not found in Clerk" },
        { status: 404 }
      );
    }
    const email = clerkUser?.emailAddresses[0].emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "email not found in" },
        { status: 400 }
      );
    }
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!existingProfile) {
      return NextResponse.json({ message: "profile Already Exists" });
    }

    await prisma.profile.create({
      data: {
        userId: clerkUser.id,
        email,
        subscriptionTier: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
      },
    });

    return NextResponse.json(
      { message: "profile created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

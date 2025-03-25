import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "User unauthorized" });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
      select: { subscriptionTier: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 400 });
    }
    return NextResponse.json({ subscription: profile });
  } catch (error: unknown) {
    console.error("Error fetching subscription status:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
// app/api/check-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { subscriptionActive: true },
    });

    return NextResponse.json({ subscriptionActive: profile?.subscriptionActive || false });
  } catch (error: unknown) { // Changed from 'Error' to 'unknown'
    // Safely handle the error by checking its type
    const errorMessage = error instanceof Error ? error.message : "Failed to check subscription status";
    console.error("Error in check-subscription API route:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
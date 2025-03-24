import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";


export async function GET(){
    try{
        const clerkUser=await currentUser();
        if(!clerkUser?.id){
            return NextResponse.json({error:"User suthorized"});
        }

        const profile = await prisma.profile.findUnique({
            where:{userId: clerkUser.id},
        select: { subscriptionTier: true }
        });
        return NextResponse.json(profile);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
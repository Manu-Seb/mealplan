import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {stripe} from '@/lib/stripe';
import {prisma} from '@/lib/prisma';


export async function POST(request:NextRequest){
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    const webhookSecret=process.env.STRIPE_WEBHOOK_SECRET;  
    let event:Stripe.Event;

    try{
        event =stripe.webhooks.constructEvent(body, signature || "", webhookSecret ||"")
    }catch(error:any){
        return NextResponse.json({error:error.message},{status:400})

    }

    try{switch(event.type){
        case "checkout.session.completed":{
            const session= event.data.object as Stripe.Checkout.Session;
            await handleCheckoutSessionCompleted(session)
            break
        }
        case "invoice.payment_failed":{
            const session= event.data.object as Stripe.Invoice;
            await handleInvoicePaymentFailed(session)
        }
        case "customer.subscription.deleted":{
            const session= event.data.object as Stripe.Subscription;
            await handleCustomerSubscriptioinDeleted(session)            
        }
        default:{
            console.log("generic stripe webhook error");
        }
    }}catch(error:any){
        return NextResponse.json({error:error.message},{status:400})
    }

    return NextResponse.json({})
}

async function handleCheckoutSessionCompleted(session:Stripe.Checkout.Session){
    const userId=session.metadata?.clerkUserId;

    if(!userId){
        console.log("no user id");
        return
    }

    const subscriptionId = session.subscription as string

    if(!subscriptionId){
        console.log("no sub id");
        return
    }

    try{
        await prisma.profile.update({
            where :{userId},
            data:{
                stripeSubscriptionId:subscriptionId,
                subscriptionActive:true,
                subscriptionTier: session.metadata?.planType || null,
            }
        })
    }
    catch(error:any){
        console.log(error.message);
    }

}
async function handleInvoicePaymentFailed(invoice:Stripe.Invoice){
    const subId=invoice.subscription as string;

    if (!subId){
        return
    }
    let userId:string | undefined
    try{
        const profile = await prisma.profile.findUnique({where:{stripeSubscriptionId:subId},
            select:{userId:true}})
        if(!profile?.userId){
            console.log("No profile found");
            return
        }
        userId=profile.userId;

    }catch(error:any){
        console.log(error.message);
        return;
    }

    try{
        await prisma.profile.update({
            where:{userId:userId},
            data:{
                subscriptionActive:false,
            }
        })
    }
    catch(error:any){
        console.log(error.message);
    }
    
}
async function handleCustomerSubscriptioinDeleted(subscription:Stripe.Subscription){
    const subId=subscription.id as string;

    let userId:string | undefined
    try{
        const profile = await prisma.profile.findUnique({where:{stripeSubscriptionId:subId},
            select:{userId:true}})
        if(!profile?.userId){
            console.log("No profile found");
            return
        }
        userId=profile.userId;

    }catch(error:any){
        console.log(error.message);
        return;
    }

    try{
        await prisma.profile.update({
            where:{userId:userId},
            data:{
                subscriptionActive:false,
                stripeSubscriptionId:null,
                subscriptionTier:null,
            }
        })
    }
    catch(error:any){
        console.log(error.message);
    }
    
    
}
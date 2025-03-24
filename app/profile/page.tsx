"use client"
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Toaster } from "react-hot-toast";

async function fetchSubscriptionStatus(){
  const response=await fetch("/api/profile/subscription-status");
  return response.json();
}

export default function ProfilePage() {
  const { isLoaded,isSignedIn, user } = useUser();
  const {data : subscription, isLoading,isError, error}= useQuery({queryKey:["subscription"],
    queryFn:fetchSubscriptionStatus,
    enabled:isLoaded && isSignedIn ,
  staleTime: 5* 60* 1000});

  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  if(!isSignedIn){
    return <div>Sign in to view your profile</div>;
  }
  return (
    <div>
      <Toaster position="top-center" />
      <div>
        <div>
          <div>
            <Image src={user.imageUrl} alt="User Avatar" width={100} height={100}/>
          </div>
          <h1>{user.firstName} {user.lastName}</h1>
          <p>{user.primaryEmailAddress?.emailAddress}</p>
        </div>
        <div>
          <h2>Subscription Details</h2>
        </div>
        
      </div>
    </div>
  );
}

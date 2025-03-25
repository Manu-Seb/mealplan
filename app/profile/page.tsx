// app/profile/page.tsx
"use client";

import { Spinner } from "@/components/spinner";
import { availablePlans } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

async function fetchSubscriptionStatus() {
  const response = await fetch("/api/profile/subscription-status");
  if (!response.ok) {
    throw new Error("Failed to fetch subscription status");
  }
  const data = await response.json();
  console.log("Fetched subscription data:", data);
  return data;
}

async function updatePlan(newPlan: string) {
  const response = await fetch("/api/profile/change-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newPlan }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update plan");
  }
  return response.json();
}

async function unsubscribe() {
  const response = await fetch("/api/profile/unsubscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to unsubscribe");
  }
  return response.json();
}

export default function ProfilePage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const { isLoaded, isSignedIn, user } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: subscription, isLoading, isError, error } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscriptionStatus,
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });

  const { mutate: updatePlanMutation, isPending: isUpdatePlanPending } = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      toast.success("Subscription plan updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error: Error) => { // Changed from 'any' to 'Error'
      toast.error(error.message || "Failed to update subscription plan");
    },
  });

  const { mutate: unsubscribeMutation, isPending: isUnsubscribePending } = useMutation({
    mutationFn: unsubscribe,
    onSuccess: () => {
      toast.success("Unsubscribed successfully!");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      router.push("/subscribe");
    },
    onError: (error: Error) => { // Changed from 'any' to 'Error'
      toast.error(error.message || "Failed to unsubscribe");
    },
  });

  console.log("availablePlans:", availablePlans);
  console.log("subscription:", subscription);

  const subscriptionTier = subscription?.subscription?.subscriptionTier;
  const currentPlan = subscriptionTier
    ? availablePlans.find((plan) => plan.interval === subscriptionTier)
    : undefined;

  useEffect(() => {
    if (currentPlan) {
      setSelectedPlan(currentPlan.interval);
    }
  }, [currentPlan]);

  if (!isLoaded) {
    return <div className="text-center text-gray-600 py-10">Loading...</div>;
  }
  if (!isSignedIn) {
    return <div className="text-center text-gray-600 py-10">Sign in to view your profile</div>;
  }

  function handleUpdatePlan() {
    if (selectedPlan && selectedPlan !== currentPlan?.interval) {
      updatePlanMutation(selectedPlan);
    } else {
      toast.error("Please select a different plan to update");
    }
    setSelectedPlan(currentPlan?.interval || "");
  }

  function handleUnsubscribe() {
    if (confirm("Are you sure you want to unsubscribe?")) {
      unsubscribeMutation();
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" />
      <div className="w-full max-w-2xl">
        {/* User Info Card */}
        <div className="bg-rose-100 shadow-xl rounded-lg p-6 sm:p-8 mb-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-rose-500 shadow-md mb-4">
              <Image
                src={user.imageUrl}
                alt="User Avatar"
                width={96}
                height={96}
                className="object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        {/* Subscription Details Section */}
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-semibold text-rose-600 mb-4">Subscription Details</h2>
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Spinner />
              <span className="text-gray-600">Loading subscription details...</span>
            </div>
          ) : isError ? (
            <p className="text-red-600">{error?.message || "Error loading subscription details"}</p>
          ) : subscription && subscriptionTier ? (
            <div className="p-4 bg-rose-50 rounded-lg shadow-sm border border-rose-200">
              <h3 className="text-lg font-medium text-rose-500 mb-3">Current Plan</h3>
              {currentPlan ? (
                <div className="space-y-2 text-gray-800">
                  <p>
                    <strong className="text-rose-600">Plan:</strong> {currentPlan.name}
                  </p>
                  <p>
                    <strong className="text-rose-600">Price:</strong> ₹{currentPlan.amount} {currentPlan.currency}
                  </p>
                  <p>
                    <strong className="text-rose-600">Status:</strong> ACTIVE
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 italic">
                  Current plan not found. Subscription tier: {subscriptionTier || "unknown"}.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 italic text-center">You are not subscribed to any plans</p>
          )}
        </div>

        {/* Change Subscription Plan Section */}
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-rose-600 mb-4">Change Subscription Plan</h3>
          {currentPlan ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="planSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Select a New Plan
                </label>
                <select
                  id="planSelect"
                  value={selectedPlan}
                  disabled={isUpdatePlanPending}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSelectedPlan(event.target.value)}
                  className="w-full px-4 py-2 bg-white text-gray-800 border border-rose-600 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-gray-200"
                >
                  <option value="" disabled>
                    Select a New Plan
                  </option>
                  {availablePlans.map((plan, key) => (
                    <option key={key} value={plan.interval}>
                      {plan.name} - ₹{plan.amount} / {plan.interval}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleUpdatePlan}
                disabled={isUpdatePlanPending || !selectedPlan}
                className="w-full px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-rose-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Change
              </button>
              {isUpdatePlanPending && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Spinner />
                  <span className="text-gray-600">Updating plan...</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 italic text-center">No current plan to change</p>
          )}
        </div>

        {/* Unsubscribe Section */}
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-rose-600 mb-4">Unsubscribe</h3>
          {currentPlan ? (
            <div className="space-y-4">
              <button
                onClick={handleUnsubscribe}
                disabled={isUnsubscribePending}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-rose-300 disabled:cursor-not-allowed transition-colors"
              >
                {isUnsubscribePending ? "Unsubscribing..." : "Unsubscribe"}
              </button>
              {isUnsubscribePending && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Spinner />
                  <span className="text-gray-600">Unsubscribing...</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 italic text-center">No active subscription to unsubscribe from</p>
          )}
        </div>
      </div>
    </div>
  );
}
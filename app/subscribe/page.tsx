"use client";

import { availablePlans } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast, Toaster } from 'react-hot-toast';

type SubscribeResponse = {
  url: string;
};
type SubscribeError = {
  error: string;
};

async function subscribeToPlan(
  planType: string,
  userId: string,
  email: string
): Promise<SubscribeResponse> {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planType,
        userId,
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Something went wrong during checkout"
      );
    }

    const data: SubscribeResponse = await response.json();
    if (!data.url) {
      throw new Error("URL from checkout was not received");
    }
    return data;
  } catch (error: any) {
    console.error("Error during subscription:", error);
    throw error; // Re-throw the error to be caught by useMutation
  }
}

export default function Subscribe() {
  const { user } = useUser();

  const router = useRouter();
  const userId = user?.id;
  const email = user?.emailAddresses[0].emailAddress || "";
  const { mutate, isPending } = useMutation<
    SubscribeResponse,
    SubscribeError,
    { planType: string }
  >({
    mutationFn: async ({ planType }) => {
      if (!userId) {
        throw new Error("user not signed in");
      }
      return subscribeToPlan(planType, userId, email);
    },
    onMutate: () => {
      toast.loading("Processing your subscription");
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error("something went wrong");
    },
  });

  const handleSubscribe = (planType: string) => {
    if (!userId) {
      router.push("sign-up");
      return;
    }
    mutate({ planType });
  };
  return (
    <>
      <Toaster />
      <div className="px-4 py-8 sm:py-12 lg-py-16">
        <div className="justify-center align-center">
          <h2 className="text-3xl font-bold text-center mt-12 sm:text-5xl tracking-tight">
            Pricing
          </h2>
          <p className="max-w-3xl text-center mt-2 mx-auto text-xl ">
            Get started on our weekly plan or upgrade to monthly or yearly when
            you're ready
          </p>
        </div>
        <div className="mt-12 container mx-auto space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {availablePlans.map((plan, key) => (
            <div
              className="relative p-8 border border-gray-200 rounded-2xl hover:shadow-md hover:scale-[1.02] transition-transform duration-200 ease-out"
              key={key}
            >
              <div className="flex-1">
                {plan.isPopular && (
                  <p className="absolute top-0 py-1.5 px-4 bg-rose-500 text-white rounded-full text-xs font-semibold transform -translate-y-1/2">
                    Most Popular
                  </p>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p>
                  <span className="mt-6 text-5xl font-bold">
                    {" "}
                    Rs.{plan.amount}
                  </span>
                  <span className="font-bold text-xl">/{plan.interval}</span>
                </p>
                <p className="mt-4">{plan.description}</p>
                <ul>
                  {plan.features.map((feature, key) => {
                    return (
                      <li key={key} className="flex mt-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0 w-6 mt-3 text-rose-500"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="mt-3">{feature}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe(plan.interval)}
                disabled={isPending}
                className={`${
                  plan.interval === "month"
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-rose-400 text-rose-700 hover:bg-rose-500"
                }
                mt-7 w-full py-3 px-6 text-white hover:bg-rose-600 border border-transparent rounded-md text-center font-medium hover:scale-[1.02] transition-transform duration-200 ease-out
              `}
              >
                {isPending ? "Please Wait" : `Subscribe to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, useUser, SignOutButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <p className="text-center text-gray-600">Loading...</p>;

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/">
          <div className="relative w-14 h-14 rounded-full overflow-hidden   shadow-sm hover:shadow-md transition-shadow">
            <Image
              src="/mealplan.png"
              width={56}
              height={56}
              alt="MealPlan Logo"
              className="object-cover"
              priority
            />
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <SignedIn>
            <Link
              className="text-gray-700 hover:text-rose-500 transition-colors font-medium"
              href="/mealplan"
            >
              Meal Plan
            </Link>
            {user?.imageUrl && (
              <Link href="/profile">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-rose-500 hover:shadow-md transition-shadow">
                  <Image
                    src={user.imageUrl}
                    alt="User profile picture"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              </Link>
            )}
            <SignOutButton>
              <button className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors font-medium">
                Sign Out
              </button>
            </SignOutButton>
          </SignedIn>
          <SignedOut>
            <Link
              className="text-gray-700 hover:text-rose-500 transition-colors font-medium"
              href="/"
            >
              Home
            </Link>
            <Link
              className="text-gray-700 hover:text-rose-500 transition-colors font-medium"
              href={isSignedIn ? "/subscribe" : "/sign-up"}
            >
              Subscribe
            </Link>
            <Link
              className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors font-medium"
              href="/sign-up"
            >
              Sign Up!
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, useUser, SignOutButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return <p>Loading...</p>;
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
      {""}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <Image
            className="text-xl font-bold text-emerald-700 cursor-pointer"
            src="/mealplan.png"
            width={60}
            height={60}
            alt="logo"
          />
        </Link>

        <div className="space-x-6 flex items-center">
          <SignedIn>
            <Link
              className="text-slate-800 hover:text-emerald-500 transition-colors"
              href="/mealplan"
            >
              {" "}
              mealplan
            </Link>
            {user?.imageUrl && (
              <Link
                href="/profile"
                className="text-gray-700 hover:text-emerald-500 transition-colors"
              >
                <Image
                  src={user.imageUrl}
                  alt="User profile picture"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </Link>
            )}
            <SignOutButton>
              <button className="ml-4 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition">
                Sign Out
              </button>
            </SignOutButton>
          </SignedIn>
          <SignedOut>
            <Link
              className="text-gray-700 hover:text-emerald-500 transition-colors"
              href="/"
            >
              Home
            </Link>
            <Link
              className="text-gray-700 hover:text-emerald-500 transition-colors"
              href={isSignedIn ? "/subscribe" : "/sign-up"}
            >
              Subscribe
            </Link>
            <Link
              className="px-4 py-2 text-white bg-emerald-500 rounded hover:text-emerald-600 transition"
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

"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Admnnav() {
  const { data: session, status } = useSession();

  // 1. LOADING STATE (Skeleton UI)
  if (status === "loading") {
    return (
      <nav className="h-16 border-b border-slate-100 bg-white animate-pulse">
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-4">
          <div className="h-10 w-10 bg-slate-200 rounded-full" />
          <div className="flex gap-4 items-center">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </nav>
    );
  }

  // 2. UNAUTHORIZED STATE
  if (!session) return null;

  return (
    <nav className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-4">
        
        {/* LOGO SECTION */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-10 w-10 relative">
            <Image 
              src="/emc_aspirants_logo.png" 
              alt="Logo" 
              fill 
              className="rounded-full object-cover border border-gray-100"
            />
          </div>
          <span className="font-bold text-slate-700 hidden xs:block">EMC</span>
        </div>

        {/* GREETINGS & USER INFO */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <h2 className="text-sm font-semibold text-slate-800">
                Hey, {session.user?.name}
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-1.5 rounded self-end">
                {session.user?.role || "Admin"}
              </span>
            </div>

            {/* User Avatar */}
            <div className="h-9 w-9 relative flex-shrink-0 ring-2 ring-slate-50 rounded-full">
              <Image 
                src={session.user?.image || "/default-avatar.png"} 
                alt="user profile" 
                fill 
                className="rounded-full object-cover"
              />
            </div>
          </div>

          {/* LOGOUT BUTTON */}
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs md:text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-all border border-transparent hover:border-red-100 active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
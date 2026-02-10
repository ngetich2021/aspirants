"use client";

import { signIn, signOut } from "next-auth/react";

// Login function
export const login = async () => {
  await signIn("google", { callbackUrl: "/dashboard" });
};

// Logout function
export const logout = async () => {
  await signOut({ callbackUrl: "/" });
};

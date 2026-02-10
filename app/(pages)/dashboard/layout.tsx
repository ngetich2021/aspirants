// components/AppLayout.tsx
"use client";

import Admnnav from "@/components/Admnnav";
import Nav from "@/components/Nav";
import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (      
      <main>
        <Admnnav/>
        <Nav/>
        {children}
      </main>
    
  );
}
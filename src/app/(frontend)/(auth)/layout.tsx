import React from "react";
import Image from "next/image";

import AuthBGImage from "$/public/assets/auth-bg.jpg";
// import { Logo } from "@/components/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: React.ReactNode;
};

export default async function AuthLayout({ children }: Props) {
  return (
    <>
      <Toaster theme="system" position="bottom-left" />
      <main className="h-screen flex items-center justify-center relative px-4">
        <ScrollArea className="w-full max-w-md">
          <div className="sm:py-12 py-6 sm:px-8 px-2 min-h-[500px] flex flex-col items-center justify-center w-full box-border">
            {children}
          </div>
        </ScrollArea>
      </main>
    </>
  );
}

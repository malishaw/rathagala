import React from "react";

// import { Logo } from "@/components/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/app/(frontend)/(landing)/_components/footer";

type Props = {
  children: React.ReactNode;
};

export default async function AuthLayout({ children }: Props) {
  return (
    <>
      <Toaster theme="system" position="bottom-left" />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950">
        <main className="flex-1 flex items-center justify-center relative px-4 py-8">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(13,148,136,0.15),transparent_50%)]" />
          
          <ScrollArea className="w-full max-w-md relative z-10">
            <div className="sm:py-8 py-4 sm:px-8 px-2 flex flex-col items-center justify-center w-full box-border">
              {children}
            </div>
          </ScrollArea>
        </main>
        <Footer />
      </div>
    </>
  );
}

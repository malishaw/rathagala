import React from "react";
import { Header } from "./_components/header";
import { Footer } from "./_components/footer";

type Props = {
  children?: React.ReactNode;
};

export default function LandingLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - Modify with conditional classes based on scroll state */}
      <Header />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}

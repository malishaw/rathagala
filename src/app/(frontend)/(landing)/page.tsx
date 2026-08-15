"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MarketplaceClient = dynamic(
  () => import("./_components/marketplace-client"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#024950] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-teal-100 font-medium animate-pulse">Loading marketplace...</p>
      </div>
    ),
  }
);

export default function LandingPage() {
  return <MarketplaceClient />;
}

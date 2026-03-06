/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy ad detail page - redirects to new /ads/[...slug] route.
 * Kept for backward compatibility with old bookmarks/links.
 */
export default function AdDetailPage() {
  const { id } = useParams();
  const adId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  useEffect(() => {
    if (adId) {
      router.replace(`/ads/${adId}`);
    }
  }, [adId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#024950] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
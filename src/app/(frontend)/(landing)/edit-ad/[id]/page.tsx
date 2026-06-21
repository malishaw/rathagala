"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import { useUpdateAd } from "@/features/ads/api/use-update-ad";
import { AdForm } from "@/features/ads/components/ad-form";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams();
  const adId = params.id as string;
  
  const { data: ad, isLoading, isError } = useGetAdById({ adId });
  const { mutate: updateAd, isPending } = useUpdateAd();
  const { data: session } = authClient.useSession();

  const handleSubmit = (adData: CreateAdSchema) => {
    updateAd(
      { id: adId, values: adData },
      {
        onSuccess: () => {
          // Check if user is admin
          const isAdmin = (session?.user as any)?.role === "admin";
          
          // Redirect based on user role
          if (isAdmin) {
            router.push('/dashboard/ads');
          } else {
            router.push('/profile#my-ads');
          }
        },
        onError: (error) => {
          console.error("Error updating ad:", error);
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-slate-100 rounded-xl px-4 py-2 transition-all text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center justify-center h-48 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-slate-600 font-medium">Loading ad details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-slate-100 rounded-xl px-4 py-2 transition-all text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center justify-center h-48 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-destructive font-semibold">Failed to load ad details. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-slate-100 rounded-xl p-2 transition-all text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Edit Your Ad</h1>
            <p className="text-xs text-slate-400">Update your vehicle listing details</p>
          </div>
        </div>

        {/* Ad Form */}
        <AdForm
          initialData={ad}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          title=""
          description=""
          submitButtonText="Update Ad"
        />
      </div>
    </div>
  );
}


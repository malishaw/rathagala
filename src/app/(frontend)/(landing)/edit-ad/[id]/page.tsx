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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Header with back button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading ad details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* Header with back button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center justify-center h-48">
            <p className="text-destructive">Failed to load ad details. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold text-slate-800">Edit Your Ad</h1>
          <p className="text-slate-600 mt-2">Update the details of your vehicle listing</p>
        </div>

        {/* Ad Form */}
        <AdForm
          initialData={ad}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          title="Update Ad"
          description="Edit the details of your vehicle listing"
          submitButtonText="Update Ad"
        />
      </div>
    </div>
  );
}


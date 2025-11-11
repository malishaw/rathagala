"use client"

import { useState } from "react";
import { useSetupAd } from "@/features/ads/api/use-setup-ad";
import { AdForm } from "@/features/ads/components/ad-form";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PendingAdModal } from "@/features/ads/components/pending-ad-modal";
import { AdSubmissionSuccessModal } from "@/features/ads/components/ad-submission-success-modal";

export default function CreateAdFormPage() {
  const router = useRouter();
  const { mutate: createAd, isPending } = useSetupAd();
  const { data: session } = authClient.useSession();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [createdAdId, setCreatedAdId] = useState<string | null>(null);

  const handleSubmit = (adData: CreateAdSchema) => {
    // Ensure we have a valid title
    const finalAdData = {
      ...adData,
      // If somehow the title is still empty after form submission
      title: adData.title || "Vehicle Ad",
    };

    createAd(
      { values: finalAdData },
      {
        onSuccess: (data) => {
          const isAdmin = (session?.user as any)?.role === "admin";
          const isPublished = !finalAdData.isDraft && finalAdData.published;
          
          // Show success modal first if ad is published (not admin)
          if (!isAdmin && isPublished) {
            setCreatedAdId(data.id);
            setShowSuccessModal(true);
          } else {
            // Admin or draft - redirect normally
            if (isAdmin) {
              router.push('/dashboard/ads');
            } else {
              router.push('/profile#my-ads');
            }
          }
        },
        onError: (error) => {
          console.error("Error creating ad:", error);
        }
      }
    );
  };

  return (
    <>
      <AdForm
        initialData={{}} // Provide empty object as initial data (no need to load existing ad)
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        title="Create New Ad"
        description="Fill in the details to create your vehicle listing"
        submitButtonText="Create Ad"
      />
      <AdSubmissionSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        onClose={() => {
          // After closing success modal, show pending modal
          setShowPendingModal(true);
        }}
      />
      <PendingAdModal
        open={showPendingModal}
        onOpenChange={setShowPendingModal}
        onGoBack={() => router.push('/dashboard/ads')}
        onCreateAnother={() => router.push('/dashboard/ads/new')}
      />
    </>
  );
}
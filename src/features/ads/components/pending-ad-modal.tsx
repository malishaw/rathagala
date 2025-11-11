"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PendingAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoBack?: () => void;
  onCreateAnother?: () => void;
}

export function PendingAdModal({
  open,
  onOpenChange,
  onGoBack,
  onCreateAnother,
}: PendingAdModalProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
    onOpenChange(false);
  };

  const handleCreateAnother = () => {
    if (onCreateAnother) {
      onCreateAnother();
    } else {
      router.push("/dashboard/ads/new");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogTitle>Ad Pending Approval</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Your ad has been submitted and is now pending admin approval. 
            It will be visible on the home page once approved by an administrator.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Your ad is now in the review queue</li>
                <li>An admin will review and approve it</li>
                <li>You'll be notified once it's approved</li>
                <li>Only approved ads appear on the home page</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>
          <Button
            onClick={handleCreateAnother}
            className="w-full sm:w-auto"
          >
            Create Another Ad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


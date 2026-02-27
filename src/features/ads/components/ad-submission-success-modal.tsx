"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone, MessageCircle } from "lucide-react";

interface AdSubmissionSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function AdSubmissionSuccessModal({
  open,
  onOpenChange,
  onClose,
}: AdSubmissionSuccessModalProps) {
  const router = useRouter();
  const phoneNumber = "0766220170";
  const displayPhoneNumber = "0766 220 170";
  const whatsappNumber = "766220170"; // Without leading 0 for WhatsApp

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    // When modal is closed, trigger the callback to show next modal
    if (!isOpen) {
      onClose();
    }
  };

  const handleDone = () => {
    handleOpenChange(false);
    router.push("/profile#my-ads");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold">
              You have successfully submitted the Ad!
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription className="space-y-4 pt-4">
          {/* English Instructions */}
          <div className="text-sm text-gray-700">
            <p>
              To publish your ad please send <strong>Your Name</strong> via SMS or WhatsApp through the provided mobile number. The ad will be successfully published after the mobile number verification.
            </p>
          </div>

          {/* Sinhala Instructions */}
          <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="mb-2">
              ඔබගේ දැන්වීම සාර්ථකව පල කර ගැනීම සදහා දැන්වීමට ලබා දුන් දුරකථන අංකය හරහා ඔබගේ නම සදහන් කර{" "}
              <strong className="text-blue-700">{displayPhoneNumber}</strong> දුරකථන අංකයට SMS පණිවුඩයක් හෝ WhatsApp පණිවුඩයක් එවන්න.
            </p>
            <p>
              එමගින් ඔබගේ දුරකථන අංකය තහවුරු කර ගනු ලැබේ.
            </p>
            <p className="mt-2 text-xs text-gray-600">
              (Ex: Nimesh Udayanga)
            </p>
          </div>
        </DialogDescription>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => window.open(`tel:${phoneNumber}`, "_self")}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            {displayPhoneNumber}
          </Button>
          <Button
            onClick={() => window.open(`https://wa.me/${whatsappNumber}`, "_blank")}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </Button>
          <Button
            onClick={handleDone}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


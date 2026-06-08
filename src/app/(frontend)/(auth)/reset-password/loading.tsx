import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  children: React.ReactNode;
};

export default function ResetPasswordLayout({}: Props) {
  return (
    <div className="w-full max-w-md space-y-4">
      {/* Form Skeleton */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="w-1/2 h-3" />
          <Skeleton className="w-full h-9" />
        </div>
        <div className="space-y-1">
          <Skeleton className="w-1/2 h-3" />
          <Skeleton className="w-full h-9" />
        </div>

        <Skeleton className="w-full h-9" />
      </div>
    </div>
  );
}


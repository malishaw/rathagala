"use client";

import React, { useId, useTransition } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

type Props = {
  mode: "login" | "signup";
  className?: string;
};

export function GoogleAuthButton({ mode = "login", className }: Props) {
  const [isPending, startSigninAction] = useTransition();
  const toastId = useId();

  const handleSocialSignin = () => {
    startSigninAction(async () => {
      await authClient.signIn.social(
        {
          provider: "google",
          callbackURL: "/"
        },
        {
          onRequest: () => {
            toast.loading("Signing in...", { id: toastId, description: "" });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message, { id: toastId });
          }
        }
      );
    });
  };

  return (
    <Button
      onClick={handleSocialSignin}
      className={cn("flex items-center gap-2", className)}
      variant={"outline"}
      icon={<FcGoogle className="size-3" />}
      loading={isPending}
    >
      {mode === "login" ? "Sign in" : "Sign up"} with Google
    </Button>
  );
}

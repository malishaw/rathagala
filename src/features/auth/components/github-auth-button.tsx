"use client";

import { useId, useTransition } from "react";
import { FaGithub } from "react-icons/fa";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Props = {
  mode: "login" | "signup";
  className?: string;
};

export function GithubAuthButton({ mode = "login", className }: Props) {
  const [isPending, startSigninAction] = useTransition();
  const toastId = useId();

  const handleSocialSignin = () => {
    startSigninAction(async () => {
      await authClient.signIn.social(
        {
          provider: "github",
          callbackURL: "/"
        },
        {
          onRequest: () => {
            toast.loading("Signing in...", { id: toastId, description: "" });
          },
          // onSuccess: () => {
          //   toast.success("Signed in successfully", { id: toastId });
          //   router.push("/");
          //   router.refresh();
          // },
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
      className={cn(
        "flex items-center gap-2 !bg-white/95 border-teal-200 hover:!bg-teal-50 hover:!border-teal-400 hover:shadow-md !text-teal-900 hover:!text-teal-900 transition-all duration-200",
        className
      )}
      variant={"outline"}
      icon={<FaGithub className="size-5" />}
      loading={isPending}
    >
      {mode === "login" ? "Sign in" : "Sign up"} with Github
    </Button>
  );
}

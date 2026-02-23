"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { client } from "@/lib/rpc";
import { authClient } from "@/lib/auth-client";

const verifyEmailSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type VerifyEmailSchemaT = z.infer<typeof verifyEmailSchema>;

type Props = {
  className?: string;
  email: string;
  name: string;
};

export function VerifyEmailForm({ className, email, name }: Props) {
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const toastId = useId();
  const router = useRouter();

  const form = useForm<VerifyEmailSchemaT>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: "",
    },
  });

  async function handleResendCode() {
    setIsResending(true);
    try {
      const response = await client.api.verification["send-verification-code"].$post({
        json: { email, name },
      });

      if (response.ok) {
        toast.success("Verification code resent!", {
          description: "Please check your email",
        });
      } else {
        toast.error("Failed to resend code");
      }
    } catch (error) {
      toast.error("Failed to resend code");
    } finally {
      setIsResending(false);
    }
  }

  async function handleFormSubmit(formData: VerifyEmailSchemaT) {
    setIsPending(true);
    toast.loading("Verifying code...", { id: toastId });

    try {
      const response = await client.api.verification["verify-code"].$post({
        json: {
          email,
          code: formData.code,
        },
      });

      if (response.ok) {
        toast.success("Email verified successfully!", { id: toastId });
        
        // Auto sign-in the user
        //const password = sessionStorage.getItem("verifyPassword");
        sessionStorage.setItem("emailJustVerified", "true");
        const postAuthRedirect = sessionStorage.getItem("postAuthRedirect");
        if (postAuthRedirect) {
          router.push(`/signin?redirect=${encodeURIComponent(postAuthRedirect)}`);
        } else {
          router.push("/signin");
        }
        
      } else {
        const data = await response.json();
        toast.error(data.message || "Invalid verification code", { id: toastId });
      }
    } catch (error) {
      toast.error("Failed to verify code", { id: toastId });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-teal-900">Verify Your Email</h2>
        <p className="text-xs text-gray-600">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-2.5 w-full"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-teal-900 font-medium text-xs">
                  Verification Code
                </FormLabel>
                <FormControl>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      disabled={isPending}
                      {...field}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="h-10 w-10 text-lg border-teal-200 bg-white" />
                        <InputOTPSlot index={1} className="h-10 w-10 text-lg border-teal-200 bg-white" />
                        <InputOTPSlot index={2} className="h-10 w-10 text-lg border-teal-200 bg-white" />
                        <InputOTPSlot index={3} className="h-10 w-10 text-lg border-teal-200 bg-white" />
                        <InputOTPSlot index={4} className="h-10 w-10 text-lg border-teal-200 bg-white" />
                        <InputOTPSlot index={5} className="h-10 w-10 text-lg border-teal-200 bg-white" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold h-9 shadow-lg transition-all duration-200"
            loading={isPending}
          >
            Verify Email
          </Button>
        </form>
      </Form>

      <div className="text-center text-xs -mt-1">
        <p className="text-gray-600">
          Didn't receive the code?{" "}
          <Button
            variant="link"
            className="p-0 h-auto text-teal-700 hover:text-teal-900 text-xs"
            onClick={handleResendCode}
            disabled={isResending}
          >
            {isResending ? "Resending..." : "Resend Code"}
          </Button>
        </p>
      </div>
    </div>
  );
}

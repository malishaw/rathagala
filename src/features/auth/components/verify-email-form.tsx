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
import { cn } from "@/lib/utils";
import { client } from "@/lib/rpc";

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
        
        // Check if user wanted to create organization
        const setupOrg = sessionStorage.getItem("setupOrganization");
        sessionStorage.removeItem("verifyEmail");
        sessionStorage.removeItem("verifyName");
        sessionStorage.removeItem("setupOrganization");

        if (setupOrg === "true") {
          router.push("/signin?setup=org");
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
    <div className={cn("grid gap-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-teal-900">Verify Your Email</h2>
        <p className="text-sm text-gray-600">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-5 w-full"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-teal-900 font-medium">
                  Verification Code
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 text-center text-2xl tracking-widest"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-6 shadow-lg transition-all duration-200"
            loading={isPending}
          >
            Verify Email
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p className="text-gray-600">
          Didn't receive the code?{" "}
          <Button
            variant="link"
            className="p-0 h-auto text-teal-700 hover:text-teal-900"
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

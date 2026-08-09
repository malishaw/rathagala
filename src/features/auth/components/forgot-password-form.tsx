"use client";

import React, { useId, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
  forgotPasswordSchema,
  type ForgotPasswordSchemaT
} from "@/features/auth/schemas/forgot-password-schema";
import { cn } from "@/lib/utils";

import { authClient } from "@/lib/auth-client";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, UserPlus } from "lucide-react";

type Props = {
  className?: string;
};

export function ForgotPasswordForm({ className }: Props) {
  const [isPending, startAction] = useTransition();
  const toastId = useId();

  const [emailNotFound, setEmailNotFound] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ForgotPasswordSchemaT>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  function handleFormSubmit(formData: ForgotPasswordSchemaT) {
    setEmailNotFound(null);
    setIsSuccess(false);

    startAction(async () => {
      toast.loading("Checking email address...", { id: toastId });

      try {
        // Step 1: Check if email exists in database
        const checkRes = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });

        const checkData = await checkRes.json();

        if (!checkData.exists) {
          toast.error("No account found with this email address.", { id: toastId });
          setEmailNotFound(formData.email);
          return;
        }

        // Step 2: Request password reset via Better Auth
        toast.loading("Sending reset link...", { id: toastId });

        await authClient.requestPasswordReset(
          {
            email: formData.email,
            redirectTo: "/reset-password"
          },
          {
            onSuccess: () => {
              toast.success("Reset link sent successfully!", { id: toastId });
              setSubmittedEmail(formData.email);
              setIsSuccess(true);
            },
            onError: (ctx) => {
              toast.error(ctx.error.message || "Failed to send reset link", { id: toastId });
            }
          }
        );
      } catch (error) {
        console.error("Forgot password error:", error);
        toast.error("An unexpected error occurred. Please try again.", { id: toastId });
      }
    });
  }

  return (
    <div className={cn("grid gap-6", className)}>
      {isSuccess ? (
        <div className="p-6 rounded-2xl border border-teal-200 bg-teal-50/80 text-teal-900 space-y-4 text-center animate-in fade-in-50">
          <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-lg font-bold text-teal-950">Check Your Email</h4>
            <p className="text-xs text-teal-800 leading-relaxed">
              We sent a password reset link to <strong className="font-semibold text-teal-950">{submittedEmail}</strong>. Please check your inbox and spam folder.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSuccess(false);
                setEmailNotFound(null);
              }}
              className="text-xs border-teal-300 text-teal-800 hover:bg-teal-100 rounded-xl"
            >
              Try another email
            </Button>
            <Button
              asChild
              variant="link"
              className="text-xs text-teal-700 hover:text-teal-900"
            >
              <Link href="/signin">
                <ArrowLeft className="size-3.5 mr-1" />
                Back to Sign In
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {emailNotFound && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/90 text-red-900 space-y-3 animate-in fade-in-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-950">Account Not Found</h4>
                  <p className="text-xs text-red-800 leading-relaxed">
                    No account is registered under <strong className="font-semibold text-red-950">{emailNotFound}</strong>. Please double-check your email or sign up for a new account.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  asChild
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-2.5 rounded-lg shadow-md transition-all duration-200 gap-1.5"
                >
                  <Link href={`/signup?email=${encodeURIComponent(emailNotFound)}`}>
                    <UserPlus className="w-4 h-4" />
                    Sign Up for a New Account
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-5 w-full"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-teal-900 font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder="your.name@email.com"
                        className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (emailNotFound) setEmailNotFound(null);
                        }}
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
                Send Reset Link
                {!isPending && <ArrowRight className="size-4 ml-2" />}
              </Button>
            </form>
          </Form>

          {/* Option texts */}
          <div className="flex items-center text-center justify-between text-sm">
            <Button
              asChild
              variant={"link"}
              className="p-0 h-auto text-teal-700 hover:text-teal-900"
            >
              <Link href={"/signin"}>
                <ArrowLeft className="size-4 mr-1" />
                Go back
              </Link>
            </Button>
            <Button asChild variant={"link"} className="p-0 h-auto text-teal-700 hover:text-teal-900">
              <Link href={"/signup"}>Need an account? <span className="font-semibold ml-1">Sign Up</span></Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

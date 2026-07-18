"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { User, Mail, Lock } from "lucide-react";

import {
    signupSchema,
    type SignupSchemaT
} from "@/features/auth/schemas/signup-schema";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { GoogleAuthButton } from "./google-auth-button";

type Props = {
  className?: string;
  redirectTo?: string;
  variant?: "standard" | "minimal";
};

export function SignupForm({ className, redirectTo, variant = "standard" }: Props) {
  const [isPending, setIsPending] = useState<boolean>(false);
  const toastId = useId();
  const router = useRouter();

  const form = useForm<SignupSchemaT>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      registerAsOrganization: false
    }
  });

  const handleFormSubmit: SubmitHandler<SignupSchemaT> = async (formData) => {
    setIsPending(true);

    await authClient.signUp.email(
      {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        isOrganization: formData.registerAsOrganization
      } as Parameters<typeof authClient.signUp.email>[0] & { isOrganization?: boolean },
      {
        onRequest: () => {
          toast.loading("Signing up...", { id: toastId });
        },
        onSuccess: async () => {
          toast.loading("Sending verification code...", { id: toastId });

          try {
            const response = await fetch("/api/verification/send-verification-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.email,
                name: formData.name,
              }),
            });

            if (response.ok) {
              toast.success("Verification code sent to your email!", {
                id: toastId,
                description: "Please check your inbox"
              });
              form.reset();
              sessionStorage.setItem("verifyEmail", formData.email);
              sessionStorage.setItem("verifyName", formData.name);
              sessionStorage.setItem("verifyPassword", formData.password);
              if (formData.registerAsOrganization) {
                sessionStorage.setItem("setupOrganization", "true");
              }
              if (redirectTo) {
                sessionStorage.setItem("postAuthRedirect", redirectTo);
              } else {
                sessionStorage.removeItem("postAuthRedirect");
              }
              router.push("/verify-email");
            } else {
              toast.error("Failed to send verification code. Please contact support.", {
                id: toastId,
              });
            }
          } catch (error) {
            console.error("Error sending verification code:", error);
            toast.error("Failed to send verification code. Please contact support.", {
              id: toastId,
            });
          }
        },
        onError: (ctx) => {
          const error = ctx.error as { message?: string; [key: string]: any };
          if (error.message?.toLowerCase().includes("existing email") || 
              error.message?.toLowerCase().includes("already exists")) {
            toast.error("Email already registered!", {
              id: toastId,
              description: "Please sign in or use a different email"
            });
          } else {
            toast.error("Signup failed!", {
              id: toastId,
              description: error.message || "Something went wrong"
            });
          }
        }
      }
    );

    setIsPending(false);
  }

  const isMinimal = variant === "minimal";

  return (
    <div className={cn("grid gap-2.5 w-full animate-in fade-in slide-in-from-bottom-2 duration-200", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => handleFormSubmit(data as SignupSchemaT))}
          className="space-y-2 w-full"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/70 group-focus-within:text-teal-600 transition-colors duration-150">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <Input
                      disabled={isPending}
                      placeholder="Full Name"
                      className="bg-white border-teal-200 pl-9 pr-3 focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-all duration-150 shadow-xs h-9 text-xs"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] mt-0.5" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/70 group-focus-within:text-teal-600 transition-colors duration-150">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <Input
                      disabled={isPending}
                      placeholder="Email Address"
                      className="bg-white border-teal-200 pl-9 pr-3 focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-all duration-150 shadow-xs h-9 text-xs"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] mt-0.5" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/70 group-focus-within:text-teal-600 transition-colors duration-150 z-10">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <PasswordInput
                      disabled={isPending}
                      placeholder="Password"
                      className="bg-white border-teal-200 pl-9 pr-10 focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-all duration-150 shadow-xs h-9 text-xs"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] mt-0.5" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/70 group-focus-within:text-teal-600 transition-colors duration-150 z-10">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <PasswordInput
                      disabled={isPending}
                      placeholder="Confirm Password"
                      className="bg-white border-teal-200 pl-9 pr-10 focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-all duration-150 shadow-xs h-9 text-xs"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] mt-0.5" />
              </FormItem>
            )}
          />
          
          {!isMinimal && (
            <FormField
              control={form.control}
              name="registerAsOrganization"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 py-1 px-0.5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <label className="text-[11px] font-medium text-teal-800 cursor-pointer select-none">
                    Register as an Organization
                  </label>
                </FormItem>
              )}
            />
          )}

          <Button 
            type="submit" 
            className="w-full bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-semibold h-9 text-xs shadow-sm transition-all duration-150 mt-1" 
            loading={isPending}
          >
            Create Account
          </Button>
        </form>
      </Form>

      {/* Option texts */}
      {isMinimal ? (
        <div className="flex items-center text-center justify-center text-[10px] mt-0.5">
          <span className="text-teal-800/75">Already have an account? </span>
          <Link href={"/signin"} className="font-semibold text-teal-700 hover:text-teal-900 ml-1 hover:underline">
            Sign In
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center text-center justify-center text-[11px] mt-0.5">
            <span className="text-teal-800/75">Already have an account? </span>
            <Link href={"/signin"} className="font-semibold text-teal-700 hover:text-teal-900 ml-1 hover:underline">
              Sign In
            </Link>
          </div>

          <div className="relative my-0.5">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-teal-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-teal-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col">
            <GoogleAuthButton mode="signup" className="w-full h-9 text-xs" />
          </div>
        </>
      )}
    </div>
  );
}


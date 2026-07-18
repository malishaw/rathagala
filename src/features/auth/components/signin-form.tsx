"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
    signinSchema,
    type SigninSchemaT
} from "@/features/auth/schemas/signin-schema";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { GoogleAuthButton } from "./google-auth-button";

type Props = {
  className?: string;
  redirectTo?: string;
  variant?: "standard" | "minimal";
};

export function SigninForm({ className, redirectTo, variant = "standard" }: Props) {
  const [isPending, setIsPending] = useState<boolean>(false);
  const toastId = useId();
  const router = useRouter();

  const form = useForm<SigninSchemaT>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function handleFormSubmit(formData: SigninSchemaT) {
    setIsPending(true);

    await authClient.signIn.email(
      {
        email: formData.email,
        password: formData.password,
        callbackURL: redirectTo || "/",
      },
      {
        onRequest() {
          toast.loading("Signing in...", { id: toastId });
        },
        async onSuccess() {
          toast.success("Successfully Signed in", { id: toastId });
          try {
            const res = await fetch("/api/auth/get-session");
            const sessionData = (await res.json()) as {
              user?: {
                role?: string;
                organizationId?: string | null;
              } | null;
            };
            const user = sessionData?.user;
            
            // Check if user is admin
            if (user?.role === "admin") {
              router.replace("/dashboard");
              return;
            }
            
            // If organizationId is not in session, fetch it from user endpoint
            let organizationId = user?.organizationId;
            if (!organizationId) {
              try {
                const userRes = await fetch("/api/users/me");
                if (userRes.ok) {
                  const userData = (await userRes.json()) as {
                    organizationId?: string | null;
                  };
                  organizationId = userData?.organizationId;
                }
              } catch (error) {
                console.error("Failed to fetch user organization:", error);
              }
            }
            
            // If a redirect target was specified (e.g. from Post Free Ad), use it
            if (redirectTo) {
              router.replace(redirectTo);
              return;
            }

            // Users with organizations should be redirected to dashboard
            if (organizationId) {
              router.replace("/dashboard");
            } else {
              router.replace("/");
            }
          } catch {
            router.replace("/");
          }
        },
        
        onError(ctx) {
          const error = ctx.error as { message?: string; code?: string; [key: string]: any };
          console.log(error);
          
          if (error.code === "EMAIL_NOT_VERIFIED") {
            const alreadyVerified = sessionStorage.getItem("emailJustVerified");

            if (alreadyVerified === "true") {
              toast.error("Email verification is syncing. Please try again in a moment.", {
                id: toastId,
              });
              return;
            }

            sessionStorage.setItem("verifyEmail", formData.email);
            sessionStorage.setItem("verifyName", formData.email.split("@")[0]);
            sessionStorage.setItem("verifyPassword", formData.password);
            if (redirectTo) {
              sessionStorage.setItem("postAuthRedirect", redirectTo);
            }

            toast.info("Email not verified", {
              id: toastId,
              description: "Redirecting to verification page..."
            });

            router.push("/verify-email");
            return;
          }

          toast.error("Sign in Failed!", {
            id: toastId,
            description: error.message,
          });
        }
      }
    );

    setIsPending(false);
  }

  const isMinimal = variant === "minimal";

  return (
    <div className={cn("grid gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-200", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-2.5 w-full"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600/70 group-focus-within:text-teal-600 transition-colors duration-150">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      disabled={isPending}
                      placeholder="Email Address"
                      className="bg-white border-teal-200 pl-9 pr-3 h-9 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-all duration-150 shadow-xs"
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
                      <Lock className="h-4 w-4" />
                    </div>
                    <PasswordInput
                      disabled={isPending}
                      placeholder="Password"
                      className="bg-white border-teal-200 pl-9 pr-10 h-9 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-100 transition-all duration-150 shadow-xs"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] mt-0.5" />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-semibold h-9 text-xs shadow-sm transition-all duration-150 mt-1" 
            loading={isPending}
          >
            Sign In
          </Button>
        </form>
      </Form>

      {/* Option texts */}
      {isMinimal ? (
        <div className="flex items-center justify-center gap-2 text-[10px] text-teal-700 mt-0.5">
          <Link 
            href={redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
            className="font-medium hover:text-teal-900 hover:underline"
          >
            Create Account
          </Link>
          <span className="text-teal-300">•</span>
          <Link 
            href="/forgot-password" 
            className="font-medium hover:text-teal-900 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 mt-1">
            <Link 
              href={redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-900 text-xs font-bold transition-all duration-150 hover:shadow-sm"
            >
             Don&apos;t have an account? <span className="underline">Create one free</span>
            </Link>
            <div className="flex justify-end">
              <Link 
                href="/forgot-password" 
                className="text-[11px] text-teal-500 hover:text-teal-700 hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <div className="relative my-0.5">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-teal-100" />
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white px-2 text-teal-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col">
            <GoogleAuthButton mode="login" className="w-full h-9 text-xs" />
          </div>
        </>
      )}
    </div>
  );
}

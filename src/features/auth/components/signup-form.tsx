"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
    FormLabel,
    FormMessage,
  FormDescription
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
};

export function SignupForm({ className, redirectTo }: Props) {
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

  async function handleFormSubmit(formData: SignupSchemaT) {
    setIsPending(true);

    await authClient.signUp.email(
      {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        isOrganization: formData.registerAsOrganization
      },
      {
        onRequest: () => {
          toast.loading("Signing up...", { id: toastId });
        },
        onSuccess: async () => {
          toast.loading("Sending verification code...", { id: toastId });

          // Send verification code
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
              // Store email, name, password, and organization intent in sessionStorage
              sessionStorage.setItem("verifyEmail", formData.email);
              sessionStorage.setItem("verifyName", formData.name);
              sessionStorage.setItem("verifyPassword", formData.password);
              if (formData.registerAsOrganization) {
                sessionStorage.setItem("setupOrganization", "true");
              }
              // Preserve the post-auth redirect destination across the verify-email flow
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
              // Don't redirect to signin if verification failed
            }
          } catch (error) {
            console.error("Error sending verification code:", error);
            toast.error("Failed to send verification code. Please contact support.", {
              id: toastId,
            });
          }
        },
        onError: (ctx) => {
          // Check if error is about existing email
          if (ctx.error.message?.toLowerCase().includes("existing email") || 
              ctx.error.message?.toLowerCase().includes("already exists")) {
            toast.error("Email already registered!", {
              id: toastId,
              description: "Please sign in or use a different email"
            });
          } else {
            toast.error("Signup failed!", {
              id: toastId,
              description: ctx.error.message || "Something went wrong"
            });
          }
        }
      }
    );

    setIsPending(false);
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-2.5 w-full"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-teal-900 font-medium text-xs">Full Name</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="Your Name"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-teal-900 font-medium text-xs">Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="your.name@email.com"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-teal-900 font-medium text-xs">Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    disabled={isPending}
                    placeholder="***********"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-teal-900 font-medium text-xs">Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    disabled={isPending}
                    placeholder="***********"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registerAsOrganization"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2.5 space-y-0 rounded-md border p-2.5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="space-y-0.5 leading-none">
                  <FormLabel className="text-xs">
                    Register as an Organization
                  </FormLabel>
                  <FormDescription className="text-xs">
                    You will be able to create an organization after signing up
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold h-9 shadow-lg transition-all duration-200 mt-3" 
            loading={isPending}
          >
            Create Account
          </Button>
        </form>
      </Form>

      {/* Option texts */}
      <div className="flex items-center text-center justify-center text-xs -mt-1">
        <Button asChild variant={"link"} className="my-3 h-auto text-teal-700 hover:text-teal-900 text-sm">
          <Link href={"/signin"}>Already have an account? <span className="font-semibold ml-1 text-sm">Sign In</span></Link>
        </Button>
      </div>

      <div className="relative -my-2">
        <div className="absolute inset-0 flex items-center">
          <Separator className="bg-teal-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-teal-600">Or continue with</span>
        </div>
      </div>

      {/* Auth Provider Buttons */}
      <div className="flex flex-col space-y-2 -mb-1">
        <GoogleAuthButton mode="signup" />
      </div>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
};

export function SigninForm({ className }: Props) {
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
        callbackURL: "/",
      },
      {
        onRequest() {
          toast.loading("Signing in...", { id: toastId });
        },
        async onSuccess() {
          toast.success("Successfully Signed in", { id: toastId });
          try {
            const res = await fetch("/api/auth/get-session");
            const sessionData = await res.json();
            const { user } = sessionData;
            
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
                  const userData = await userRes.json();
                  organizationId = userData?.organizationId;
                }
              } catch (error) {
                console.error("Failed to fetch user organization:", error);
              }
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
        
          onError({ error }) {
          console.log(error);
          
         if (error.code === "EMAIL_NOT_VERIFIED") {
    // IMPORTANT: prevent infinite loop
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

  return (
    <div className={cn("grid gap-6", className)}>
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
                <FormLabel className="text-teal-900 font-medium">Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    disabled={isPending}
                    placeholder="***********"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500"
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
            Sign In
          </Button>
        </form>
      </Form>

      {/* Option texts */}
      <div className="flex text-center items-center justify-center gap-3 text-sm">
        <Button asChild variant={"link"} className="p-0 h-auto text-teal-700 hover:text-teal-900 whitespace-nowrap">
          <Link href={"/signup"}>Need an account? <span className="font-semibold ml-1">Sign Up</span></Link>
        </Button>
        
      </div>
      <Button asChild variant={"link"} className="p-0 h-auto text-teal-700 hover:text-teal-900 whitespace-nowrap">
          <Link href={"/forgot-password"}>Forgot Password?</Link>
        </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="bg-teal-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-teal-600">Or continue with</span>
        </div>
      </div>

      {/* Auth Provider Buttons */}
      <div className="flex flex-col space-y-3">
        <GoogleAuthButton mode="login" />
      </div>
    </div>
  );
}

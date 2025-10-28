"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { redirect } from "next/navigation";
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
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { GoogleAuthButton } from "./google-auth-button";

type Props = {
  className?: string;
};

export function SignupForm({ className }: Props) {
  const [isPending, setIsPending] = useState<boolean>(false);
  const toastId = useId();

  const form = useForm<SignupSchemaT>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  async function handleFormSubmit(formData: SignupSchemaT) {
    setIsPending(true);

    await authClient.signUp.email(
      {
        email: formData.email,
        name: formData.name,
        password: formData.password
      },
      {
        onRequest: () => {
          toast.loading("Signing up...", { id: toastId });
        },
        onSuccess: () => {
          toast.success("Successfully Signed Up!", {
            id: toastId,
            description:
              "Your account has been created !, Check your email for verification link."
          });

          form.reset();
          redirect("/signin");
        },
        onError: (ctx) => {
          toast.error("Signup failed !", {
            id: toastId,
            description: ctx.error.message || "Something went wrong"
          });
        }
      }
    );

    setIsPending(false);
  }

  return (
    <div className={cn("grid gap-4", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-4 w-full"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-teal-900 font-medium text-sm">Full Name</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="John R. Doe"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-10"
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
                <FormLabel className="text-teal-900 font-medium text-sm">Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder="john.doe@example.com"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-10"
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
                <FormLabel className="text-teal-900 font-medium text-sm">Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    disabled={isPending}
                    placeholder="***********"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-10"
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
                <FormLabel className="text-teal-900 font-medium text-sm">Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    disabled={isPending}
                    placeholder="***********"
                    className="bg-white border-teal-200 focus:border-teal-500 focus:ring-teal-500 h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold h-11 shadow-lg transition-all duration-200" 
            loading={isPending}
          >
            Create Account
          </Button>
        </form>
      </Form>

      {/* Option texts */}
      <div className="flex items-center text-center justify-center text-sm -mt-2">
        <Button asChild variant={"link"} className="p-0 h-auto text-teal-700 hover:text-teal-900">
          <Link href={"/signin"}>Already have an account? <span className="font-semibold ml-1">Sign In</span></Link>
        </Button>
      </div>

      <div className="relative -my-1">
        <div className="absolute inset-0 flex items-center">
          <Separator className="bg-teal-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-teal-600">Or continue with</span>
        </div>
      </div>

      {/* Auth Provider Buttons */}
      <div className="flex flex-col space-y-2.5 -mb-2">
        <GoogleAuthButton mode="signup" />
      </div>
    </div>
  );
}

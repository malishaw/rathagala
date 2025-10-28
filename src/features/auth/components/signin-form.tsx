"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
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
        callbackURL: "/dashboard"
      },
      {
        onRequest() {
          toast.loading("Signing in...", { id: toastId });
        },
        onSuccess() {
          toast.success("Successfully Signed in", { id: toastId });
        },
        onError({ error }) {
          console.log(error);
          toast.error("Sign in Failed !", {
            id: toastId,
            description: error.message
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
                    placeholder="john.doe@example.com"
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
      <div className="flex items-center text-center justify-between text-sm">
        <Button asChild variant={"link"} className="p-0 h-auto text-teal-700 hover:text-teal-900">
          <Link href={"/signup"}>Need an account? <span className="font-semibold ml-1">Sign Up</span></Link>
        </Button>
        <Button asChild variant={"link"} className="p-0 h-auto text-teal-700 hover:text-teal-900">
          <Link href={"/forgot-password"}>Forgot Password?</Link>
        </Button>
      </div>

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

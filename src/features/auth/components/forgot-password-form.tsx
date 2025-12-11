"use client";

import React, { useId, useTransition } from "react";
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
import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  className?: string;
};

export function ForgotPasswordForm({ className }: Props) {
  const [isPending, startAction] = useTransition();
  const toastId = useId();

  const form = useForm<ForgotPasswordSchemaT>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  function handleFormSubmit(formData: ForgotPasswordSchemaT) {
    startAction(async () => {
      await authClient.forgetPassword(
        {
          email: formData.email,
          redirectTo: "/reset-password"
        },
        {
          onRequest: () => {
            toast.loading("Sending reset link...", { id: toastId });
          },
          onSuccess: () => {
            toast.success("Reset link sent successfully !", { id: toastId });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message, { id: toastId });
          }
        }
      );
    });
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
    </div>
  );
}

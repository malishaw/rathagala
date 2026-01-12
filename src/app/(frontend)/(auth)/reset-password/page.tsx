import React from "react";

import { Logo } from "@/components/logo";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

type SearchParams = Promise<{
  error?: string;
  token?: string;
}>;

type Props = {
  searchParams: SearchParams;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { error, token } = await searchParams;

  if (error) {
    return (
      <div className="space-y-6 flex flex-col items-center w-full">
        {/* Logo with enhanced styling */}
        <div className="mb-4">
          <Logo />
        </div>
        
        {/* Card container for the error */}
        <Card className="w-full max-w-md border-teal-700/20 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-0.5 text-center pb-4">
            <CardTitle className="text-3xl font-bold tracking-tight font-heading text-teal-900 leading-tight">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-base text-teal-700 pt-0.5 leading-tight">
              This link is invalid or expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/20">
                <XIcon className="size-8 text-red-500" />
              </div>

              <p className="text-sm text-center text-teal-700">
                This password reset link is invalid or expired.
              </p>

              <Button asChild variant={"yellow"} className="mt-3 w-full">
                <Link href={"/forgot-password"}>
                  <ArrowLeftIcon className="size-4" />
                  Get new reset link
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer text */}
        <p className="text-sm text-white/70 text-center">
          Secure authentication powered by Rathagala
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col items-center w-full">
      {/* Logo with enhanced styling */}
      <div className="mb-4">
        <Logo />
      </div>
      
      {/* Card container for the form */}
      <Card className="w-full max-w-md border-teal-700/20 bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-0.5 text-center pb-4">
          <CardTitle className="text-3xl font-bold tracking-tight font-heading text-teal-900 leading-tight">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-base text-teal-700 pt-0.5 leading-tight">
            Enter your new password and confirm it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
      
      {/* Footer text */}
      <p className="text-sm text-white/70 text-center">
        Secure authentication powered by Rathagala
      </p>
    </div>
  );
}

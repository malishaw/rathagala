import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <div className="space-y-2 flex flex-col items-center w-full">
      {/* Card container for the form */}
      <Card className="w-full max-w-md border-teal-700/20 bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-0 text-center pb-1.5 pt-3">
          <CardTitle className="text-lg font-bold tracking-tight font-heading text-teal-900 leading-tight">
            Get Started!
          </CardTitle>
          <CardDescription className="text-xs text-teal-700 pt-0.5 leading-tight">
            Create your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2.5 pt-1.5">
          <SignupForm />
          
          {/* Terms and Privacy Policy */}
          <div className="pt-2 mt-1 border-t border-teal-100">
            <p className="text-[10px] text-teal-700/80 text-center leading-snug">
              By signing up, you agree to our{" "}
              <Link href={"/terms"} className="font-medium text-teal-700 hover:text-teal-900 underline underline-offset-2" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href={"/privacy"} className="font-medium text-teal-700 hover:text-teal-900 underline underline-offset-2" target="_blank">
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

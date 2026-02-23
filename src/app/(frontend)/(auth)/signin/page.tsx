
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SigninForm } from "@/features/auth/components/signin-form";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center w-full px-4 pt-0 pb-8">
      <div className="w-full max-w-md space-y-6 flex flex-col items-center">
        {/* Logo with enhanced styling */}
        <div className="mb-2">
          <Logo />
        </div>

        {/* Card container for the form */}
        <Card className="w-full border-teal-700/20 bg-white shadow-lg">
          <CardHeader className="space-y-1 text-center pb-4 px-4 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight font-heading text-teal-900 leading-tight">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-teal-600 pt-1 leading-tight">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <SigninForm />
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-xs sm:text-sm text-white/70 text-center">
          Secure authentication powered by Rathagala
        </p>
      </div>
    </div>
  );
}

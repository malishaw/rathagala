
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SigninForm } from "@/features/auth/components/signin-form";

export default function LoginPage() {
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
            Welcome Back!
          </CardTitle>
          <CardDescription className="text-base text-teal-700 pt-0.5 leading-tight">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SigninForm />
        </CardContent>
      </Card>
      
      {/* Footer text */}
      <p className="text-sm text-white/70 text-center">
        Secure authentication powered by Rathagala
      </p>
    </div>
  );
}

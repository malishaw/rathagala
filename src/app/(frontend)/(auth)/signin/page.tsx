import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SigninForm } from "@/features/auth/components/signin-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="w-full max-w-md flex flex-col items-center">
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
          <SigninForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </div>
  );
}


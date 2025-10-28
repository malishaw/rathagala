import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  mode: "login" | "signup";
  className?: string;
};

export function GoogleAuthButton({ mode = "login", className }: Props) {
  return (
    <Button
      className={cn(
        "flex items-center gap-2 !bg-white/95 border-teal-200 hover:!bg-teal-50 hover:!border-teal-400 hover:shadow-md !text-teal-900 hover:!text-teal-900 transition-all duration-200",
        className
      )}
      variant={"outline"}
    >
      <FcGoogle className="size-5" />
      {mode === "login" ? "Sign in" : "Sign up"} with Google
    </Button>
  );
}

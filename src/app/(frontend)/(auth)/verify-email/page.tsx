"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verifyEmail");
    const storedName = sessionStorage.getItem("verifyName");

    if (!storedEmail || !storedName) {
      router.push("/signin");
      return;
    }

    setEmail(storedEmail);
    setName(storedName);
  }, [router]);

  if (!email || !name) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <VerifyEmailForm email={email} name={name} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Eye, EyeOff } from "lucide-react";

interface RevealPhoneButtonProps {
  phoneNumber: string;
  className?: string;
}

export function RevealPhoneButton({ phoneNumber, className = "" }: RevealPhoneButtonProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    const start = phone.slice(0, 3);
    
    const middle = "*".repeat(phone.length - 3);
    return `${start}${middle}`;
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <Button 
      className={`w-full bg-[#024950] hover:bg-[#036b75] text-white ${className}`}
      onClick={handleReveal}
    >
      <Phone className="w-4 h-4 mr-2" />
      {isRevealed ? (
        <a
          href={`tel:${phoneNumber}`}
          className="underline text-white"
          tabIndex={-1}
          onClick={e => e.stopPropagation()}
        >
          {phoneNumber}
        </a>
      ) : (
        maskPhoneNumber(phoneNumber)
      )}
      {!isRevealed && <Eye className="w-4 h-4 ml-2" />}
    </Button>
  );
}
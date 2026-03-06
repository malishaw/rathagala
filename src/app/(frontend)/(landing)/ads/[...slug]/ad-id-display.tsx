
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AdIdDisplayProps {
    id: string;
}

export function AdIdDisplay({ id }: AdIdDisplayProps) {
    const [isMasked, setIsMasked] = useState(true);

    if (!id) return null;

    const toggleMask = () => setIsMasked(!isMasked);

    // Mask with ellipsis + last 4 characters
    const last4 = id.slice(-4);
    const displayId = isMasked ? `...${last4}` : id;

    return (
        <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={toggleMask}
            title={isMasked ? "Click to reveal Ad ID" : "Click to hide Ad ID"}
        >
            <span className="font-mono text-gray-600 group-hover:text-gray-900 transition-colors">
                Ad ID: {displayId}
            </span>
            {isMasked ? (
                <Eye className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
            ) : (
                <EyeOff className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
            )}
        </div>
    );
}

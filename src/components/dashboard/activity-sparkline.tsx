"use client";

import React from "react";

interface ActivitySparklineProps {
    data: Array<{
        hour: number;
        sellers: number;
        buyers: number;
    }>;
}

export function ActivitySparkline({ data }: ActivitySparklineProps) {
    if (!data || data.length === 0) return null;

    const width = 300;
    const height = 60;
    const padding = 5;

    // Find max value for scaling
    const maxValue = Math.max(
        ...data.map((d) => d.sellers + d.buyers),
        1 // Minimum 1 to avoid division by zero
    );

    // Create path for sellers
    const sellersPath = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = height - (d.sellers / maxValue) * (height - 2 * padding) - padding;
            return `${i === 0 ? "M" : "L"} ${x},${y}`;
        })
        .join(" ");

    // Create path for buyers
    const buyersPath = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = height - (d.buyers / maxValue) * (height - 2 * padding) - padding;
            return `${i === 0 ? "M" : "L"} ${x},${y}`;
        })
        .join(" ");

    return (
        <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
        >
            {/* Sellers line - Teal */}
            <path
                d={sellersPath}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Buyers line - Green */}
            <path
                d={buyersPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

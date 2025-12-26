"use client";

import React, { useEffect, useState } from "react";
import { Users, TrendingUp, TrendingDown, Car, Search, Clock } from "lucide-react";
import { ActivitySparkline } from "./activity-sparkline";

interface DailyActiveUsersData {
    total: number;
    sellers: number;
    buyers: number;
    trend: number;
    peakHour: string;
    hourlyData: Array<{
        hour: number;
        sellers: number;
        buyers: number;
    }>;
    lastUpdated: string;
}

export function DailyActiveUsers() {
    const [data, setData] = useState<DailyActiveUsersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            console.log("Fetching daily active users data...");
            const response = await fetch("/api/analytics/daily-active-users");
            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error:", response.status, errorText);
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const result = await response.json();
            console.log("Data received:", result);
            setData(result);
            setError(null);
        } catch (err) {
            console.error("Error fetching daily active users:", err);
            setError(err instanceof Error ? err.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-20 bg-slate-200 rounded"></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 bg-slate-200 rounded"></div>
                        <div className="h-16 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">{error || "No data available"}</p>
                </div>
            </div>
        );
    }

    const sellersPercentage = data.total > 0 ? Math.round((data.sellers / data.total) * 100) : 0;
    const buyersPercentage = data.total > 0 ? Math.round((data.buyers / data.total) * 100) : 0;
    const timeSinceUpdate = Math.floor((Date.now() - new Date(data.lastUpdated).getTime()) / 60000);

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:border-teal-200 transition-all duration-300">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 bg-teal-100 rounded-lg">
                        <Users className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Daily Active Users</h3>
                </div>
                <p className="text-xs text-slate-600">Real-time platform activity</p>
            </div>

            {/* Main Metric */}
            <div className="text-center mb-4">
                <div className="text-4xl font-bold text-slate-800 mb-1">{data.total}</div>
                <div className="text-sm text-slate-600 mb-2">Total Active Now</div>
                <div className={`inline-flex items-center gap-1 text-sm font-medium ${data.trend >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                    {data.trend >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                    ) : (
                        <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(data.trend)}% vs yesterday</span>
                </div>
            </div>

            {/* User Type Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Sellers */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Car className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-medium text-teal-700">Sellers</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{data.sellers}</div>
                    <div className="text-xs text-slate-600">({sellersPercentage}%)</div>
                </div>

                {/* Buyers */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Search className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Buyers</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{data.buyers}</div>
                    <div className="text-xs text-slate-600">({buyersPercentage}%)</div>
                </div>
            </div>

            {/* Activity Chart */}
            <div className="mb-4">
                <div className="text-xs font-medium text-slate-600 mb-2">Activity (24h)</div>
                <ActivitySparkline data={data.hourlyData} />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>24h ago</span>
                    <span>Now</span>
                </div>
            </div>

            {/* Insights */}
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100 mb-3">
                <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="text-xs text-slate-700">
                    <span className="font-medium">Peak hour:</span> {data.peakHour}
                </span>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-slate-400 text-center">
                Updated {timeSinceUpdate === 0 ? "just now" : `${timeSinceUpdate} min ago`}
            </div>
        </div>
    );
}

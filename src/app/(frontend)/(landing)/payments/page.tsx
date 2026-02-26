"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Banknote,
    CheckCircle,
    Clock,
    CreditCard,
    MessageCircle,
    Phone,
    Sparkles,
    Star,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

const featuredPlans = [
    {
        label: "1 Week",
        price: "Rs. 2,000",
        description: "Great for a quick start",
        color: "from-yellow-400 to-amber-500",
        badge: "Starter",
        badgeColor: "bg-yellow-100 text-yellow-800",
    },
    {
        label: "2 Weeks",
        price: "Rs. 3,000",
        description: "Most popular choice",
        color: "from-amber-400 to-yellow-600",
        badge: "Popular",
        badgeColor: "bg-amber-100 text-amber-800",
        highlighted: true,
    },
    {
        label: "1 Month",
        price: "Rs. 4,000",
        description: "Maximum visibility",
        color: "from-amber-500 to-orange-400",
        badge: "Best Value",
        badgeColor: "bg-orange-100 text-orange-800",
    },
];

const boostPlans = [
    {
        label: "1 Week",
        price: "Rs. 1,500",
        description: "Quick visibility boost",
        color: "from-blue-500 to-blue-800",
        badge: "Starter",
        badgeColor: "bg-blue-100 text-blue-800",
    },
    {
        label: "2 Weeks",
        price: "Rs. 2,500",
        description: "Most popular boost",
        color: "from-blue-700 to-blue-900",
        badge: "Popular",
        badgeColor: "bg-blue-100 text-blue-800",
        highlighted: true,
    },
    {
        label: "3 Weeks",
        price: "Rs. 3,500",
        description: "Extended top placement",
        color: "from-blue-800 to-blue-950",
        badge: "Best Value",
        badgeColor: "bg-blue-100 text-blue-900",
    },
];

const steps = [
    {
        number: "01",
        title: "Choose a Plan",
        desc: "Select the promotion duration that suits you best.",
        icon: Star,
    },
    {
        number: "02",
        title: "Make the Payment",
        desc: "Deposit the amount to our bank account below.",
        icon: Banknote,
    },
    {
        number: "03",
        title: "Send the Slip",
        desc: "Send your payment slip to 0766220170 via WhatsApp.",
        icon: MessageCircle,
    },
    {
        number: "04",
        title: "Get Promoted",
        desc: "Our admin will review and mark your ad as promoted.",
        icon: Sparkles,
    },
];

export default function PaymentsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Back button */}
                <Button
                    className="text-slate-600 hover:text-white -ml-2 bg-transparent"
                    onClick={() => router.push('/profile#my-ads')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2 " />
                    Back
                </Button>

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#024950] to-teal-600 mb-3">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Promote Your Ad</h1>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        We currently accept bank deposits only. Your payment helps us maintain
                        our servers, improve site features, and continue offering a trusted
                        space for buying and selling vehicles.
                    </p>
                </div>

                {/* Featured Plans */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Featured Ad</h2>
                        <span className="text-sm text-slate-500">— highlighted with a featured badge</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {featuredPlans.map((plan) => (
                            <div
                                key={plan.label}
                                className={`rounded-2xl p-1 ${plan.highlighted ? "ring-2 ring-amber-400/70 shadow-lg" : ""}`}
                            >
                                <div className={`rounded-xl bg-gradient-to-br ${plan.color} text-white p-5 h-full flex flex-col`}>
                                    <Badge className={`w-fit mb-3 text-xs font-medium ${plan.badgeColor}`}>
                                        {plan.badge}
                                    </Badge>
                                    <div className="text-2xl font-bold mb-1">{plan.price}</div>
                                    <div className="text-lg font-semibold mb-1 opacity-90">{plan.label}</div>
                                    <div className="text-sm opacity-75 mt-auto">{plan.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Boost Plans */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Boosted Ad</h2>
                        <span className="text-sm text-slate-500">— appear at the top of search results</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {boostPlans.map((plan) => (
                            <div
                                key={plan.label}
                                className={`rounded-2xl p-1 ${plan.highlighted ? "ring-2 ring-blue-500/60 shadow-lg" : ""}`}
                            >
                                <div className={`rounded-xl bg-gradient-to-br ${plan.color} text-white p-5 h-full flex flex-col`}>
                                    <Badge className={`w-fit mb-3 text-xs font-medium ${plan.badgeColor}`}>
                                        {plan.badge}
                                    </Badge>
                                    <div className="text-2xl font-bold mb-1">{plan.price}</div>
                                    <div className="text-lg font-semibold mb-1 opacity-90">{plan.label}</div>
                                    <div className="text-sm opacity-75 mt-auto">{plan.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-teal-600" />
                            How It Works
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.number} className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#024950] to-teal-600 flex items-center justify-center">
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-teal-600 mb-0.5">Step {step.number}</div>
                                            <div className="font-semibold text-slate-800 text-sm">{step.title}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Details */}
                <Card className="border-2 border-teal-200 bg-teal-50/50 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-teal-600" />
                            Bank Account Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                            <div>
                                <div className="text-xs font-medium text-slate-500 mb-0.5">Account Number</div>
                                <div className="font-bold text-slate-800 text-base">8005862029</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-slate-500 mb-0.5">Account Name</div>
                                <div className="font-bold text-slate-800">R.A. Amila</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-slate-500 mb-0.5">Bank</div>
                                <div className="font-bold text-slate-800">Commercial Bank</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-slate-500 mb-0.5">Branch</div>
                                <div className="font-bold text-slate-800">Pita Kotte Branch</div>
                            </div>
                        </div>

                        <Separator className="bg-teal-200" />

                        {/* Send Slip */}
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-teal-200 px-4 py-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 font-medium">Send payment slip via WhatsApp to</div>
                                <a
                                    href="https://wa.me/94766220170"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-[#024950] text-base hover:underline flex items-center gap-1"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    0766220170
                                </a>
                            </div>
                        </div>

                        {/* Admin note */}
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                Once we receive your payment slip, our admin or agent will review it
                                and mark your ad as a <span className="font-semibold">Promoted Ad</span>.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

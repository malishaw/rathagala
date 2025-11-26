"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceComparison } from "@/components/ui/price-comparison";
import { SimilarVehicleComparison } from "@/components/ui/similar-vehicle-comparison";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import { ArrowLeft, TrendingUp, BarChart3 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function VehicleAnalyticsPage() {
  const { id } = useParams();
  const adId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { data: ad, isLoading, isError } = useGetAdById({ adId: adId || "" });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#024950] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicle analytics...</p>
        </div>
      </div>
    );
  }

  if (isError || !ad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">Failed to load vehicle details</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Price upon request";
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#024950] via-[#036b75] to-[#024950] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="h-8 w-px bg-white/30" />
              <div>
                <h1 className="text-2xl font-bold">
                  {[ad.brand, ad.model, ad.manufacturedYear, ad.vehicleType]
                    .filter(Boolean)
                    .join(" ")}
                </h1>
                <p className="text-teal-100 text-sm mt-1">
                  Vehicle Analytics & Market Insights
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-teal-200" />
              <Badge className="bg-white/20 text-white border-0">
                Analytics
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-teal-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Price</p>
                  <p className="text-2xl font-bold text-[#024950]">
                    {(ad as any).discountPrice
                      ? formatPrice((ad as any).discountPrice)
                      : formatPrice(ad.price)}
                  </p>
                </div>
                <div className="p-3 bg-teal-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-[#024950]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {ad.vehicleType || "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Year</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {ad.manufacturedYear || "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Market Price Comparison */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-[#024950] to-teal-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Market Price Analysis</h2>
            </div>
            {ad.price && (
              <PriceComparison 
                adId={adId || ""} 
                currentPrice={(ad as any).discountPrice || ad.price}
              />
            )}
          </div>

          {/* Similar Vehicle Comparison */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Similar Vehicles Comparison</h2>
            </div>
            {ad.price && (
              <SimilarVehicleComparison
                adId={adId || ""}
                currentPrice={(ad as any).discountPrice || ad.price}
                currentVehicle={{
                  brand: ad.brand,
                  model: ad.model,
                  year: ad.manufacturedYear,
                  mileage: ad.mileage,
                  fuelType: ad.fuelType,
                  transmission: ad.transmission,
                }}
              />
            )}
          </div>
        </div>

        {/* Additional Info Section */}
        <Card className="mt-8 border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardHeader>
            <CardTitle className="text-[#024950] flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Market Price Analysis</h3>
                <p className="text-sm text-gray-600">
                  Compare this vehicle's price against the market average based on similar vehicles. 
                  This helps you understand if the price is competitive, above, or below market value.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Similar Vehicles Comparison</h3>
                <p className="text-sm text-gray-600">
                  View and compare this vehicle with other similar listings in the market. 
                  Compare prices, mileage, and specifications to make an informed decision.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


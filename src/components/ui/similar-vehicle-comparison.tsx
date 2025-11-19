"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, AlertCircle, ExternalLink, Gauge, Fuel, Calendar } from "lucide-react";
import { useGetSimilarVehicles } from "@/features/ads/api/use-get-similar-vehicles";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SimilarVehicleComparisonProps {
  adId: string;
  currentPrice: number | null;
  currentVehicle: {
    brand?: string | null;
    model?: string | null;
    year?: string | null;
    mileage?: number | null;
    fuelType?: string | null;
    transmission?: string | null;
  };
}

export function SimilarVehicleComparison({
  adId,
  currentPrice,
  currentVehicle,
}: SimilarVehicleComparisonProps) {
  const router = useRouter();
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const { data, isLoading, isError } = useGetSimilarVehicles({ adId, limit: 5 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#024950]">Compare with Similar Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-[#024950] border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-gray-600">Loading similar vehicles...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data || !data.vehicles || data.vehicles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#024950]">Compare with Similar Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-gray-500">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">
              No similar vehicles found for comparison at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedVehicle = data.vehicles[selectedVehicleIndex];
  const comparePrice = selectedVehicle.price;
  
  if (!currentPrice || !comparePrice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#024950]">Compare with Similar Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-gray-500">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Price information not available for comparison.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priceDifference = currentPrice - comparePrice;
  const priceDifferencePercent = Math.round((priceDifference / comparePrice) * 100);
  const isHigher = priceDifference > 0;
  const isLower = priceDifference < 0;
  const isEqual = priceDifference === 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#024950]">Compare with Similar Vehicles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Selector */}
        {data.vehicles.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.vehicles.map((vehicle, index) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicleIndex(index)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === selectedVehicleIndex
                    ? "bg-[#024950] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {vehicle.title}
              </button>
            ))}
          </div>
        )}

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Vehicle */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">This Vehicle</p>
              <p className="text-sm font-semibold text-[#024950]">
                {[currentVehicle.brand, currentVehicle.model, currentVehicle.year]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-lg font-bold text-[#024950]">
                  {formatPrice(currentPrice)}
                </p>
              </div>
              {currentVehicle.mileage && (
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Gauge className="w-3 h-3" />
                  <span>{currentVehicle.mileage.toLocaleString()} km</span>
                </div>
              )}
              {currentVehicle.fuelType && (
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Fuel className="w-3 h-3" />
                  <span>{currentVehicle.fuelType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compared Vehicle */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">Similar Vehicle</p>
              <p className="text-sm font-semibold text-gray-700">
                {selectedVehicle.title}
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-lg font-bold text-gray-700">
                  {formatPrice(comparePrice)}
                </p>
              </div>
              {selectedVehicle.mileage && (
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Gauge className="w-3 h-3" />
                  <span>{selectedVehicle.mileage.toLocaleString()} km</span>
                </div>
              )}
              {selectedVehicle.fuelType && (
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <Fuel className="w-3 h-3" />
                  <span>{selectedVehicle.fuelType}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Difference */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Price Difference</span>
            <div className="flex items-center space-x-2">
              {isHigher && (
                <>
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-lg font-bold text-orange-500">
                    +{formatPrice(Math.abs(priceDifference))}
                  </span>
                </>
              )}
              {isLower && (
                <>
                  <TrendingDown className="w-5 h-5 text-green-500" />
                  <span className="text-lg font-bold text-green-500">
                    -{formatPrice(Math.abs(priceDifference))}
                  </span>
                </>
              )}
              {isEqual && (
                <>
                  <Minus className="w-5 h-5 text-gray-500" />
                  <span className="text-lg font-bold text-gray-500">No difference</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-500">Percentage difference</span>
            <span
              className={`text-sm font-semibold ${
                isHigher
                  ? "text-orange-500"
                  : isLower
                  ? "text-green-500"
                  : "text-gray-500"
              }`}
            >
              {isHigher ? "+" : ""}
              {priceDifferencePercent}%
            </span>
          </div>

          {/* Info Message */}
          {isHigher && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700">
                This vehicle is priced <strong>{priceDifferencePercent}% higher</strong> than
                the similar vehicle shown.
              </p>
            </div>
          )}

          {isLower && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700">
                This vehicle is priced <strong>{Math.abs(priceDifferencePercent)}% lower</strong> than
                the similar vehicle shown. Great value!
              </p>
            </div>
          )}

          {isEqual && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                This vehicle is priced the same as the similar vehicle shown.
              </p>
            </div>
          )}

          {/* View Vehicle Button */}
          <Button
            variant="outline"
            className="w-full mt-4 border-[#024950] text-[#024950] hover:bg-[#024950] hover:text-white"
            onClick={() => router.push(`/${selectedVehicle.id}`)}
          >
            View Similar Vehicle
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


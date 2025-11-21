"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { useGetMarketPrice } from "@/features/ads/api/use-get-market-price";

interface PriceComparisonProps {
  adId: string;
  currentPrice: number | null;
}

export function PriceComparison({ adId, currentPrice }: PriceComparisonProps) {
  const { data, isLoading, isError } = useGetMarketPrice({ adId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#024950]">Market Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-[#024950] border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-gray-600">Analyzing market prices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data || !data.marketPrice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#024950]">Market Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-gray-500">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">
              {data?.message || "Unable to fetch market price data at this time."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { marketPrice, priceDifference, priceDifferencePercent, similarAdsCount } = data;
  const isHigher = (priceDifference ?? 0) > 0;
  const isLower = (priceDifference ?? 0) < 0;
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
        <CardTitle className="text-[#024950]">Market Price Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Current Price</p>
            <p className="text-xl font-bold text-[#024950]">
              {currentPrice ? formatPrice(currentPrice) : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Market Average</p>
            <p className="text-xl font-bold text-gray-700">
              {formatPrice(marketPrice)}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Price Difference</span>
            <div className="flex items-center space-x-2">
              {isHigher && (
                <>
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-lg font-bold text-orange-500">
                    +{formatPrice(Math.abs(priceDifference ?? 0))}
                  </span>
                </>
              )}
              {isLower && (
                <>
                  <TrendingDown className="w-5 h-5 text-green-500" />
                  <span className="text-lg font-bold text-green-500">
                    -{formatPrice(Math.abs(priceDifference ?? 0))}
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
          
          {priceDifferencePercent !== null && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {data.message ? (
                  <span>{data.message} ({similarAdsCount} vehicle{similarAdsCount !== 1 ? "s" : ""})</span>
                ) : (
                  <span>Based on {similarAdsCount} similar vehicle{similarAdsCount !== 1 ? "s" : ""}</span>
                )}
              </span>
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
          )}

          {isHigher && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700">
                This vehicle is priced <strong>{priceDifferencePercent}% higher</strong> than
                the market average. Consider reviewing the pricing or highlighting unique features.
              </p>
            </div>
          )}

          {isLower && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700">
                This vehicle is priced <strong>{Math.abs(priceDifferencePercent ?? 0)}% lower</strong> than
                the market average. This is a great deal!
              </p>
            </div>
          )}

          {isEqual && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                This vehicle is priced at the market average. Competitive pricing!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


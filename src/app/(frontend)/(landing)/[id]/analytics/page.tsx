"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceComparison } from "@/components/ui/price-comparison";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import { useGetMarketPrice } from "@/features/ads/api/use-get-market-price";
import { useGetSimilarVehicles } from "@/features/ads/api/use-get-similar-vehicles";
import { ArrowLeft, TrendingUp, BarChart3 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

export default function VehicleAnalyticsPage() {
  const { id } = useParams();
  const adId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { data: ad, isLoading, isError } = useGetAdById({ adId: adId || "" });
  const { data: marketData } = useGetMarketPrice({ adId: adId || "" });
  const { data: similarVehiclesData, isLoading: isLoadingSimilar } = useGetSimilarVehicles({ 
    adId: adId || "", 
    limit: 20 
  });

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
    if (!price) return "Price Negotiable";
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  // Prepare chart data: combine current vehicle with similar vehicles
  const prepareChartData = () => {
    if (!ad || !similarVehiclesData?.vehicles) return [];

    const currentPrice = (ad as any).discountPrice || ad.price;
    const currentYear = ad.manufacturedYear;

    // Start with current vehicle
    const chartData: Array<{ year: number; price: number; isCurrent: boolean; label: string }> = [];
    
    if (currentYear && currentPrice) {
      chartData.push({
        year: typeof currentYear === 'number' ? currentYear : parseInt(String(currentYear)),
        price: currentPrice,
        isCurrent: true,
        label: `${ad.brand || ''} ${ad.model || ''}`.trim() || 'Current Vehicle'
      });
    }

    // Add similar vehicles
    similarVehiclesData.vehicles.forEach((vehicle) => {
      if (vehicle.year && vehicle.price) {
        const year = typeof vehicle.year === 'string' ? parseInt(vehicle.year) : vehicle.year;
        if (!isNaN(year) && vehicle.price) {
          chartData.push({
            year: year,
            price: vehicle.price,
            isCurrent: false,
            label: vehicle.title || `${vehicle.brand || ''} ${vehicle.model || ''}`.trim()
          });
        }
      }
    });

    // Sort by year
    return chartData.sort((a, b) => a.year - b.year);
  };

  const chartData = prepareChartData();

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

        {/* Market Price Analysis Section */}
        <div className="space-y-8">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-[#024950] to-teal-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Market Price Analysis</h2>
          </div>

          {/* Market Price Comparison Card */}
          {ad.price && (
            <PriceComparison 
              adId={adId || ""} 
              currentPrice={(ad as any).discountPrice || ad.price}
            />
          )}

          {/* Price vs Year Chart for All Vehicles */}
          {ad.price && chartData.length > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-teal-50/30">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="text-[#024950] flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Price vs Year Analysis</span>
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#024950]"></div>
                      <span className="text-gray-600">Current Vehicle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-gray-600">Similar Vehicles</span>
                    </div>
                    {marketData?.marketPrice && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-teal-500"></div>
                        <span className="text-gray-600">Average Price</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSimilar ? (
                  <div className="flex items-center justify-center h-[450px]">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-[#024950] border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading vehicle data...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ChartContainer
                      config={{
                        price: {
                          label: "Price",
                          color: "#3b82f6",
                        },
                        currentPrice: {
                          label: "Current Vehicle",
                          color: "#024950",
                        },
                        averagePrice: {
                          label: "Average Price",
                          color: "#14b8a6",
                        },
                      }}
                      className="h-[450px] w-full"
                    >
                      <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#e5e7eb"
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="year" 
                          type="number"
                          scale="linear"
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          tickLine={{ stroke: "#9ca3af" }}
                          axisLine={{ stroke: "#d1d5db" }}
                          label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                        />
                        <YAxis 
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          tickLine={{ stroke: "#9ca3af" }}
                          axisLine={{ stroke: "#d1d5db" }}
                          tickFormatter={(value) => {
                            const millions = value / 1000000;
                            return `Rs. ${millions.toFixed(1)}M`;
                          }}
                          label={{ value: 'Price', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                        />
                        {marketData?.marketPrice && (
                          <ReferenceLine 
                            y={marketData.marketPrice} 
                            stroke="#14b8a6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            label={{ value: `Avg: ${formatPrice(marketData.marketPrice)}`, position: "right", fill: "#14b8a6", fontSize: 12 }}
                          />
                        )}
                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                                  <div className="mb-2">
                                    <p className="text-sm font-semibold text-gray-900">{data.label}</p>
                                    <p className="text-xs text-gray-500">Year: {label}</p>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`h-2.5 w-2.5 rounded-full ${data.isCurrent ? 'bg-[#024950]' : 'bg-blue-500'}`}
                                      />
                                      <span className="text-sm font-medium text-gray-700">Price</span>
                                    </div>
                                    <span className="font-mono text-sm font-semibold text-gray-900">
                                      {formatPrice(data.price)}
                                    </span>
                                  </div>
                                  {data.isCurrent && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <span className="text-xs text-[#024950] font-medium">Current Vehicle</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={payload.isCurrent ? 8 : 5}
                                fill={payload.isCurrent ? "#024950" : "#3b82f6"}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            );
                          }}
                          activeDot={{ r: 8, strokeWidth: 2, stroke: "#3b82f6" }}
                          name="price"
                        />
                      </LineChart>
                    </ChartContainer>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Vehicles:</span>
                          <span className="ml-2 font-semibold text-gray-900">{chartData.length}</span>
                        </div>
                        {marketData?.marketPrice && (
                          <div>
                            <span className="text-gray-600">Average Price:</span>
                            <span className="ml-2 font-semibold text-teal-600">{formatPrice(marketData.marketPrice)}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Year Range:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {chartData[0]?.year} - {chartData[chartData.length - 1]?.year}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
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
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Market Price Analysis</h3>
              <p className="text-sm text-gray-600">
                Compare this vehicle's price against the market average based on similar vehicles. 
                This helps you understand if the price is competitive, above, or below market value. 
                The chart provides a visual representation of how your vehicle's price compares to the market average.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


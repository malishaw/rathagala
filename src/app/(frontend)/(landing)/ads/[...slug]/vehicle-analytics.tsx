"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PriceComparison } from "@/components/ui/price-comparison";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import { useGetMarketPrice } from "@/features/ads/api/use-get-market-price";
import { useGetSimilarVehicles } from "@/features/ads/api/use-get-similar-vehicles";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts";

const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car", VAN: "Van", SUV_JEEP: "SUV / Jeep", MOTORCYCLE: "Motorcycle",
  CREW_CAB: "Crew Cab", PICKUP_DOUBLE_CAB: "Pickup / Double Cab", BUS: "Bus",
  LORRY: "Lorry", THREE_WHEEL: "Three Wheel", OTHER: "Other",
  TRACTOR: "Tractor", HEAVY_DUTY: "Heavy-Duty", BICYCLE: "Bicycle",
  AUTO_SERVICE: "Auto Service", RENTAL: "Rental", AUTO_PARTS: "Auto Parts",
  MAINTENANCE: "Maintenance", BOAT: "Boat",
};

export default function VehicleAnalyticsContent({ adId }: { adId: string }) {
  const router = useRouter();

  const { data: ad, isLoading, isError } = useGetAdById({ adId: adId || "" });
  const { data: marketData } = useGetMarketPrice({ adId: adId || "" });
  const { data: similarVehiclesData, isLoading: isLoadingSimilar } = useGetSimilarVehicles({ 
    adId: adId || "", 
    limit: 30 
  });

  const [minYear, setMinYear] = useState<string>("all");
  const [maxYear, setMaxYear] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#024950] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !ad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">Failed to load vehicle details</p>
          <Button onClick={() => router.back()} variant="outline" size="sm">
            Go Back
          </Button>
        </div>
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

  const rawType = (ad as any).type ?? ad.vehicleType;
  const typeLabel = rawType ? (vehicleTypeLabels[rawType as string] || rawType) : "N/A";

  // Prepare chart data
  const rawChartData = () => {
    if (!ad) return [];

    const currentPrice = (ad as any).discountPrice || ad.price;
    const currentYear = ad.manufacturedYear;
    const chartData: Array<{ year: number; price: number; isCurrent: boolean; label: string }> = [];
    
    if (currentYear && currentPrice) {
      chartData.push({
        year: typeof currentYear === 'number' ? currentYear : parseInt(String(currentYear)),
        price: currentPrice,
        isCurrent: true,
        label: 'This Vehicle'
      });
    }

    if (similarVehiclesData?.vehicles) {
      similarVehiclesData.vehicles.forEach((vehicle) => {
        if (vehicle.year && vehicle.price) {
          const year = typeof vehicle.year === 'string' ? parseInt(vehicle.year) : vehicle.year;
          if (!isNaN(year) && vehicle.price) {
            chartData.push({
              year: year,
              price: vehicle.price,
              isCurrent: false,
              label: vehicle.title || 'Market Vehicle'
            });
          }
        }
      });
    }

    return chartData.sort((a, b) => a.year - b.year);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedRawData = useMemo(() => rawChartData(), [ad, similarVehiclesData]);

  const availableYears = Array.from(new Set(memoizedRawData.map(d => d.year))).sort((a, b) => a - b);

  const chartData = memoizedRawData.filter(d => {
    if (minYear !== "all" && d.year < parseInt(minYear)) return false;
    if (maxYear !== "all" && d.year > parseInt(maxYear)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-[#024950] text-white">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-4 w-px bg-white/30 mr-4" />
          <h1 className="text-sm font-medium truncate">
            {ad.brand} {ad.model} Price Analyse
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Key Info */}
        <div className="space-y-3">
          {/* Price card - full width on mobile */}
          <div className="bg-white border border-gray-200 rounded p-4 text-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Current Price</div>
            <div className="text-xl font-bold text-[#024950] break-words">
              {(ad as any).discountPrice ? formatPrice((ad as any).discountPrice) : formatPrice(ad.price)}
            </div>
          </div>
          {/* Vehicle Type & Year - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded p-4 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Vehicle Type</div>
              <div className="text-sm font-medium text-gray-800 mt-1">{typeLabel}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Year</div>
              <div className="text-sm font-medium text-gray-800 mt-1">{ad.manufacturedYear || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Evaluation component */}
        {ad.price && (
          <div className="bg-white border border-gray-200 rounded p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Market Evaluation</h2>
            <PriceComparison 
              adId={adId || ""} 
              currentPrice={(ad as any).discountPrice || ad.price}
            />
          </div>
        )}

        {/* Chart */}
        {ad.price && chartData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{ad.brand} {ad.model} Market Trend</h2>
                <p className="text-xs text-gray-400 mt-1">Price variation across manufacturing years</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={minYear} onValueChange={setMinYear}>
                  <SelectTrigger className="w-[100px] h-8 text-xs border-gray-200 shadow-none">
                    <SelectValue placeholder="Min Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {availableYears.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-gray-400 text-xs">to</span>
                <Select value={maxYear} onValueChange={setMaxYear}>
                  <SelectTrigger className="w-[100px] h-8 text-xs border-gray-200 shadow-none">
                    <SelectValue placeholder="Max Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {availableYears.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingSimilar ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="animate-spin w-6 h-6 border-2 border-[#024950] border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="h-[350px]">
                <ChartContainer
                  config={{
                    price: {
                      label: "Market Price",
                      color: "#024950",
                    },
                    averagePrice: {
                      label: "Average",
                      color: "#9ca3af",
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#f3f4f6"
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="year" 
                        type="number"
                        scale="linear"
                        domain={['dataMin - 1', 'dataMax + 1']}
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                      />
                      <YAxis 
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tickFormatter={(value) => `Rs.${(value / 1000000).toFixed(1)}M`}
                      />
                      {marketData?.marketPrice && (
                        <ReferenceLine 
                          y={marketData.marketPrice} 
                          stroke="#9ca3af" 
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          label={{ value: 'Market Avg', position: "insideTopLeft", fill: "#9ca3af", fontSize: 10 }}
                        />
                      )}
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-gray-200 p-3 rounded shadow-sm">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Year: {label}
                                </div>
                                <div className="text-sm font-bold text-[#024950]">
                                  {formatPrice(data.price)}
                                </div>
                                {data.isCurrent && (
                                  <div className="mt-2 text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded inline-block border border-teal-100">
                                    This Vehicle
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
                        stroke="#024950"
                        strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.isCurrent) {
                            return (
                              <circle
                                key={`dot-${cx}-${cy}`}
                                cx={cx}
                                cy={cy}
                                r={6}
                                fill="#024950"
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            );
                          }
                          return (
                            <circle
                              key={`dot-${cx}-${cy}`}
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill="#fff"
                              stroke="#024950"
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 6, fill: "#024950", stroke: "#fff", strokeWidth: 2 }}
                        name="price"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

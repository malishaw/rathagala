/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import {
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ComparisonPage() {
  const router = useRouter();

  // Independent filters for Price Trend Analysis chart
  const [trendFilterYear, setTrendFilterYear] = useState<string>("");
  const [trendFilterBrand1, setTrendFilterBrand1] = useState<string>("");
  const [trendFilterModel1, setTrendFilterModel1] = useState<string>("");
  const [trendFilterMfgYear1, setTrendFilterMfgYear1] = useState<string>("");
  const [trendFilterBrand2, setTrendFilterBrand2] = useState<string>("");
  const [trendFilterModel2, setTrendFilterModel2] = useState<string>("");
  const [trendFilterMfgYear2, setTrendFilterMfgYear2] = useState<string>("");

  // Fetch all vehicles for price trend analysis (independent)
  const { data: allVehiclesForTrendAnalysis, isLoading } = useGetAds({
    page: 1,
    limit: 10000,
  });

  // Use only active (published) and non-rejected ads for analysis
  const trendAds = useMemo(() => {
    return (allVehiclesForTrendAnalysis?.ads || []).filter((ad: any) => ad?.status === "ACTIVE");
  }, [allVehiclesForTrendAnalysis]);

  const availableYears = useMemo(() => {
    const s = new Set<number>();
    const pushYears = (ads: any[] = []) => {
      ads.forEach((ad) => {
        if (ad?.createdAt) s.add(new Date(ad.createdAt).getFullYear());
      });
    };
    pushYears(trendAds);
    return Array.from(s).sort((a, b) => b - a);
  }, [trendAds]);

  // ... (rest of the hooks) ...

  // Get available brands for trend filter
  const availableTrendBrands = useMemo(() => {
    if (!trendAds) return [];
    const year = trendFilterYear ? parseInt(trendFilterYear) : null;
    const brands = new Set<string>();
    trendAds.forEach((ad: any) => {
      if (ad?.brand) {
        if (year) {
          if (ad?.createdAt && new Date(ad.createdAt).getFullYear() === year) {
            brands.add(ad.brand);
          }
        } else {
          brands.add(ad.brand);
        }
      }
    });
    return Array.from(brands).sort();
  }, [trendFilterYear, trendAds]);

  // Get available models for Brand 1
  const availableTrendModels1 = useMemo(() => {
    if (!trendAds || !trendFilterBrand1) return [];
    const year = trendFilterYear ? parseInt(trendFilterYear) : null;
    const models = new Set<string>();
    trendAds.forEach((ad: any) => {
      if (ad?.model && ad?.brand === trendFilterBrand1) {
        if (year) {
          if (ad?.createdAt && new Date(ad.createdAt).getFullYear() === year) {
            models.add(ad.model);
          }
        } else {
          models.add(ad.model);
        }
      }
    });
    return Array.from(models).sort();
  }, [trendFilterYear, trendFilterBrand1, trendAds]);

  // Get available models for Brand 2
  const availableTrendModels2 = useMemo(() => {
    if (!trendAds || !trendFilterBrand2) return [];
    const year = trendFilterYear ? parseInt(trendFilterYear) : null;
    const models = new Set<string>();
    trendAds.forEach((ad: any) => {
      if (ad?.model && ad?.brand === trendFilterBrand2) {
        if (year) {
          if (ad?.createdAt && new Date(ad.createdAt).getFullYear() === year) {
            models.add(ad.model);
          }
        } else {
          models.add(ad.model);
        }
      }
    });
    return Array.from(models).sort();
  }, [trendFilterYear, trendFilterBrand2, trendAds]);

  // Get available manufacture years for brand/model 1
  const availableTrendMfgYears1 = useMemo(() => {
    if (!trendAds || !trendFilterBrand1 || !trendFilterModel1) return [];
    const year = trendFilterYear ? parseInt(trendFilterYear) : null;
    const mfgYears = new Set<number>();
    trendAds.forEach((ad: any) => {
      if (ad?.model === trendFilterModel1 && ad?.brand === trendFilterBrand1 && ad?.manufacturedYear) {
        if (year) {
          if (ad?.createdAt && new Date(ad.createdAt).getFullYear() === year) {
            mfgYears.add(parseInt(ad.manufacturedYear));
          }
        } else {
          mfgYears.add(parseInt(ad.manufacturedYear));
        }
      }
    });
    return Array.from(mfgYears).sort((a, b) => b - a);
  }, [trendFilterYear, trendFilterBrand1, trendFilterModel1, trendAds]);

  // Get available manufacture years for brand/model 2
  const availableTrendMfgYears2 = useMemo(() => {
    if (!trendAds || !trendFilterBrand2 || !trendFilterModel2) return [];
    const year = trendFilterYear ? parseInt(trendFilterYear) : null;
    const mfgYears = new Set<number>();
    trendAds.forEach((ad: any) => {
      if (ad?.model === trendFilterModel2 && ad?.brand === trendFilterBrand2 && ad?.manufacturedYear) {
        if (year) {
          if (ad?.createdAt && new Date(ad.createdAt).getFullYear() === year) {
            mfgYears.add(parseInt(ad.manufacturedYear));
          }
        } else {
          mfgYears.add(parseInt(ad.manufacturedYear));
        }
      }
    });
    return Array.from(mfgYears).sort((a, b) => b - a);
  }, [trendFilterYear, trendFilterBrand2, trendFilterModel2, trendAds]);

  const priceTrendData = useMemo(() => {
    if (!trendAds || !trendFilterYear) return [];

    const hasSelection1 = trendFilterBrand1 && trendFilterModel1;
    const hasSelection2 = trendFilterBrand2 && trendFilterModel2;

    if (!hasSelection1 && !hasSelection2) return [];

    const year = parseInt(trendFilterYear);
    if (isNaN(year)) return [];

    const startMonth = year * 100 + 1; // Jan of selected year
    const endMonth = year * 100 + 12; // Dec of selected year

    const monthToDate = (ym: number) => {
      const y = Math.floor(ym / 100);
      const m = ym % 100;
      return new Date(y, m - 1, 1);
    };

    const formatMonthLabel = (ym: number) => {
      return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(monthToDate(ym));
    };

    const incrementMonth = (ym: number) => {
      let y = Math.floor(ym / 100);
      let m = ym % 100;
      if (m === 12) {
        y += 1;
        m = 1;
      } else {
        m += 1;
      }
      return y * 100 + m;
    };

    const calculateMonthlyAverages = (ads: any[]) => {
      const monthMap = new Map<number, { total: number; count: number }>();

      ads.forEach((ad: any) => {
        const price = ad.price === null || ad.price === undefined ? NaN : Number(ad.price);
        if (Number.isNaN(price) || !ad.createdAt) return;
        const d = new Date(ad.createdAt);
        const ym = d.getFullYear() * 100 + (d.getMonth() + 1);
        if (ym < startMonth || ym > endMonth) return;

        const existing = monthMap.get(ym) || { total: 0, count: 0 };
        monthMap.set(ym, { total: existing.total + price, count: existing.count + 1 });
      });

      const averages = new Map<number, number>();
      monthMap.forEach((value, month) => {
        averages.set(month, value.total / value.count);
      });

      return averages;
    };

    // Filter for brand/model 1
    const model1Ads = trendAds.filter((ad: any) => {
      if (!ad?.createdAt) return false;
      const adYear = new Date(ad.createdAt).getFullYear();
      if (adYear !== year) return false;
      if (ad?.brand !== trendFilterBrand1 || ad?.model !== trendFilterModel1) return false;
      if (trendFilterMfgYear1 && parseInt(ad?.manufacturedYear) !== parseInt(trendFilterMfgYear1)) return false;
      return true;
    });

    // Filter for brand/model 2
    const model2Ads = trendAds.filter((ad: any) => {
      if (!ad?.createdAt) return false;
      const adYear = new Date(ad.createdAt).getFullYear();
      if (adYear !== year) return false;
      if (ad?.brand !== trendFilterBrand2 || ad?.model !== trendFilterModel2) return false;
      if (trendFilterMfgYear2 && parseInt(ad?.manufacturedYear) !== parseInt(trendFilterMfgYear2)) return false;
      return true;
    });

    if (model1Ads.length === 0 && model2Ads.length === 0) return [];

    const averages1 = calculateMonthlyAverages(model1Ads);
    const averages2 = calculateMonthlyAverages(model2Ads);

    // Create data points for all months in range
    const dataPoints: any[] = [];
    let cur = startMonth;
    while (cur <= endMonth) {
      const data: any = {
        month: formatMonthLabel(cur),
        monthNum: cur,
      };

      const price1 = averages1.get(cur);
      const price2 = averages2.get(cur);

      if (price1) data.avgPrice1 = price1;
      if (price2) data.avgPrice2 = price2;

      // Only add if at least one vehicle has data
      if (price1 || price2) {
        dataPoints.push(data);
      }

      cur = incrementMonth(cur);
    }

    return dataPoints;
  }, [trendAds, trendFilterYear, trendFilterBrand1, trendFilterModel1, trendFilterMfgYear1, trendFilterBrand2, trendFilterModel2, trendFilterMfgYear2]);

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Price Negotiable";
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#024950] to-teal-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="w-8 h-8" />
                Price Trend Analysis
              </h1>
              <p className="text-teal-100">
                Analyze price trends over time for different vehicle models
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Price Trend Analysis */}
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-[#024950] to-teal-700 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Analyze Trends
            </CardTitle>
            <p className="text-sm text-teal-100 mt-2">
              Filter by brand, model, and manufacture year to see historical price data from all posted ads.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-6">
                {/* Year Filter Skeleton */}
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <div className="h-4 w-24 bg-gray-100/80 rounded mb-2 animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-100/50 rounded animate-pulse"></div>
                </div>

                {/* Two Column Layout Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  {/* First Comparison Group */}
                  <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="h-4 w-32 bg-gray-200/50 rounded mb-4 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[1, 2, 3].map(i => (
                        <div key={i}>
                          <div className="h-4 w-16 bg-gray-100/80 rounded mb-1.5 animate-pulse"></div>
                          <div className="h-10 w-full bg-gray-100/50 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Second Comparison Group */}
                  <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                    <div className="h-4 w-32 bg-gray-200/50 rounded mb-4 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {[1, 2, 3].map(i => (
                        <div key={i}>
                          <div className="h-4 w-16 bg-gray-100/80 rounded mb-1.5 animate-pulse"></div>
                          <div className="h-10 w-full bg-gray-100/50 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chart Skeleton */}
                <div className="h-[400px] w-full bg-gray-50/30 rounded-lg border border-gray-100/50 animate-pulse flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-gray-200/50" />
                </div>
              </div>
            ) : (
              <>
                {/* Trend Filters */}
                <div className="mb-6 space-y-3">
                  {/* Year Filter */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="max-w-xs">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Analyse Year</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[#024950] focus:border-transparent outline-none transition-all"
                        value={trendFilterYear}
                        onChange={(e) => {
                          setTrendFilterYear(e.target.value);
                          setTrendFilterBrand1("");
                          setTrendFilterModel1("");
                          setTrendFilterMfgYear1("");
                          setTrendFilterBrand2("");
                          setTrendFilterModel2("");
                          setTrendFilterMfgYear2("");
                        }}
                      >
                        <option value="">Select Year</option>
                        {availableYears.map((y) => (
                          <option key={y} value={String(y)}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Two Column Layout for Selections - Forced 2 columns even on mobile */}
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {/* First Comparison Group */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-blue-900">First Selection</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Brand 1 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[#024950] outline-none transition-all"
                            value={trendFilterBrand1}
                            onChange={(e) => {
                              setTrendFilterBrand1(e.target.value);
                              setTrendFilterModel1("");
                              setTrendFilterMfgYear1("");
                            }}
                            disabled={!trendFilterYear}
                          >
                            <option value="">Select</option>
                            {availableTrendBrands.map((brand) => (
                              <option key={brand} value={brand}>
                                {brand}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Model 1 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[#024950] outline-none transition-all"
                            value={trendFilterModel1}
                            onChange={(e) => {
                              setTrendFilterModel1(e.target.value);
                              setTrendFilterMfgYear1("");
                            }}
                            disabled={!trendFilterYear || !trendFilterBrand1}
                          >
                            <option value="">Select</option>
                            {availableTrendModels1.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mfg Year 1 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacture Year</label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-[#024950] outline-none transition-all"
                            value={trendFilterMfgYear1}
                            onChange={(e) => setTrendFilterMfgYear1(e.target.value)}
                            disabled={!trendFilterYear || !trendFilterBrand1 || !trendFilterModel1}
                          >
                            <option value="">All</option>
                            {availableTrendMfgYears1.map((year) => (
                              <option key={year} value={String(year)}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Second Comparison Group */}
                    <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-teal-900">Second Selection</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Brand 2 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-teal-600 outline-none transition-all"
                            value={trendFilterBrand2}
                            onChange={(e) => {
                              setTrendFilterBrand2(e.target.value);
                              setTrendFilterModel2("");
                              setTrendFilterMfgYear2("");
                            }}
                            disabled={!trendFilterYear}
                          >
                            <option value="">Select</option>
                            {availableTrendBrands.map((brand) => (
                              <option key={brand} value={brand}>
                                {brand}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Model 2 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-teal-600 outline-none transition-all"
                            value={trendFilterModel2}
                            onChange={(e) => {
                              setTrendFilterModel2(e.target.value);
                              setTrendFilterMfgYear2("");
                            }}
                            disabled={!trendFilterYear || !trendFilterBrand2}
                          >
                            <option value="">Select</option>
                            {availableTrendModels2.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mfg Year 2 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacture Year</label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-teal-600 outline-none transition-all"
                            value={trendFilterMfgYear2}
                            onChange={(e) => setTrendFilterMfgYear2(e.target.value)}
                            disabled={!trendFilterYear || !trendFilterBrand2 || !trendFilterModel2}
                          >
                            <option value="">All</option>
                            {availableTrendMfgYears2.map((year) => (
                              <option key={year} value={String(year)}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                {priceTrendData.length > 0 ? (
                  <>
                    <div className="w-full overflow-x-auto pb-4">
                      <div className="min-w-[800px]">
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={priceTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                              dataKey="month"
                              stroke="#666"
                              minTickGap={30}
                              style={{ fontSize: "14px", fontWeight: 500 }}
                              label={{ value: "Posted (Month)", position: "insideBottom", offset: -10, fontSize: 14, fontWeight: 600 }}
                            />
                            <YAxis
                              stroke="#666"
                              style={{ fontSize: "14px", fontWeight: 500 }}
                              tickFormatter={(value) =>
                                value >= 1000000
                                  ? `Rs. ${(value / 1000000).toFixed(1)}M`
                                  : `Rs. ${(value / 1000).toFixed(0)}K`
                              }
                              label={{ value: "Average Price", angle: -90, position: "insideLeft", fontSize: 14, fontWeight: 600 }}
                            />
                            <Tooltip
                              formatter={(value: any) => [
                                formatPrice(value),
                                value === undefined ? "N/A" : "Avg Price",
                              ]}
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #024950",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                paddingTop: "30px",
                                fontSize: "14px",
                                fontWeight: 500,
                              }}
                            />
                            {trendFilterBrand1 && trendFilterModel1 && (
                              <Line
                                type="monotone"
                                dataKey="avgPrice1"
                                stroke="#024950"
                                strokeWidth={2}
                                name={`${trendFilterBrand1} ${trendFilterModel1}`}
                                dot={{ fill: "#024950", r: 4 }}
                                activeDot={{ r: 6 }}
                                connectNulls
                              />
                            )}
                            {trendFilterBrand2 && trendFilterModel2 && (
                              <Line
                                type="monotone"
                                dataKey="avgPrice2"
                                stroke="#14b8a6"
                                strokeWidth={2}
                                name={`${trendFilterBrand2} ${trendFilterModel2}`}
                                dot={{ fill: "#14b8a6", r: 4 }}
                                activeDot={{ r: 6 }}
                                connectNulls
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="mt-6 p-4 bg-[#024950]/5 rounded-lg border border-[#024950]/20">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">Data Points</div>
                          <div className="text-2xl font-bold text-[#024950]">
                            {priceTrendData.length} months
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">{trendFilterBrand1} {trendFilterModel1} Listings</div>
                          <div className="text-2xl font-bold text-[#024950]">
                            {
                              allVehiclesForTrendAnalysis?.ads?.filter((ad: any) => {
                                if (!ad?.createdAt) return false;
                                const adYear = new Date(ad.createdAt).getFullYear();
                                if (adYear !== parseInt(trendFilterYear)) return false;
                                if (ad?.brand !== trendFilterBrand1 || ad?.model !== trendFilterModel1) return false;
                                if (trendFilterMfgYear1 && parseInt(ad?.manufacturedYear) !== parseInt(trendFilterMfgYear1)) return false;
                                return true;
                              }).length || 0
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">{trendFilterBrand2} {trendFilterModel2} Listings</div>
                          <div className="text-2xl font-bold text-[#024950]">
                            {
                              allVehiclesForTrendAnalysis?.ads?.filter((ad: any) => {
                                if (!ad?.createdAt) return false;
                                const adYear = new Date(ad.createdAt).getFullYear();
                                if (adYear !== parseInt(trendFilterYear)) return false;
                                if (ad?.brand !== trendFilterBrand2 || ad?.model !== trendFilterModel2) return false;
                                if (trendFilterMfgYear2 && parseInt(ad?.manufacturedYear) !== parseInt(trendFilterMfgYear2)) return false;
                                return true;
                              }).length || 0
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      {!trendFilterYear
                        ? "Select a year to view price trends"
                        : (!trendFilterBrand1 || !trendFilterModel1) && (!trendFilterBrand2 || !trendFilterModel2)
                          ? "Select at least one vehicle (Brand & Model) to view trends"
                          : "No data available for the selected filters"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

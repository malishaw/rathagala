/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
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

export default function MarketTrendsPage() {
  const router = useRouter();

  // Independent filters for Price Trend Analysis chart
  const [trendFilterYear, setTrendFilterYear] = useState<string>("");
  const [trendFilterBrand1, setTrendFilterBrand1] = useState<string>("");
  const [trendFilterModel1, setTrendFilterModel1] = useState<string>("");
  const [trendFilterMfgYear1, setTrendFilterMfgYear1] = useState<string>("");
  const [trendFilterBrand2, setTrendFilterBrand2] = useState<string>("");
  const [trendFilterModel2, setTrendFilterModel2] = useState<string>("");
  const [trendFilterMfgYear2, setTrendFilterMfgYear2] = useState<string>("");

  // Search state for dropdowns
  const [brandSearch1, setBrandSearch1] = useState("");
  const [modelSearch1, setModelSearch1] = useState("");
  const [brandSearch2, setBrandSearch2] = useState("");
  const [modelSearch2, setModelSearch2] = useState("");

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

  // Auto-select initial filters for better UX
  useEffect(() => {
    if (availableYears.length > 0 && !trendFilterYear) {
      setTrendFilterYear(String(availableYears[0]));
    }
  }, [availableYears, trendFilterYear]);



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

  useEffect(() => {
    if (availableTrendBrands.length > 0 && !trendFilterBrand1 && !trendFilterBrand2) {
      setTrendFilterBrand1(availableTrendBrands[0]);
    }
  }, [availableTrendBrands, trendFilterBrand1, trendFilterBrand2]);

  useEffect(() => {
    if (availableTrendModels1.length > 0 && trendFilterBrand1 && !trendFilterModel1) {
      setTrendFilterModel1(availableTrendModels1[0]);
    }
  }, [availableTrendModels1, trendFilterBrand1, trendFilterModel1]);

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

  // Filter brands based on search input (Selection 1)
  const filteredTrendBrands1 = useMemo(() => {
    if (!brandSearch1) return availableTrendBrands;
    return availableTrendBrands.filter(b =>
      b.toLowerCase().includes(brandSearch1.toLowerCase())
    );
  }, [brandSearch1, availableTrendBrands]);

  // Filter models based on search input (Selection 1)
  const filteredTrendModels1 = useMemo(() => {
    if (!modelSearch1) return availableTrendModels1;
    return availableTrendModels1.filter(m =>
      m.toLowerCase().includes(modelSearch1.toLowerCase())
    );
  }, [modelSearch1, availableTrendModels1]);

  // Filter brands based on search input (Selection 2)
  const filteredTrendBrands2 = useMemo(() => {
    if (!brandSearch2) return availableTrendBrands;
    return availableTrendBrands.filter(b =>
      b.toLowerCase().includes(brandSearch2.toLowerCase())
    );
  }, [brandSearch2, availableTrendBrands]);

  // Filter models based on search input (Selection 2)
  const filteredTrendModels2 = useMemo(() => {
    if (!modelSearch2) return availableTrendModels2;
    return availableTrendModels2.filter(m =>
      m.toLowerCase().includes(modelSearch2.toLowerCase())
    );
  }, [modelSearch2, availableTrendModels2]);

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Market Trends
          </h1>
          <p className="text-gray-500 mt-2">
            View historical price trends for different vehicle models.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Market Trends */}
        <div className="mb-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Analysis Filters
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a year and vehicle models to compare historical price data.
            </p>
          </div>
          <div>
            {isLoading ? (
              <div className="space-y-8">
                {/* Year Filter Skeleton */}
                <div>
                  <div className="h-4 w-24 bg-gray-100 rounded mb-2 animate-pulse"></div>
                  <div className="h-10 w-64 bg-gray-50 rounded animate-pulse"></div>
                </div>

                {/* Two Column Layout Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* First Comparison Group */}
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i}>
                          <div className="h-4 w-16 bg-gray-100 rounded mb-1.5 animate-pulse"></div>
                          <div className="h-10 w-full bg-gray-50 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Second Comparison Group */}
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i}>
                          <div className="h-4 w-16 bg-gray-100 rounded mb-1.5 animate-pulse"></div>
                          <div className="h-10 w-full bg-gray-50 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chart Skeleton */}
                <div className="h-[400px] w-full bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
                </div>
              </div>
            ) : (
              <>
                {/* Trend Filters */}
                <div className="mb-10 space-y-8 border-b border-gray-100 pb-10">
                  {/* Year Filter */}
                  <div className="flex justify-center">
                    <div className="w-full max-w-xs text-center">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Year</label>
                      <select
                        className="w-full border border-gray-200 rounded-lg px-3 h-10 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all bg-white hover:bg-gray-50 cursor-pointer"
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

                  {/* Two Column Layout for Selections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* First Comparison Group */}
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                        <span className="text-sm font-semibold text-gray-900">First Vehicle</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Brand 1 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                          <Select
                            value={trendFilterBrand1}
                            onValueChange={(value) => {
                              setTrendFilterBrand1(value);
                              setBrandSearch1("");
                              setTrendFilterModel1("");
                              setTrendFilterMfgYear1("");
                            }}
                            disabled={!trendFilterYear}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-62.5">
                              <div className="p-2 border-b sticky top-0 bg-white z-10">
                                <Input
                                  autoFocus
                                  placeholder="Search brands..."
                                  value={brandSearch1}
                                  onChange={(e) => setBrandSearch1(e.target.value)}
                                  className="h-8 text-sm"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {filteredTrendBrands1.map((brand) => (
                                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                              ))}
                              {filteredTrendBrands1.length === 0 && (
                                <div className="p-2 text-sm text-gray-500 text-center">No brands found</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Model 1 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                          <Select
                            value={trendFilterModel1}
                            onValueChange={(value) => {
                              setTrendFilterModel1(value);
                              setModelSearch1("");
                              setTrendFilterMfgYear1("");
                            }}
                            disabled={!trendFilterYear || !trendFilterBrand1}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-62.5">
                              <div className="p-2 border-b sticky top-0 bg-white z-10">
                                <Input
                                  autoFocus
                                  placeholder="Search models..."
                                  value={modelSearch1}
                                  onChange={(e) => setModelSearch1(e.target.value)}
                                  className="h-8 text-sm"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {filteredTrendModels1.map((model) => (
                                <SelectItem key={model} value={model}>{model}</SelectItem>
                              ))}
                              {filteredTrendModels1.length === 0 && (
                                <div className="p-2 text-sm text-gray-500 text-center">No models found</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Mfg Year 1 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacture Year</label>
                          <Select
                            value={trendFilterMfgYear1 || "all"}
                            onValueChange={(e) => setTrendFilterMfgYear1(e === "all" ? "" : e)}
                            disabled={!trendFilterYear || !trendFilterBrand1 || !trendFilterModel1}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              {availableTrendMfgYears1.map((year) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Second Comparison Group */}
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                        <span className="text-sm font-semibold text-gray-900">Second Vehicle</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Brand 2 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                          <Select
                            value={trendFilterBrand2}
                            onValueChange={(value) => {
                              setTrendFilterBrand2(value);
                              setBrandSearch2("");
                              setTrendFilterModel2("");
                              setTrendFilterMfgYear2("");
                            }}
                            disabled={!trendFilterYear}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-62.5">
                              <div className="p-2 border-b sticky top-0 bg-white z-10">
                                <Input
                                  autoFocus
                                  placeholder="Search brands..."
                                  value={brandSearch2}
                                  onChange={(e) => setBrandSearch2(e.target.value)}
                                  className="h-8 text-sm"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {filteredTrendBrands2.map((brand) => (
                                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                              ))}
                              {filteredTrendBrands2.length === 0 && (
                                <div className="p-2 text-sm text-gray-500 text-center">No brands found</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Model 2 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                          <Select
                            value={trendFilterModel2}
                            onValueChange={(value) => {
                              setTrendFilterModel2(value);
                              setModelSearch2("");
                              setTrendFilterMfgYear2("");
                            }}
                            disabled={!trendFilterYear || !trendFilterBrand2}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="max-h-62.5">
                              <div className="p-2 border-b sticky top-0 bg-white z-10">
                                <Input
                                  autoFocus
                                  placeholder="Search models..."
                                  value={modelSearch2}
                                  onChange={(e) => setModelSearch2(e.target.value)}
                                  className="h-8 text-sm"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {filteredTrendModels2.map((model) => (
                                <SelectItem key={model} value={model}>{model}</SelectItem>
                              ))}
                              {filteredTrendModels2.length === 0 && (
                                <div className="p-2 text-sm text-gray-500 text-center">No models found</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Mfg Year 2 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacture Year</label>
                          <Select
                            value={trendFilterMfgYear2 || "all"}
                            onValueChange={(e) => setTrendFilterMfgYear2(e === "all" ? "" : e)}
                            disabled={!trendFilterYear || !trendFilterBrand2 || !trendFilterModel2}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              {availableTrendMfgYears2.map((year) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                    <div className="mt-8 pt-8 border-t border-gray-100">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">Data Points</div>
                          <div className="text-3xl font-bold tracking-tight text-gray-900">
                            {priceTrendData.length} <span className="text-lg font-normal text-gray-400">months</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">{trendFilterBrand1} {trendFilterModel1 || "First Selection"} Listings</div>
                          <div className="text-3xl font-bold tracking-tight text-gray-900">
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
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                          <div className="text-sm font-medium text-gray-500 mb-2">{trendFilterBrand2} {trendFilterModel2 || "Second Selection"} Listings</div>
                          <div className="text-3xl font-bold tracking-tight text-gray-900">
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
                  <div className="text-center py-16 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      {!trendFilterYear
                        ? "Select an analysis year to view historical price trends for different vehicles."
                        : (!trendFilterBrand1 || !trendFilterModel1) && (!trendFilterBrand2 || !trendFilterModel2)
                          ? "Select at least one vehicle (Brand & Model) to generate the trend analysis chart."
                          : "No historical data available for the selected filters."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

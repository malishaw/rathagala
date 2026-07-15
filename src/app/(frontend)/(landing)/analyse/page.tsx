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
    limit: 1000,
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

  // Auto-select initial filters removed so manual clear works
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
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-200/50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">
            Market Trends
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base font-medium">
            View historical price trends for different vehicle models.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        
        {/* Compact Filters Bar */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm ring-1 ring-gray-900/5 mb-6">
          {isLoading ? (
            <div className="h-9 w-full bg-gray-50 rounded animate-pulse"></div>
          ) : (
          <div className="flex flex-col gap-3 w-full">

              {/* Row 1 – Timeframe (top, centered on desktop) */}
              <div className="w-full lg:w-48 lg:mx-auto flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-0.5">Timeframe</span>
                <Select
                  value={trendFilterYear}
                  onValueChange={(value) => {
                    setTrendFilterYear(value);
                    setTrendFilterBrand1("");
                    setTrendFilterModel1("");
                    setTrendFilterMfgYear1("");
                    setTrendFilterBrand2("");
                    setTrendFilterModel2("");
                    setTrendFilterMfgYear2("");
                  }}
                >
                  <SelectTrigger className="h-9 text-xs border-gray-200">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2 – Vehicle filters */}
              <div className="flex flex-col lg:flex-row lg:items-end gap-3 w-full">

              {/* Vehicle 1 */}
              <div className="w-full lg:flex-1 flex flex-col">
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1 ml-0.5">Primary Vehicle</span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Brand 1 */}
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
                    <SelectTrigger className="h-9 text-xs border-gray-200">
                      <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent className="max-h-62.5">
                      <div className="p-2 border-b sticky top-0 bg-white z-10">
                        <Input
                          autoFocus
                          placeholder="Search brands..."
                          value={brandSearch1}
                          onChange={(e) => setBrandSearch1(e.target.value)}
                          className="h-8 text-xs"
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredTrendBrands1.map((brand) => (
                        <SelectItem key={brand} value={brand} className="text-xs">{brand}</SelectItem>
                      ))}
                      {filteredTrendBrands1.length === 0 && (
                        <div className="p-2 text-xs text-gray-500 text-center">No brands</div>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Model 1 */}
                  <Select
                    value={trendFilterModel1}
                    onValueChange={(value) => {
                      setTrendFilterModel1(value);
                      setModelSearch1("");
                      setTrendFilterMfgYear1("");
                    }}
                    disabled={!trendFilterYear || !trendFilterBrand1}
                  >
                    <SelectTrigger className="h-9 text-xs border-gray-200">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-62.5">
                      <div className="p-2 border-b sticky top-0 bg-white z-10">
                        <Input
                          autoFocus
                          placeholder="Search models..."
                          value={modelSearch1}
                          onChange={(e) => setModelSearch1(e.target.value)}
                          className="h-8 text-xs"
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredTrendModels1.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                      {filteredTrendModels1.length === 0 && (
                        <div className="p-2 text-xs text-gray-500 text-center">No models</div>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Mfg Year 1 */}
                  <Select
                    value={trendFilterMfgYear1 || "all"}
                    onValueChange={(e) => setTrendFilterMfgYear1(e === "all" ? "" : e)}
                    disabled={!trendFilterYear || !trendFilterBrand1 || !trendFilterModel1}
                  >
                    <SelectTrigger className="h-9 text-xs border-gray-200">
                      <SelectValue placeholder="Mfg Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Years</SelectItem>
                      {availableTrendMfgYears1.map((year) => (
                        <SelectItem key={year} value={String(year)} className="text-xs">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="hidden lg:block w-px h-9 bg-gray-200 mb-0.5"></div>

              {/* Vehicle 2 */}
              <div className="w-full lg:flex-1 flex flex-col">
                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider mb-1 ml-0.5">Compare With</span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Brand 2 */}
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
                    <SelectTrigger className="h-9 text-xs border-gray-200">
                      <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent className="max-h-62.5">
                      <div className="p-2 border-b sticky top-0 bg-white z-10">
                        <Input
                          autoFocus
                          placeholder="Search brands..."
                          value={brandSearch2}
                          onChange={(e) => setBrandSearch2(e.target.value)}
                          className="h-8 text-xs"
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredTrendBrands2.map((brand) => (
                        <SelectItem key={brand} value={brand} className="text-xs">{brand}</SelectItem>
                      ))}
                      {filteredTrendBrands2.length === 0 && (
                        <div className="p-2 text-xs text-gray-500 text-center">No brands</div>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Model 2 */}
                  <Select
                    value={trendFilterModel2}
                    onValueChange={(value) => {
                      setTrendFilterModel2(value);
                      setModelSearch2("");
                      setTrendFilterMfgYear2("");
                    }}
                    disabled={!trendFilterYear || !trendFilterBrand2}
                  >
                    <SelectTrigger className="h-9 text-xs border-gray-200">
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent className="max-h-62.5">
                      <div className="p-2 border-b sticky top-0 bg-white z-10">
                        <Input
                          autoFocus
                          placeholder="Search models..."
                          value={modelSearch2}
                          onChange={(e) => setModelSearch2(e.target.value)}
                          className="h-8 text-xs"
                          onMouseDown={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredTrendModels2.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                      {filteredTrendModels2.length === 0 && (
                        <div className="p-2 text-xs text-gray-500 text-center">No models</div>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Mfg Year 2 */}
                  <Select
                    value={trendFilterMfgYear2 || "all"}
                    onValueChange={(e) => setTrendFilterMfgYear2(e === "all" ? "" : e)}
                    disabled={!trendFilterYear || !trendFilterBrand2 || !trendFilterModel2}
                  >
                    <SelectTrigger className="h-9 text-xs border-gray-200">
                      <SelectValue placeholder="Mfg Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Years</SelectItem>
                      {availableTrendMfgYears2.map((year) => (
                        <SelectItem key={year} value={String(year)} className="text-xs">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(trendFilterYear || trendFilterBrand1 || trendFilterBrand2) && (
                <div className="w-full lg:w-auto flex flex-col justify-end h-full">
                  <span className="hidden lg:block text-[10px] text-transparent mb-1 select-none">Clear</span>
                  <button
                    onClick={() => {
                      setTrendFilterYear("");
                      setTrendFilterBrand1("");
                      setTrendFilterModel1("");
                      setTrendFilterMfgYear1("");
                      setTrendFilterBrand2("");
                      setTrendFilterModel2("");
                      setTrendFilterMfgYear2("");
                    }}
                    className="w-full lg:w-auto px-2 lg:px-2.5 h-9 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all focus:outline-none focus:ring-1 focus:ring-red-500 flex-shrink-0"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    <span className="lg:hidden">Clear Filters</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          )}
        </div>

        {/* Chart & Stats Container */}
        <div className="bg-white rounded-xl p-6 sm:p-10 shadow-sm ring-1 ring-gray-900/5">
          {isLoading ? (
            <div className="h-[400px] w-full bg-gray-50 rounded-xl animate-pulse flex items-center justify-center"></div>
          ) : (
            <>
              {priceTrendData.length > 0 ? (
                <>
                  <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[800px]">
                      <ResponsiveContainer width="100%" height={450}>
                        <LineChart data={priceTrendData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis
                            dataKey="month"
                            stroke="#666"
                            minTickGap={30}
                            style={{ fontSize: "14px", fontWeight: 500 }}
                            label={{ value: "Posted (Month)", position: "bottom", offset: 0, fontSize: 14, fontWeight: 600 }}
                          />
                          <YAxis
                            stroke="#666"
                            width={90}
                            style={{ fontSize: "14px", fontWeight: 500 }}
                            tickFormatter={(value) =>
                              value >= 1000000
                                ? `Rs. ${(value / 1000000).toFixed(1)}M`
                                : `Rs. ${(value / 1000).toFixed(0)}K`
                            }
                            label={{ value: "Average Price", angle: -90, position: "insideLeft", offset: -10, fontSize: 14, fontWeight: 600 }}
                          />
                          <Tooltip 
                            content={<CustomTooltip formatPrice={formatPrice} />} 
                            cursor={{ stroke: '#f3f4f6', strokeWidth: 2, strokeDasharray: '5 5' }} 
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
                              stroke="#3b82f6"
                              strokeWidth={3}
                              name={`${trendFilterBrand1} ${trendFilterModel1}`}
                              dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                              activeDot={{ r: 7, strokeWidth: 0 }}
                              connectNulls
                              animationDuration={1000}
                            />
                          )}
                          {trendFilterBrand2 && trendFilterModel2 && (
                            <Line
                              type="monotone"
                              dataKey="avgPrice2"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              name={`${trendFilterBrand2} ${trendFilterModel2}`}
                              dot={{ fill: "#8b5cf6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                              activeDot={{ r: 7, strokeWidth: 0 }}
                              connectNulls
                              animationDuration={1000}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-slate-50/50 rounded-xl p-6 ring-1 ring-gray-900/5 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data Points</div>
                        <div className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                          {priceTrendData.length} <span className="text-lg font-medium text-gray-400">months</span>
                        </div>
                      </div>
                      <div className="bg-blue-50/30 rounded-xl p-6 ring-1 ring-blue-900/5 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-900/5 transition-all duration-300">
                        <div className="text-xs font-semibold text-blue-600/80 uppercase tracking-wider mb-2">{trendFilterBrand1} {trendFilterModel1 || "First Selection"} Listings</div>
                        <div className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
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
                      <div className="bg-violet-50/30 rounded-xl p-6 ring-1 ring-violet-900/5 hover:-translate-y-1 hover:shadow-md hover:shadow-violet-900/5 transition-all duration-300">
                        <div className="text-xs font-semibold text-violet-600/80 uppercase tracking-wider mb-2">{trendFilterBrand2} {trendFilterModel2 || "Second Selection"} Listings</div>
                        <div className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-violet-400">
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
                <div className="text-center py-20 border border-gray-100 rounded-xl bg-gray-50/50">
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
  );
}

const CustomTooltip = ({ active, payload, label, formatPrice }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[220px]">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
          Posted in {label}
        </p>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-semibold text-gray-700">
                  {entry.name}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 pl-[18px] tracking-tight">
                {formatPrice(entry.value)}
              </span>
            </div>
          ))}
          
          {/* Show price difference if comparing two vehicles */}
          {payload.length === 2 && payload[0].value && payload[1].value && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Price Difference:</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {formatPrice(Math.abs(payload[0].value - payload[1].value))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

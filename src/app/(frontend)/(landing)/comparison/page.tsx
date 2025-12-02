/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import {
  Calendar,
  Car,
  Check,
  ChevronsUpDown,
  Fuel,
  Gauge,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ComparisonPage() {
  const router = useRouter();
  const [vehicle1Id, setVehicle1Id] = useState<string | null>(null);
  const [vehicle2Id, setVehicle2Id] = useState<string | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  // Fetch vehicles for search
  const { data: searchData1 } = useGetAds({
    page: 1,
    limit: 10,
    search: search1 || null,
  });

  const { data: searchData2 } = useGetAds({
    page: 1,
    limit: 10,
    search: search2 || null,
  });

  // Fetch selected vehicle details
  const { data: vehicle1, isLoading: loading1 } = useGetAdById({
    adId: vehicle1Id || "",
  });

  const { data: vehicle2, isLoading: loading2 } = useGetAdById({
    adId: vehicle2Id || "",
  });

  // Get vehicles list from search results
  const vehicles1 = searchData1?.ads || [];
  const vehicles2 = searchData2?.ads || [];

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Price upon request";
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    })
      .format(price)
      .replace("LKR", "Rs.");
  };

  const getVehicleImage = (ad: any) => {
    if (ad?.media && Array.isArray(ad.media) && ad.media.length > 0) {
      const firstMedia = ad.media[0];
      if (firstMedia?.media?.url) {
        return firstMedia.media.url;
      }
    }
    return "/placeholder.svg?height=300&width=400&text=No+Image";
  };

  const getVehicleTitle = (ad: any) => {
    const parts = [
      ad?.brand,
      ad?.model,
      ad?.manufacturedYear || ad?.modelYear,
      ad?.vehicleType,
    ].filter(Boolean);
    return parts.join(" ") || "Vehicle";
  };

  // Comparison data structure
  const comparisonFields = [
    {
      label: "Price",
      key: "price",
      format: (value: any) => formatPrice(value),
      icon: Sparkles,
    },
    {
      label: "Brand",
      key: "brand",
      format: (value: any) => value || "N/A",
    },
    {
      label: "Model",
      key: "model",
      format: (value: any) => value || "N/A",
    },
    {
      label: "Year",
      key: "year",
      format: (value: any) => value || "N/A",
      icon: Calendar,
    },
    {
      label: "Mileage",
      key: "mileage",
      format: (value: any) =>
        value ? `${value.toLocaleString()} km` : "N/A",
      icon: Gauge,
    },
    {
      label: "Fuel Type",
      key: "fuelType",
      format: (value: any) => value || "N/A",
      icon: Fuel,
    },
    {
      label: "Transmission",
      key: "transmission",
      format: (value: any) => value || "N/A",
    },
    {
      label: "Engine Capacity",
      key: "engineCapacity",
      format: (value: any) => (value ? `${value} cc` : "N/A"),
    },
    {
      label: "Body Type",
      key: "bodyType",
      format: (value: any) => value || "N/A",
    },
    {
      label: "Condition",
      key: "condition",
      format: (value: any) => value || "N/A",
    },
    {
      label: "Location",
      key: "location",
      format: (value: any) => value || "N/A",
      icon: MapPin,
    },
  ];

  const getFieldValue = (vehicle: any, field: any) => {
    if (field.key === "year") {
      return vehicle?.manufacturedYear || vehicle?.modelYear || null;
    }
    if (field.key === "location") {
      return [vehicle?.city, vehicle?.province].filter(Boolean).join(", ") || vehicle?.location || null;
    }
    return vehicle?.[field.key] || null;
  };

  const getWinner = (field: any, value1: any, value2: any) => {
    if (field.key === "price") {
      if (!value1 || !value2) return null;
      return value1 < value2 ? 1 : value2 < value1 ? 2 : null;
    }
    if (field.key === "mileage") {
      if (!value1 || !value2) return null;
      return value1 < value2 ? 1 : value2 < value1 ? 2 : null;
    }
    if (field.key === "year") {
      if (!value1 || !value2) return null;
      const year1 = parseInt(value1);
      const year2 = parseInt(value2);
      if (isNaN(year1) || isNaN(year2)) return null;
      return year1 > year2 ? 1 : year2 > year1 ? 2 : null;
    }
    if (field.key === "engineCapacity") {
      if (!value1 || !value2) return null;
      return value1 > value2 ? 1 : value2 > value1 ? 2 : null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#024950] to-teal-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-8 h-8" />
                Vehicle Comparison
              </h1>
              <p className="text-teal-100">
                Compare two vehicles side by side to make the best decision
              </p>
            </div>
            <Button
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10"
              onClick={() => router.back()}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Vehicle Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Vehicle 1 Selection */}
          <Card className="border-2 border-dashed border-[#024950]/30">
            <CardHeader>
              <CardTitle className="text-[#024950] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#024950] text-white flex items-center justify-center font-bold">
                  1
                </div>
                Vehicle 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={open1} onOpenChange={setOpen1}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open1}
                    className="w-full justify-between h-12"
                  >
                    {vehicle1 ? (
                      <span className="truncate">
                        {getVehicleTitle(vehicle1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Search and select vehicle...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search vehicles..."
                      value={search1}
                      onValueChange={setSearch1}
                    />
                    <CommandList>
                      <CommandEmpty>No vehicles found.</CommandEmpty>
                      <CommandGroup>
                        {vehicles1.map((vehicle: any) => (
                          <CommandItem
                            key={vehicle.id}
                            value={vehicle.id}
                            onSelect={() => {
                              setVehicle1Id(vehicle.id);
                              setOpen1(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                vehicle1Id === vehicle.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={getVehicleImage(vehicle)}
                                  alt={getVehicleTitle(vehicle)}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {getVehicleTitle(vehicle)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatPrice(vehicle.price)}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {vehicle1Id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-red-600 hover:text-red-700"
                  onClick={() => {
                    setVehicle1Id(null);
                    setSearch1("");
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Vehicle 2 Selection */}
          <Card className="border-2 border-dashed border-[#024950]/30">
            <CardHeader>
              <CardTitle className="text-[#024950] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                Vehicle 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={open2} onOpenChange={setOpen2}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open2}
                    className="w-full justify-between h-12"
                  >
                    {vehicle2 ? (
                      <span className="truncate">
                        {getVehicleTitle(vehicle2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Search and select vehicle...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search vehicles..."
                      value={search2}
                      onValueChange={setSearch2}
                    />
                    <CommandList>
                      <CommandEmpty>No vehicles found.</CommandEmpty>
                      <CommandGroup>
                        {vehicles2.map((vehicle: any) => (
                          <CommandItem
                            key={vehicle.id}
                            value={vehicle.id}
                            onSelect={() => {
                              setVehicle2Id(vehicle.id);
                              setOpen2(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                vehicle2Id === vehicle.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={getVehicleImage(vehicle)}
                                  alt={getVehicleTitle(vehicle)}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {getVehicleTitle(vehicle)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatPrice(vehicle.price)}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {vehicle2Id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-red-600 hover:text-red-700"
                  onClick={() => {
                    setVehicle2Id(null);
                    setSearch2("");
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        {vehicle1Id && vehicle2Id && (
          <div className="space-y-6">
            {/* Vehicle Headers */}
            <div className="grid md:grid-cols-3 gap-4">
              <div></div>
              <Card className="border-2 border-[#024950] bg-gradient-to-br from-[#024950] to-teal-700 text-white">
                <CardContent className="p-6">
                  {loading1 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : vehicle1 ? (
                    <>
                      <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 bg-white/10">
                        <Image
                          src={getVehicleImage(vehicle1)}
                          alt={getVehicleTitle(vehicle1)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        {getVehicleTitle(vehicle1)}
                      </h3>
                      <div className="text-2xl font-bold mb-2">
                        {formatPrice(vehicle1.price)}
                      </div>
                      <Link href={`/${vehicle1Id}`}>
                        <Button
                          variant="outline"
                          className="w-full mt-4 border-white/30 text-white hover:bg-white/10"
                        >
                          View Details
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="text-center py-8">Vehicle not found</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-teal-600 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
                <CardContent className="p-6">
                  {loading2 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                    </div>
                  ) : vehicle2 ? (
                    <>
                      <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 bg-white/10">
                        <Image
                          src={getVehicleImage(vehicle2)}
                          alt={getVehicleTitle(vehicle2)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        {getVehicleTitle(vehicle2)}
                      </h3>
                      <div className="text-2xl font-bold mb-2">
                        {formatPrice(vehicle2.price)}
                      </div>
                      <Link href={`/${vehicle2Id}`}>
                        <Button
                          variant="outline"
                          className="w-full mt-4 border-white/30 text-white hover:bg-white/10"
                        >
                          View Details
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="text-center py-8">Vehicle not found</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comparison Details */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#024950] to-teal-700 text-white">
                <CardTitle className="text-2xl">Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {comparisonFields.map((field, index) => {
                    const value1 = getFieldValue(vehicle1, field);
                    const value2 = getFieldValue(vehicle2, field);
                    const winner = getWinner(field, value1, value2);
                    const Icon = field.icon;

                    return (
                      <div
                        key={index}
                        className="grid md:grid-cols-3 gap-4 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                          {Icon && <Icon className="w-5 h-5 text-[#024950]" />}
                          <span>{field.label}</span>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            winner === 1
                              ? "bg-green-50 border-2 border-green-500"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {field.format(value1)}
                            </span>
                            {winner === 1 && (
                              <Badge className="bg-green-500 text-white">
                                Winner
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            winner === 2
                              ? "bg-green-50 border-2 border-green-500"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {field.format(value2)}
                            </span>
                            {winner === 2 && (
                              <Badge className="bg-green-500 text-white">
                                Winner
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Features Comparison */}
            {(vehicle1?.tags?.length > 0 || vehicle2?.tags?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#024950]">
                    Features & Equipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-[#024950]">
                        Vehicle 1 Features
                      </h4>
                      <div className="space-y-2">
                        {vehicle1?.tags?.length > 0 ? (
                          vehicle1.tags.map((tag: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                              <span>{tag}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No features listed</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-teal-600">
                        Vehicle 2 Features
                      </h4>
                      <div className="space-y-2">
                        {vehicle2?.tags?.length > 0 ? (
                          vehicle2.tags.map((tag: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                              <span>{tag}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No features listed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-[#024950] flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Comparison Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicle1?.price && vehicle2?.price && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="font-medium">Price Difference</span>
                      <span className="font-bold text-[#024950]">
                        {formatPrice(Math.abs(vehicle1.price - vehicle2.price))}
                        {vehicle1.price < vehicle2.price ? (
                          <span className="text-green-600 ml-2">
                            (Vehicle 1 is cheaper)
                          </span>
                        ) : (
                          <span className="text-green-600 ml-2">
                            (Vehicle 2 is cheaper)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {vehicle1?.mileage && vehicle2?.mileage && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="font-medium">Mileage Difference</span>
                      <span className="font-bold text-[#024950]">
                        {Math.abs(vehicle1.mileage - vehicle2.mileage).toLocaleString()}{" "}
                        km
                        {vehicle1.mileage < vehicle2.mileage ? (
                          <span className="text-green-600 ml-2">
                            (Vehicle 1 has lower mileage)
                          </span>
                        ) : (
                          <span className="text-green-600 ml-2">
                            (Vehicle 2 has lower mileage)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {(!vehicle1Id || !vehicle2Id) && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select Two Vehicles to Compare
              </h3>
              <p className="text-gray-500">
                Use the search boxes above to find and select two vehicles you
                want to compare side by side.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


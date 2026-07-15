/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGetAds } from "@/features/ads/api/use-get-ads";
import { useGetAdById } from "@/features/ads/api/use-get-ad-by-id";
import {
    Check,
    ChevronsUpDown,
    X,
    AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdComparisonPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [vehicle1Id, setVehicle1Id] = useState<string | null>(null);
    const [vehicle2Id, setVehicle2Id] = useState<string | null>(null);
    const [search1, setSearch1] = useState("");
    const [search2, setSearch2] = useState("");
    const [open1, setOpen1] = useState(false);
    const [open2, setOpen2] = useState(false);

    // Initialize vehicle1Id from URL parameter if present
    useEffect(() => {
        const vehicle1Param = searchParams.get("vehicle1");
        if (vehicle1Param) {
            setVehicle1Id(vehicle1Param);
        }
        const vehicle2Param = searchParams.get("vehicle2");
        if (vehicle2Param) {
            setVehicle2Id(vehicle2Param);
        }
    }, [searchParams]);

    // Fetch vehicles for search - only show active ads for comparison
    const { data: searchData1 } = useGetAds({
        page: 1,
        limit: 200,
    });

    const { data: searchData2 } = useGetAds({
        page: 1,
        limit: 200,
    });

    // Fetch selected vehicle details
    const { data: vehicle1Data, isLoading: loading1 } = useGetAdById({
        adId: vehicle1Id || "",
    });

    const { data: vehicle2Data, isLoading: loading2 } = useGetAdById({
        adId: vehicle2Id || "",
    });

    // Get vehicles list from search results
    const vehicles1 = useMemo(() => searchData1?.ads || [], [searchData1]);
    const vehicles2 = useMemo(() => searchData2?.ads || [], [searchData2]);

    // Resolve vehicle data: prefer getAdById response, fallback to list data for expired/broken ads
    const vehicle1 = useMemo(() => {
        if (vehicle1Data) return vehicle1Data;
        if (vehicle1Id && vehicles1.length > 0) {
            return vehicles1.find((v: any) => v.id === vehicle1Id) || null;
        }
        return null;
    }, [vehicle1Data, vehicle1Id, vehicles1]);

    const vehicle2 = useMemo(() => {
        if (vehicle2Data) return vehicle2Data;
        if (vehicle2Id && vehicles2.length > 0) {
            return vehicles2.find((v: any) => v.id === vehicle2Id) || null;
        }
        return null;
    }, [vehicle2Data, vehicle2Id, vehicles2]);

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

    const getVehicleImage = (ad: any) => {
        if (ad?.media && Array.isArray(ad.media) && ad.media.length > 0) {
            const firstMedia = ad.media[0];
            if (firstMedia?.media?.url) {
                return firstMedia.media.url;
            }
        }
        return "/placeholder-image.jpg";
    };

    const vehicleTypeLabels: Record<string, string> = {
        CAR: "Car",
        VAN: "Van",
        SUV_JEEP: "SUV / Jeep",
        MOTORCYCLE: "Motorcycle",
        CREW_CAB: "Crew Cab",
        PICKUP_DOUBLE_CAB: "Pickup / Double Cab",
        BUS: "Bus",
        LORRY: "Lorry",
        THREE_WHEEL: "Three Wheeler",
        TRACTOR: "Tractor",
        HEAVY_DUTY: "Heavy Duty",
        BICYCLE: "Bicycle",
        AUTO_SERVICE: "Auto Service",
        RENTAL: "Rental",
        AUTO_PARTS: "Auto Parts",
        MAINTENANCE: "Maintenance",
        BOAT: "Boat",
        OTHER: "Other",
    };

    const formatVehicleType = (ad: any): string | null => {
        const type = ad?.type as string | undefined;
        if (!type) return null;
        return vehicleTypeLabels[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    };

    const getVehicleTitle = (ad: any) => {
        const typeLabel = formatVehicleType(ad);
        const parts = [
            ad?.brand,
            ad?.model,
            ad?.manufacturedYear || ad?.modelYear,
            typeLabel,
        ].filter(Boolean);
        return parts.join(" ") || "Vehicle";
    };

    const normalizeVehicleType = (ad: any) => {
        const typeValue = ad?.type as string | undefined;
        return typeof typeValue === "string" ? typeValue.toLowerCase() : null;
    };

    const isPublished = (ad: any) => {
        return ad?.status === "ACTIVE" && ad?.published === true;
    };

    const isExpired = (ad: any) => {
        return ad?.status === "EXPIRED";
    };

    const isSellingAd = (ad: any) => ad?.listingType === "SELL";

    const isVisibleForCompare = (ad: any) => isSellingAd(ad) && (isPublished(ad) || isExpired(ad));

    const matchesSearch = (ad: any, query: string) => {
        if (!query || query.trim() === "") return true;
        const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return true;
        const title = getVehicleTitle(ad).toLowerCase();
        const price = formatPrice(ad.price);
        const searchText = `${title} ${price}`.toLowerCase();
        return words.every((word) => searchText.includes(word));
    };

    const filteredVehicles1 = vehicles1.filter((vehicle: any) => isVisibleForCompare(vehicle) && matchesSearch(vehicle, search1));

    const searchFilteredVehicles2 = vehicles2.filter((vehicle: any) => isVisibleForCompare(vehicle) && matchesSearch(vehicle, search2));
    const filteredVehicles2 = searchFilteredVehicles2;
    // Comparison data structure
    const comparisonFields = [
        {
            label: "Price",
            key: "price",
            format: (value: any) => formatPrice(value),
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
        },
        {
            label: "Mileage",
            key: "mileage",
            format: (value: any) =>
                value ? `${value.toLocaleString()} km` : "N/A",
        },
        {
            label: "Fuel Type",
            key: "fuelType",
            format: (value: any) => value || "N/A",
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
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            {/* Header */}
            <div className="border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            Vehicle Comparison
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Compare specifications and features side-by-side to find the perfect match.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        className="self-start sm:self-auto text-gray-500 hover:text-gray-900 -ml-2 sm:ml-0"
                        onClick={() => router.back()}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Close
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Vehicle Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Vehicle 1 Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">First Vehicle</label>
                        <Popover open={open1} onOpenChange={setOpen1}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open1}
                                    className="w-full justify-between h-14 bg-gray-50/50 hover:bg-gray-50 border-gray-200 font-normal"
                                >
                                    {vehicle1 ? (
                                        <span className="truncate font-medium text-gray-900">
                                            {getVehicleTitle(vehicle1)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">
                                            Search to select a vehicle...
                                        </span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Search vehicles..."
                                        value={search1}
                                        onValueChange={setSearch1}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No vehicles found.</CommandEmpty>
                                        <CommandGroup>
                                            {filteredVehicles1.map((vehicle: any) => (
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
                                                        className={`mr-2 h-4 w-4 ${vehicle1Id === vehicle.id
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                            }`}
                                                    />
                                                    <div className="flex items-center justify-between flex-1 min-w-0 py-1">
                                                        <div className="flex items-center gap-2 truncate pr-2">
                                                            <span className="font-medium truncate text-gray-900">
                                                                {getVehicleTitle(vehicle)}
                                                            </span>
                                                            {isExpired(vehicle) && (
                                                                <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0 shrink-0 border-none">Expired</Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500 shrink-0 font-medium">
                                                            {formatPrice(vehicle.price)}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>


                    </div>

                    {/* Vehicle 2 Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Second Vehicle</label>
                        <Popover open={open2} onOpenChange={setOpen2}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open2}
                                    className="w-full justify-between h-14 bg-gray-50/50 hover:bg-gray-50 border-gray-200 font-normal"
                                >
                                    {vehicle2 ? (
                                        <span className="truncate font-medium text-gray-900">
                                            {getVehicleTitle(vehicle2)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">
                                            Search to select a vehicle...
                                        </span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Search vehicles..."
                                        value={search2}
                                        onValueChange={setSearch2}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No vehicles found.</CommandEmpty>
                                        <CommandGroup>
                                                {filteredVehicles2.map((vehicle: any) => (
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
                                                        className={`mr-2 h-4 w-4 ${vehicle2Id === vehicle.id
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                            }`}
                                                    />
                                                    <div className="flex items-center justify-between flex-1 min-w-0 py-1">
                                                        <div className="flex items-center gap-2 truncate pr-2">
                                                            <span className="font-medium truncate text-gray-900">
                                                                {getVehicleTitle(vehicle)}
                                                            </span>
                                                            {isExpired(vehicle) && (
                                                                <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0 shrink-0 border-none">Expired</Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm text-gray-500 shrink-0 font-medium">
                                                            {formatPrice(vehicle.price)}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>


                    </div>
                </div>

                {/* Comparison Content */}
                {vehicle1Id && vehicle2Id && (
                    <div className="space-y-12">
                        {/* Vehicle Headers Overview */}
                        <div className="grid grid-cols-2 gap-4 md:gap-8 border-b border-gray-100 pb-8">
                            {/* Vehicle 1 Overview */}
                            <div>
                                {loading1 && !vehicle1 ? (
                                    <div className="animate-pulse bg-gray-100 aspect-[4/3] rounded-xl w-full"></div>
                                ) : vehicle1 ? (
                                    <div className="group relative">
                                        <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-gray-50 mb-4">
                                            <Image
                                                src={getVehicleImage(vehicle1)}
                                                alt={getVehicleTitle(vehicle1)}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        {isExpired(vehicle1) && (
                                            <Badge variant="secondary" className="mb-2 bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Expired Ad
                                            </Badge>
                                        )}
                                        <h3 className="font-semibold text-lg md:text-xl line-clamp-2 text-gray-900 leading-tight">
                                            {getVehicleTitle(vehicle1)}
                                        </h3>
                                        <div className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
                                            {formatPrice(vehicle1.price)}
                                        </div>
                                        {!isExpired(vehicle1) && (
                                            <Link href={`/ads/${vehicle1Id}`}>
                                                <Button className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-12">
                                                    View Details
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-center py-8">Vehicle unavailable</div>
                                )}
                            </div>

                            {/* Vehicle 2 Overview */}
                            <div>
                                {loading2 && !vehicle2 ? (
                                    <div className="animate-pulse bg-gray-100 aspect-[4/3] rounded-xl w-full"></div>
                                ) : vehicle2 ? (
                                    <div className="group relative">
                                        <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-gray-50 mb-4">
                                            <Image
                                                src={getVehicleImage(vehicle2)}
                                                alt={getVehicleTitle(vehicle2)}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        {isExpired(vehicle2) && (
                                            <Badge variant="secondary" className="mb-2 bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Expired Ad
                                            </Badge>
                                        )}
                                        <h3 className="font-semibold text-lg md:text-xl line-clamp-2 text-gray-900 leading-tight">
                                            {getVehicleTitle(vehicle2)}
                                        </h3>
                                        <div className="text-xl md:text-2xl font-bold mt-2 text-gray-900">
                                            {formatPrice(vehicle2.price)}
                                        </div>
                                        {!isExpired(vehicle2) && (
                                            <Link href={`/ads/${vehicle2Id}`}>
                                                <Button className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-12">
                                                    View Details
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 text-center py-8">Vehicle unavailable</div>
                                )}
                            </div>
                        </div>

                        {/* Comparison Table */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Key Specifications</h2>
                            <div className="border border-gray-200 rounded-2xl overflow-x-auto bg-white">
                                <table className="w-full text-sm md:text-base text-left">
                                    <tbody className="divide-y divide-gray-200">
                                        {comparisonFields.map((field, index) => {
                                            const value1 = getFieldValue(vehicle1, field);
                                            const value2 = getFieldValue(vehicle2, field);
                                            const winner = getWinner(field, value1, value2);

                                            return (
                                                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-3 md:px-6 font-medium text-gray-500 w-[28%] bg-gray-50/50 align-top md:align-middle break-words">
                                                        {field.label}
                                                    </td>
                                                    <td className={`py-4 px-3 md:px-6 w-[36%] border-l border-gray-100 align-top md:align-middle break-words min-w-0 ${winner === 1 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                        <div className="flex items-start gap-2 flex-wrap">
                                                            <span className="break-words">{field.format(value1)}</span>
                                                            {winner === 1 && (
                                                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5" title="Better value"></span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className={`py-4 px-3 md:px-6 w-[36%] border-l border-gray-100 align-top md:align-middle break-words min-w-0 ${winner === 2 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                        <div className="flex items-start gap-2 flex-wrap">
                                                            <span className="break-words">{field.format(value2)}</span>
                                                            {winner === 2 && (
                                                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5" title="Better value"></span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Features Comparison */}
                        {((vehicle1?.tags?.length ?? 0) > 0 || (vehicle2?.tags?.length ?? 0) > 0) && (
                            <div className="space-y-6 pt-4">
                                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Features & Equipment</h2>
                                <div className="grid grid-cols-2 gap-4 md:gap-8">
                                    <div className="bg-gray-50 rounded-2xl p-6">
                                        <ul className="space-y-3">
                                            {(vehicle1?.tags?.length ?? 0) > 0 ? (
                                                vehicle1?.tags?.map((tag: string, idx: number) => (
                                                    <li key={idx} className="flex items-start text-sm md:text-base text-gray-700">
                                                        <Check className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                                                        <span className="mt-0.5">{tag}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-sm md:text-base text-gray-500">Not specified</li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-6">
                                        <ul className="space-y-3">
                                            {(vehicle2?.tags?.length ?? 0) > 0 ? (
                                                vehicle2?.tags?.map((tag: string, idx: number) => (
                                                    <li key={idx} className="flex items-start text-sm md:text-base text-gray-700">
                                                        <Check className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                                                        <span className="mt-0.5">{tag}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-sm md:text-base text-gray-500">Not specified</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary Block */}
                        {((vehicle1?.price && vehicle2?.price) || (vehicle1?.mileage && vehicle2?.mileage)) && (
                            <div className="pt-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-900">Comparison Highlights</h2>
                                    <div className="space-y-5">
                                        {vehicle1?.price && vehicle2?.price && (
                                            <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-gray-200 last:border-0 last:pb-0 gap-2">
                                                <span className="text-gray-600 font-medium">Price Difference</span>
                                                <span className="font-semibold text-gray-900 text-lg">
                                                    {formatPrice(Math.abs(vehicle1.price - vehicle2.price))}
                                                    <span className="text-gray-500 font-normal text-sm md:text-base ml-2">
                                                        ({vehicle1.price < vehicle2.price ? 'First vehicle is more affordable' : 'Second vehicle is more affordable'})
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                        {vehicle1?.mileage && vehicle2?.mileage && (
                                            <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-gray-200 last:border-0 last:pb-0 gap-2">
                                                <span className="text-gray-600 font-medium">Mileage Difference</span>
                                                <span className="font-semibold text-gray-900 text-lg">
                                                    {Math.abs(vehicle1.mileage - vehicle2.mileage).toLocaleString()} km
                                                    <span className="text-gray-500 font-normal text-sm md:text-base ml-2">
                                                        ({vehicle1.mileage < vehicle2.mileage ? 'First vehicle has less mileage' : 'Second vehicle has less mileage'})
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {(!vehicle1Id || !vehicle2Id) && (
                    <div className="border border-dashed border-gray-300 rounded-2xl bg-gray-50/50 p-12 text-center mt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">
                            Select Vehicles to Compare
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Please search and select two vehicles from the drop-downs above to view a detailed side-by-side comparison.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

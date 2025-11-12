"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PageContainer from "@/components/layouts/page-container";
import { AppPageShell } from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Vehicle type labels
const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car",
  VAN: "Van",
  SUV_JEEP: "SUV / Jeep",
  MOTORCYCLE: "Motorcycle",
  CREW_CAB: "Crew Cab",
  PICKUP_DOUBLE_CAB: "Pickup / Double Cab",
  BUS: "Bus",
  LORRY: "Lorry",
  THREE_WHEEL: "Three Wheel",
  OTHER: "Other",
  TRACTOR: "Tractor",
  HEAVY_DUTY: "Heavy-Duty",
  BICYCLE: "Bicycle"
};

interface UserAd {
  id: string;
  title: string;
  brand: string;
  model: string;
  type: string;
  price: number;
  location: string;
  status: string;
  published: boolean;
  createdAt: string;
  manufacturedYear: number;
  media?: Array<{ media: { url: string } }>;
}

interface UserDetails {
  id: string;
  name: string | null;
  email: string;
}

export default function UserAdsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string; // Use original case for querying ads
  
  // Get user data from session storage
  const [userName, setUserName] = useState<string>("User");
  
  useEffect(() => {
    const storedUser = sessionStorage.getItem('viewingUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserName(userData.name || userData.email || "User");
      document.title = `${userData.name || userData.email} - Ads | Admin Dashboard`;
    }
  }, []);

  // Fetch user's ads
  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ["user-ads", userId],
    queryFn: async () => {
      const response = await fetch(`/api/ad?createdBy=${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user ads");
      const data = await response.json();
      return data as { ads: UserAd[] };
    },
  });

  const formatPrice = (price: number | null) => {
    if (price === null) return "Price on request";
    return `Rs. ${price.toLocaleString()}`;
  };

  const ads = adsData?.ads || [];

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>

        <AppPageShell
          title={`Ads by ${userName}`}
          description={`Total ads: ${ads.length}`}
          actionComponent={null}
        />

        <Separator />

        {/* Ads Grid */}
        {adsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-48 w-full" />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">This user hasn't posted any ads yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                onClick={() => router.push(`/dashboard/ads/${vehicle.id}`)}
              >
                {/* Status Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <Badge
                    variant={
                      vehicle.status === "ACTIVE"
                        ? "default"
                        : vehicle.status === "PENDING_REVIEW"
                        ? "secondary"
                        : vehicle.status === "REJECTED"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {vehicle.status}
                  </Badge>
                </div>

                {!vehicle.published && (
                  <div className="absolute top-10 left-2 z-10">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Unpublished
                    </Badge>
                  </div>
                )}
                
                <div className="p-3">
                  {/* Vehicle Title - Centered */}
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 text-center mb-2 transition-colors group-hover:text-teal-700 line-clamp-1">
                    {[vehicle.brand, vehicle.model, vehicle.manufacturedYear, vehicleTypeLabels[vehicle.type] || vehicle.type]
                      .filter(Boolean)
                      .join(' ')}
                  </h3>

                  <div className="flex">
                    {/* Vehicle Image */}
                    <div className="w-32 h-20 flex-shrink-0">
                      {vehicle?.media && vehicle.media.length > 0 && vehicle.media[0]?.media?.url ? (
                        <img
                          src={vehicle.media[0].media.url}
                          alt={vehicle.title}
                          className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                          <span className="text-xs text-slate-400">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Vehicle Details */}
                    <div className="flex-1 pl-3 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 line-clamp-1">
                          {vehicle.location || ""}
                        </div>

                        <div className="text-sm font-semibold text-teal-700 dark:text-teal-400 mb-1">
                          {formatPrice(vehicle.price)}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {vehicleTypeLabels[vehicle.type] || vehicle.type}
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        {format(new Date(vehicle.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

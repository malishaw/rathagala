"use client";

import { useQuery } from "@tanstack/react-query";
import { vehicleColors as defaultColors } from "@/lib/vehicle-constants";

export type VehicleColorItem = {
  id: string;
  name: string;
  hexCode?: string | null;
  order?: number;
};

async function fetchVehicleColors(): Promise<{ colors: VehicleColorItem[] }> {
  const res = await fetch("/api/colors");
  if (!res.ok) throw new Error("Failed to fetch vehicle colors");
  return res.json();
}

export function useVehicleColors() {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-colors"],
    queryFn: fetchVehicleColors,
    staleTime: 5 * 60 * 1000,
  });

  const colors = data?.colors && data.colors.length > 0
    ? data.colors.map(c => c.name)
    : defaultColors;

  return {
    colors,
    colorItems: data?.colors ?? [],
    isLoading,
  };
}

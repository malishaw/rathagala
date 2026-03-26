"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type LocationProvinceData = {
  id: string;
  name: string;
  districts: {
    id: string;
    name: string;
    cities: { id: string; name: string }[];
  }[];
};

export type LocationData = Record<string, Record<string, string[]>>;

async function fetchLocations(): Promise<{ provinces: LocationProvinceData[] }> {
  const res = await fetch("/api/locations");
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

export function useLocations() {
  const { data, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const locationData = useMemo<LocationData>(() => {
    if (!data?.provinces) return {};
    const result: LocationData = {};
    for (const province of data.provinces) {
      result[province.name] = {};
      for (const district of province.districts) {
        result[province.name][district.name] = district.cities.map((c) => c.name);
      }
    }
    return result;
  }, [data]);

  const allDistricts = useMemo<string[]>(() => {
    const districts = new Set<string>();
    Object.values(locationData).forEach((p) => Object.keys(p).forEach((d) => districts.add(d)));
    return Array.from(districts).sort();
  }, [locationData]);

  const allCities = useMemo<string[]>(() => {
    const cities = new Set<string>();
    Object.values(locationData).forEach((p) =>
      Object.values(p).forEach((ds) => ds.forEach((c) => cities.add(c)))
    );
    return Array.from(cities).sort();
  }, [locationData]);

  return {
    locationData,
    allDistricts,
    allCities,
    provinces: data?.provinces ?? [],
    isLoading,
  };
}

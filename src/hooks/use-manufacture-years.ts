"use client";

import { useQuery } from "@tanstack/react-query";

export type ManufactureYearItem = { id: string; year: string };

async function fetchManufactureYears(): Promise<{ years: ManufactureYearItem[] }> {
  const res = await fetch("/api/manufacture-years");
  if (!res.ok) throw new Error("Failed to fetch manufacture years");
  return res.json();
}

export function useManufactureYears() {
  const { data, isLoading } = useQuery({
    queryKey: ["manufacture-years"],
    queryFn: fetchManufactureYears,
    staleTime: 5 * 60 * 1000,
  });

  return {
    years: data?.years ?? [],
    isLoading,
  };
}

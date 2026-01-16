"use client";

import { useCallback, useMemo } from "react";
import { useQueryState } from "nuqs";

import { searchParams } from "@/lib/searchparams";

export function useAdsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault("")
  );

  const [page, setPage] = useQueryState(
    "page",
    searchParams.page.withDefault(1)
  );

  const [limit, setLimit] = useQueryState(
    "limit",
    searchParams.limit.withDefault(10)
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    searchParams.q
      .withOptions({ shallow: false })
      .withDefault("all")
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter("all");

    setPage(1);
    setLimit(10);
  }, [setSearchQuery, setStatusFilter, setPage, setLimit]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!(statusFilter && statusFilter !== "all");
  }, [searchQuery, statusFilter]);

  return {
    // Search
    searchQuery,
    setSearchQuery,

    // Pagination
    page,
    setPage,
    limit,
    setLimit,

    // Status Filter
    statusFilter,
    setStatusFilter,

    // Reset
    resetFilters,
    isAnyFilterActive
  };
}

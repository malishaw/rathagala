"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Options } from "nuqs";
import { useTransition, useState } from "react";
import { Search } from "lucide-react";

interface DataTableSearchProps {
  searchKey: string;
  searchQuery: string;
  setSearchQuery: (
    value: string | ((old: string) => string | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPage: <Shallow>(
    value: number | ((old: number) => number | null) | null,
    options?: Options | undefined
  ) => Promise<URLSearchParams>;
}

/*************  ✨ Command ⭐  *************/
/**
 * A search input for a DataTable.
 *
 * @remarks
 *
 * This component allows users to search the table by keyword. It uses the
 * `useTransition` hook from `react` to prevent the component from re-rendering
 * while the search is in progress.
 *
 * The component expects the following props:
 *
 * - `searchKey`: A string that describes what the user is searching for.
 * - `searchQuery`: The current search query.
 * - `setSearchQuery`: A function that sets the search query.
 * - `setPage`: A function that sets the page number.
 *
 * The component returns an `Input` component with a placeholder that includes
 * the `searchKey`. The component is wrapped in a `div` with a class of
 * `"data-table-search"`.
 ***/

export function DataTableSearch({
  searchKey,
  searchQuery,
  setSearchQuery,
  setPage
}: DataTableSearchProps) {
  const [isLoading, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(searchQuery ?? "");

  const handleSearch = () => {
    setSearchQuery(inputValue, { startTransition });
    setPage(1); // Reset page to 1 when search changes
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex w-full md:max-w-sm gap-2">
      <Input
        placeholder={`Search ${searchKey}...`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn("flex-1", isLoading && "animate-pulse")}
      />
      <Button
        onClick={handleSearch}
        disabled={isLoading}
        size="icon"
        className="bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
}

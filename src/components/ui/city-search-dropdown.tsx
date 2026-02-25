"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CitySearchDropdownProps {
  cities: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  disabledPlaceholder?: string;
  triggerClassName?: string;
}

export function CitySearchDropdown({
  cities,
  value,
  onChange,
  disabled = false,
  placeholder = "Select city",
  disabledPlaceholder = "Select district first",
  triggerClassName,
}: CitySearchDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return cities;
    return cities.filter((c) =>
      c.toLowerCase().includes(search.toLowerCase())
    );
  }, [cities, search]);

  // Reset search when dropdown closes
  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  // Focus the search input when dropdown opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const displayValue = value || (disabled ? disabledPlaceholder : placeholder);
  const isPlaceholder = !value;

  return (
    <Popover open={open} onOpenChange={(o) => { if (!disabled) setOpen(o); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10 px-3 text-sm",
            isPlaceholder && "text-muted-foreground",
            triggerClassName
          )}
          type="button"
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[220px]"
        align="start"
        sideOffset={4}
      >
        {/* Search input */}
        <div className="flex items-center border-b px-3 py-2 gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground text-xs"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        {/* City list */}
        <div className="max-h-[220px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No city found.
            </div>
          ) : (
            filtered.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onChange(city === value ? "" : city);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground cursor-pointer",
                  city === value && "bg-accent font-medium"
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    city === value ? "opacity-100" : "opacity-0"
                  )}
                />
                {city}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

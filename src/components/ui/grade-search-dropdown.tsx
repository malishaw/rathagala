"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VehicleGrade {
  id: string;
  name: string;
  model: string | null;
  brand: string | null;
  isActive?: boolean;
}

interface GradeSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  model?: string;
  brand?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function GradeSearchDropdown({
  value,
  onChange,
  model,
  brand,
  disabled = false,
  placeholder = "Select or type grade (optional)",
  className,
}: GradeSearchDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [grades, setGrades] = React.useState<VehicleGrade[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Fetch grades from API when model or brand changes
  React.useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "500", isActive: "true" });
        if (model) {
          params.set("model", model);
        }
        if (brand) {
          params.set("brand", brand);
        }
        // Include user-entered grades from ads
        params.set("includeUserGrades", "true");
        
        const url = `/api/vehicle-grade?${params}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json() as { grades: VehicleGrade[] };
          setGrades(data.grades);
        } else {
          console.warn("[GradeSearchDropdown] Failed to fetch:", res.status);
        }
      } catch (error) {
        console.error("[GradeSearchDropdown] Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (model || brand) {
      fetchGrades();
    }
  }, [model, brand]);

  const filtered = React.useMemo(() => {
    // Filter out inactive grades
    const activeGrades = grades.filter((g) => g.isActive !== false);
    if (!search.trim()) return activeGrades;
    return activeGrades.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [grades, search]);

  // Check if the typed value matches an existing grade name
  const exactMatch = React.useMemo(
    () => filtered.some((g) => g.name.toLowerCase() === search.toLowerCase()),
    [filtered, search]
  );

  const showCustomOption = search.trim() && !exactMatch;

  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const displayValue = React.useMemo(() => {
    if (!value) return placeholder;
    // Check if the selected grade is inactive
    const selected = grades.find((g) => g.name === value);
    if (selected && selected.isActive === false) {
      return `${value} (Not Available)`;
    }
    return value;
  }, [value, grades, placeholder]);
  
  const isPlaceholder = !value;

  return (
    <Popover open={open} onOpenChange={(o) => { if (!disabled) setOpen(o); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          type="button"
          className={cn(
            "w-full justify-between font-normal h-10 px-3 text-sm",
            isPlaceholder && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-(--radix-popover-trigger-width) min-w-55"
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
            placeholder="Search or type grade..."
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

        {/* Grade list */}
        <div className="max-h-55 overflow-y-auto py-1">
          {loading ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              {/* Custom / free-text option */}
              {showCustomOption && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(search.trim());
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Use &quot;{search.trim()}&quot;
                </button>
              )}

              {filtered.length === 0 && !showCustomOption && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {grades.length === 0
                    ? "No grades yet. Type to add your own."
                    : "No grades match your search."}
                </div>
              )}

              {filtered.length > 0 && (
                <div className="text-xs px-3 py-1 text-muted-foreground">
                  Showing {filtered.length} grades
                </div>
              )}

              {filtered.map((grade) => (
                <button
                  key={grade.id}
                  type="button"
                  onClick={() => {
                    onChange(grade.name === value ? "" : grade.name);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent cursor-pointer hover:text-white",
                    grade.name === value && "bg-accent font-medium"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      grade.name === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {grade.name}
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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

interface VehicleModel {
  id: string;
  name: string;
  brand: string | null;
  isActive?: boolean;
}

interface ModelSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  brand?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ModelSearchDropdown({
  value,
  onChange,
  brand,
  disabled = false,
  placeholder = "Select or type model",
  className,
}: ModelSearchDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [models, setModels] = React.useState<VehicleModel[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Fetch models from API when brand changes or component mounts
  React.useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "500", isActive: "true" });
        if (brand) {
          params.set("brand", brand);
          // Include user-entered models from ads for the selected brand
          params.set("includeUserModels", "true");
        }
        const url = `/api/vehicle-model?${params}`;
        console.log("[ModelSearchDropdown] Fetching models from:", url, { brand });
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json() as { models: VehicleModel[] };
          console.log("[ModelSearchDropdown] Fetched models:", data.models.length, "items", { brand, includesUser: data.models.some((m) => m.id.startsWith("user:")) });
          setModels(data.models);
        } else {
          console.warn("[ModelSearchDropdown] Failed to fetch:", res.status);
        }
      } catch (error) {
        console.error("[ModelSearchDropdown] Fetch error:", error);
        // silently fail - user can still type manually
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [brand]);

  const filtered = React.useMemo(() => {
    // Filter out inactive models
    const activeModels = models.filter((m) => m.isActive !== false);
    if (!search.trim()) return activeModels;
    return activeModels.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [models, search]);

  // Check if the typed value matches an existing model name
  const exactMatch = React.useMemo(
    () => filtered.some((m) => m.name.toLowerCase() === search.toLowerCase()),
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
    // Check if the selected model is inactive
    const selected = models.find((m) => m.name === value);
    if (selected && selected.isActive === false) {
      return `${value} (Not Available)`;
    }
    return value;
  }, [value, models, placeholder]);
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
            placeholder="Search or type model..."
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

        {/* Model list */}
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
                  {models.length === 0
                    ? "No models yet. Type to add your own."
                    : "No models match your search."}
                </div>
              )}

              {filtered.length > 0 && (
                <div className="text-xs px-3 py-1 text-muted-foreground">
                  Showing {filtered.length} models
                </div>
              )}

              {filtered.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange(model.name === value ? "" : model.name);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent  cursor-pointer hover:text-white",
                    model.name === value && "bg-accent font-medium"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      model.name === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {model.name}

                  {model.brand && (
                    <span className="ml-auto text-xs text-black">
                      {model.brand}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

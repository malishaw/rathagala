"use client";

import { useFormContext } from "react-hook-form";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DynamicVehicleFieldsStep2() {
  const form = useFormContext<CreateAdSchema>();
  const type = form.watch("type");

  const renderMileage = (label = "Mileage (km)", placeholder = "e.g., 45000", description?: string) => {
    const quickSelects = [0, 10000, 25000, 50000, 100000];
    return (
      <FormField
        control={form.control}
        name="mileage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={placeholder}
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  field.onChange(isNaN(val) ? undefined : val);
                }}
              />
            </FormControl>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {quickSelects.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => field.onChange(val)}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                >
                  {val === 0 ? "0" : `${val / 1000}k`}
                </button>
              ))}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderEngine = (label = "Engine (cc)", placeholder = "e.g., 1500") => {
    let quickSelects = [1000, 1300, 1500, 2000];
    if (type === "MOTORCYCLE") quickSelects = [100, 125, 150, 250];
    else if (type === "VAN") quickSelects = [1500, 2000, 2500, 3000];
    else if (type === "BUS" || type === "LORRY") quickSelects = [3000, 4000, 5000, 6000];
    
    return (
      <FormField
        control={form.control}
        name="engineCapacity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}{type === "MOTORCYCLE" && <span className="text-red-500">*</span>}</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={placeholder}
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  field.onChange(isNaN(val) ? undefined : val);
                }}
              />
            </FormControl>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {quickSelects.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => field.onChange(val)}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                >
                  {val}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderFuelType = (required = true, options = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "GAS"]) => (
    <FormField
      control={form.control}
      name="fuelType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Fuel Type{required && <span className="text-red-500">*</span>}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.includes("PETROL") && <SelectItem value="PETROL">Petrol</SelectItem>}
              {options.includes("DIESEL") && <SelectItem value="DIESEL">Diesel</SelectItem>}
              {options.includes("HYBRID") && <SelectItem value="HYBRID">Hybrid</SelectItem>}
              {options.includes("ELECTRIC") && <SelectItem value="ELECTRIC">Electric</SelectItem>}
              {options.includes("GAS") && <SelectItem value="GAS">Gas (CNG/LPG)</SelectItem>}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderTransmission = (required = true) => (
    <FormField
      control={form.control}
      name="transmission"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Transmission{required && <span className="text-red-500">*</span>}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="AUTOMATIC">Automatic</SelectItem>
              {type === "CAR" && <SelectItem value="CVT">CVT</SelectItem>}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderColor = () => {
    const commonColors = [
      "Black", "White", "Silver", "Grey", "Red", "Blue", 
      "Brown", "Beige", "Green", "Yellow", "Orange", "Gold", 
      "Bronze", "Purple", "Maroon", "Other"
    ];
    return (
      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-[220px]">
                {commonColors.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  switch (type) {
    case "CAR":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            {renderTransmission()}
            {renderFuelType()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderMileage()}
            {renderEngine()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="bodyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SALOON">Saloon</SelectItem>
                      <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                      <SelectItem value="STATION_WAGON">Station Wagon</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {renderColor()}
          </div>
        </>
      );
    case "VAN":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            {renderMileage("Mileage (km)", "e.g., 50000")}
            {renderEngine("Engine (cc)", "e.g., 2000")}
          </div>
          <div className="mt-3">
            {renderColor()}
          </div>
        </>
      );
    case "MOTORCYCLE":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            {renderMileage("Mileage (km)", "e.g., 15000")}
            {renderEngine("Engine (cc)", "e.g., 150")}
          </div>
          <div className="mt-3">
            {renderColor()}
          </div>
        </>
      );
    case "THREE_WHEEL":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            {renderMileage("Mileage (km)", "e.g., 25000")}
            {renderEngine("Engine (cc)", "e.g., 200")}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {renderFuelType(true, ["PETROL", "DIESEL", "GAS", "ELECTRIC"])}
            {renderColor()}
          </div>
        </>
      );
    case "BUS":
    case "LORRY":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            {renderMileage("Mileage (km)", type === "BUS" ? "e.g., 150000" : "e.g., 200000")}
            {renderEngine("Engine (cc)", type === "BUS" ? "e.g., 4000" : "e.g., 3000")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderFuelType(true, type === "BUS" ? ["DIESEL", "PETROL", "GAS"] : ["DIESEL", "PETROL"])}
            {renderTransmission(false)}
          </div>
          <div className="mt-3">
            {renderColor()}
          </div>
        </>
      );
    case "HEAVY_DUTY":
      return (
        <>
          <div className="mb-3">
            {renderMileage("Operating Hours", "e.g., 5000", "Total operating hours for the machinery")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderEngine("Engine (cc)", "e.g., 6000")}
            {renderFuelType(false, ["DIESEL", "ELECTRIC", "HYBRID"])}
          </div>
          <div className="mt-3">
            {renderColor()}
          </div>
        </>
      );
    case "TRACTOR":
      return (
        <>
          <div className="mb-3">
            {renderMileage("Operating Hours", "e.g., 2000", "Total operating hours for the tractor")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderEngine("Engine (cc)", "e.g., 2500")}
            {renderFuelType(true, ["DIESEL", "PETROL"])}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {renderTransmission(false)}
            {renderColor()}
          </div>
        </>
      );
    default:
      return null;
  }
}

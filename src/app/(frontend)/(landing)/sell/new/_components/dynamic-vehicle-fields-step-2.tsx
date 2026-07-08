"use client";

import { useFormContext } from "react-hook-form";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DynamicVehicleFieldsStep2() {
  const form = useFormContext<CreateAdSchema>();
  const type = form.watch("type");

  const renderMileage = (label = "Mileage (km)", placeholder = "e.g., 45000", description?: string) => (
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
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderEngine = (label = "Engine (cc)", placeholder = "e.g., 1500") => (
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
          <FormMessage />
        </FormItem>
      )}
    />
  );

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
        </>
      );
    case "VAN":
      return (
        <div className="grid grid-cols-2 gap-3">
          {renderMileage("Mileage (km)", "e.g., 50000")}
          {renderEngine("Engine (cc)", "e.g., 2000")}
        </div>
      );
    case "MOTORCYCLE":
      return (
        <div className="grid grid-cols-2 gap-3">
          {renderMileage("Mileage (km)", "e.g., 15000")}
          {renderEngine("Engine (cc)", "e.g., 150")}
        </div>
      );
    case "THREE_WHEEL":
      return (
        <>
          <div className="grid grid-cols-2 gap-3">
            {renderMileage("Mileage (km)", "e.g., 25000")}
            {renderEngine("Engine (cc)", "e.g., 200")}
          </div>
          {renderFuelType(true, ["PETROL", "DIESEL", "GAS", "ELECTRIC"])}
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
          <div className="mt-3">
            {renderTransmission(false)}
          </div>
        </>
      );
    default:
      return null;
  }
}

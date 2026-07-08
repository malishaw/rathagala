"use client";

import { useFormContext } from "react-hook-form";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DynamicVehicleFieldsStep1 } from "@/app/(frontend)/(landing)/sell/new/_components/dynamic-vehicle-fields-step-1";

interface Step1Props {
  onNext: () => void;
  canProceed: boolean;
  adMode: "vehicle" | "auto_part";
  setAdMode: (mode: "vehicle" | "auto_part") => void;
}

export function Step1VehicleInfo({ onNext, canProceed, adMode, setAdMode }: Step1Props) {
  const form = useFormContext<CreateAdSchema>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="listingType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What do you want to do?<span className="text-red-500">*</span></FormLabel>
            <Select
              value={adMode === "auto_part" ? "SELL_AUTO_PART" : field.value}
              onValueChange={(value) => {
                if (value === "SELL_AUTO_PART") {
                  setAdMode("auto_part");
                  field.onChange("SELL");
                  form.setValue("type", "AUTO_PARTS", { shouldValidate: true });
                  // Clear vehicle-specific fields when switching to auto parts
                  form.setValue("brand", "");
                  form.setValue("model", "");
                  form.setValue("manufacturedYear", "");
                  form.setValue("modelYear", "");
                  form.setValue("condition", "");
                  form.setValue("partName", "");
                  form.setValue("partCategoryId", "");
                  form.setValue("compatibleVehicleType", "");
                } else {
                  setAdMode("vehicle");
                  field.onChange(value);
                  const currentType = form.getValues("type");
                  if (currentType === "AUTO_PARTS") {
                    form.setValue("type", "CAR", { shouldValidate: true });
                  }
                  form.setValue("partName", "");
                  form.setValue("partCategoryId", "");
                  form.setValue("compatibleVehicleType", "");
                }
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select listing type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="SELL">Sell Vehicle</SelectItem>
                <SelectItem value="SELL_AUTO_PART">Sell Auto Part</SelectItem>
                <SelectItem value="WANT">Want to Buy</SelectItem>
                <SelectItem value="RENT">Rent Out</SelectItem>
                <SelectItem value="HIRE">Hire</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Vehicle Type - only show when NOT in auto_part mode */}
      {adMode !== "auto_part" && (
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type<span className="text-red-500">*</span></FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset brand/model specific fields when type changes if needed
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CAR">Car</SelectItem>
                  <SelectItem value="VAN">Van</SelectItem>
                  <SelectItem value="MOTORCYCLE">Motor Bike</SelectItem>
                  <SelectItem value="BICYCLE">Bicycle</SelectItem>
                  <SelectItem value="THREE_WHEEL">Three Wheelers</SelectItem>
                  <SelectItem value="BUS">Bus</SelectItem>
                  <SelectItem value="LORRY">Lorries & Trucks</SelectItem>
                  <SelectItem value="HEAVY_DUTY">Heavy Duty</SelectItem>
                  <SelectItem value="TRACTOR">Tractor</SelectItem>
                  <SelectItem value="AUTO_SERVICE">Auto Service</SelectItem>
                  <SelectItem value="RENTAL">Rental</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance and Repair</SelectItem>
                  <SelectItem value="BOAT">Boats & Water Transports</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Dynamic vehicle/auto-part fields based on type */}
      <DynamicVehicleFieldsStep1 />

      <Button
        type="button"
        className="w-full bg-teal-700 hover:bg-teal-800"
        onClick={onNext}
        disabled={!canProceed}
      >
        Continue <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

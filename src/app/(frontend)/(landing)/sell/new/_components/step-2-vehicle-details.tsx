"use client";

import { useFormContext } from "react-hook-form";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicVehicleFieldsStep2 } from "@/app/(frontend)/(landing)/sell/new/_components/dynamic-vehicle-fields-step-2";

interface Step2Props {
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

export function Step2VehicleDetails({ onBack, onNext, canProceed }: Step2Props) {
  const form = useFormContext<CreateAdSchema>();
  const listingType = form.watch("listingType");

  return (
    <div className="space-y-4">
      {listingType !== "SELL" ? (
        <>
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget/Price Range (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 2500000"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      field.onChange(isNaN(val) ? undefined : val);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {listingType === "WANT" ? "Your budget range" :
                   listingType === "RENT" ? "Monthly rent amount" :
                   "Expected price range"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {(listingType === "WANT" || listingType === "RENT") && (
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Condition (optional)</FormLabel>
                  <Select value={field.value || "any"} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="any">Any condition</SelectItem>
                      <SelectItem value="New">Brand New</SelectItem>
                      <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      ) : (
        <>
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (Rs)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 2500000"
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

          <FormField
            control={form.control}
            name="metadata"
            render={({ field }) => {
              const isNegotiable = field.value?.isNegotiable || false;
              return (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                  <FormControl>
                    <Checkbox
                      checked={isNegotiable}
                      onCheckedChange={(checked) => {
                        field.onChange({
                          ...(field.value || {}),
                          isNegotiable: checked
                        });
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Price is Negotiable
                    </FormLabel>
                  </div>
                </FormItem>
              );
            }}
          />

          {/* Dynamic fields based on vehicle type */}
          <DynamicVehicleFieldsStep2 />
        </>
      )}

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description<span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell potential buyers about your vehicle..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          className="w-1/2"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          className="w-1/2 bg-teal-700 hover:bg-teal-800"
          onClick={onNext}
          disabled={!canProceed}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

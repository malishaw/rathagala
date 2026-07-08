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
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CitySearchDropdown } from "@/components/ui/city-search-dropdown";
import { ModelSearchDropdown } from "@/components/ui/model-search-dropdown";
import { GradeSearchDropdown } from "@/components/ui/grade-search-dropdown";
import { useManufactureYears } from "@/hooks/use-manufacture-years";
import { vehicleMakes, motorbikeBrands } from "@/constants/vehicles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useGetAutoPartCategories } from "@/features/ads/api/use-get-auto-part-categories";
import { useState } from "react";

export function DynamicVehicleFieldsStep1() {
  const form = useFormContext<CreateAdSchema>();
  const listingType = form.watch("listingType");
  const type = form.watch("type");
  const brand = form.watch("brand");
  const model = form.watch("model");
  const partCategoryId = form.watch("partCategoryId");
  const { years: manufactureYears } = useManufactureYears();
  const { data: autoPartCategories = [] } = useGetAutoPartCategories(true);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // If not SELL, show minimal fields
  if (listingType !== "SELL") {
    return (
      <>
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand (optional)</FormLabel>
              <CitySearchDropdown
                cities={type === "MOTORCYCLE" ? motorbikeBrands : vehicleMakes}
                value={field.value || ""}
                onChange={(value) => {
                  field.onChange(value);
                  form.setValue("model", undefined);
                  form.setValue("grade", undefined);
                }}
                placeholder="Select brand"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model (optional)</FormLabel>
              <ModelSearchDropdown
                value={field.value || ""}
                onChange={(v) => {
                  field.onChange(v);
                  form.setValue("grade", undefined);
                }}
                brand={brand || ""}
                placeholder="Select or type model"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade (optional)</FormLabel>
              <GradeSearchDropdown
                value={field.value || ""}
                onChange={field.onChange}
                model={model || ""}
                brand={brand || ""}
                placeholder="Select or type grade"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={type === "VAN" ? "modelYear" : "manufacturedYear"}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manufacture Year (optional)</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[280px]">
                  {manufactureYears.map(y => (
                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  }

  // Render specific fields for SELL type based on vehicle type
  const renderCondition = () => (
    <FormField
      control={form.control}
      name="condition"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Condition<span className="text-red-500">*</span></FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="New">Brand New</SelectItem>
              {type !== "MOTORCYCLE" && type !== "BICYCLE" && type !== "BOAT" && type !== "AUTO_PARTS" && (
                <SelectItem value="Reconditioned">Reconditioned</SelectItem>
              )}
              <SelectItem value="Used">Used</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderBrand = (makes = vehicleMakes) => (
    <FormField
      control={form.control}
      name="brand"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Brand<span className="text-red-500">*</span></FormLabel>
          <CitySearchDropdown
            cities={makes}
            value={field.value || ""}
            onChange={(value) => {
              field.onChange(value);
              form.setValue("model", undefined);
              form.setValue("grade", undefined);
            }}
            placeholder="Select brand"
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderModel = () => (
    <FormField
      control={form.control}
      name="model"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Model<span className="text-red-500">*</span></FormLabel>
          <ModelSearchDropdown
            value={field.value || ""}
            onChange={(v) => {
              field.onChange(v);
              form.setValue("grade", undefined);
            }}
            brand={brand || ""}
            placeholder="Select or type model"
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderGrade = () => (
    <FormField
      control={form.control}
      name="grade"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Grade</FormLabel>
          <GradeSearchDropdown
            value={field.value || ""}
            onChange={field.onChange}
            model={model || ""}
            brand={brand || ""}
            placeholder="Select or type grade"
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderManufacturedYear = (fieldName: "manufacturedYear" | "modelYear" = "manufacturedYear") => (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{fieldName === "modelYear" ? "Model Year" : "Year of Manufacture"}<span className="text-red-500">*</span></FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-[280px]">
              {manufactureYears.map(y => (
                <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
              ))}
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
          {renderCondition()}
          {renderBrand()}
          {renderModel()}
          {renderGrade()}
          <FormField
            control={form.control}
            name="trimEdition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trim / Edition</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sport" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {renderManufacturedYear("manufacturedYear")}
        </>
      );
    case "VAN":
      return (
        <>
          {renderCondition()}
          {renderBrand()}
          {renderModel()}
          {renderGrade()}
          <FormField
            control={form.control}
            name="trimEdition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trim / Edition</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., GL" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {renderManufacturedYear("modelYear")}
        </>
      );
    case "MOTORCYCLE":
      return (
        <>
          {renderCondition()}
          <FormField
            control={form.control}
            name="bikeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bike Type<span className="text-red-500">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select bike type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SCOOTER">Scooter</SelectItem>
                    <SelectItem value="E_BIKE">E-Bike</SelectItem>
                    <SelectItem value="MOTORBIKES">Motorbikes</SelectItem>
                    <SelectItem value="QUADRICYCLES">Quadricycles</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {renderBrand(motorbikeBrands)}
          {renderModel()}
          {renderGrade()}
          {renderManufacturedYear("manufacturedYear")}
        </>
      );
    case "BICYCLE":
      return (
        <>
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand<span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Giant" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {renderCondition()}
        </>
      );
    case "THREE_WHEEL":
    case "BUS":
    case "LORRY":
    case "TRACTOR":
      return (
        <>
          {renderCondition()}
          {renderBrand()}
          {renderModel()}
          {renderGrade()}
          {renderManufacturedYear("manufacturedYear")}
        </>
      );
    case "HEAVY_DUTY":
      return (
        <>
          {renderCondition()}
          <FormField
            control={form.control}
            name="vehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Type<span className="text-red-500">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BED_TRAILER">Bed Trailer</SelectItem>
                    <SelectItem value="BOWSER">Bowser</SelectItem>
                    <SelectItem value="BULLDOZER">Bulldozer</SelectItem>
                    <SelectItem value="CRANE">Crane</SelectItem>
                    <SelectItem value="DUMP_TRUCK">Dump Truck</SelectItem>
                    <SelectItem value="EXCAVATOR">Excavator</SelectItem>
                    <SelectItem value="LOADER">Loader</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {renderBrand()}
          {renderModel()}
          {renderManufacturedYear("manufacturedYear")}
        </>
      );
    case "AUTO_SERVICE":
    case "RENTAL":
      return (
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type<span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  placeholder={type === "AUTO_SERVICE" ? "e.g., Car Wash, Repair" : "e.g., Car Rental, Van Rental"}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "MAINTENANCE":
      return (
        <FormField
          control={form.control}
          name="maintenanceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance and Repair Type<span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g., Engine Repair, Body Work" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "BOAT":
      return renderCondition();
    case "AUTO_PARTS":
      return (
        <>
          <FormField
            control={form.control}
            name="partName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part Name<span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Wind Shield, Seat Cover, Brake Pad" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="compatibleVehicleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compatible Vehicle Type<span className="text-red-500">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select vehicle type this part fits" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ALL">All Vehicles</SelectItem>
                    <SelectItem value="CAR">Car</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                    <SelectItem value="BICYCLE">Bicycle</SelectItem>
                    <SelectItem value="THREE_WHEEL">Three Wheeler</SelectItem>
                    <SelectItem value="BUS">Bus</SelectItem>
                    <SelectItem value="LORRY">Lorry / Truck</SelectItem>
                    <SelectItem value="HEAVY_DUTY">Heavy Duty</SelectItem>
                    <SelectItem value="TRACTOR">Tractor</SelectItem>
                    <SelectItem value="BOAT">Boat</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {renderCondition()}
          <FormField
            control={form.control}
            name="partCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part Category<span className="text-red-500">*</span></FormLabel>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        className="w-full justify-between font-normal"
                        disabled={autoPartCategories.length === 0}
                      >
                        {field.value
                          ? autoPartCategories.find((cat) => cat.id === field.value)?.name
                          : (autoPartCategories.length === 0 ? "No categories available" : "Select category")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {autoPartCategories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name}
                            onSelect={() => {
                              field.onChange(cat.id);
                              setCategoryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === cat.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {autoPartCategories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No categories found. Admin needs to add categories first.</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compatible Vehicle Brand<span className="text-red-500">*</span></FormLabel>
                <CitySearchDropdown
                  cities={["Any", ...vehicleMakes]}
                  value={field.value || ""}
                  onChange={(value) => {
                    field.onChange(value);
                    form.setValue("model", undefined);
                  }}
                  placeholder="Select vehicle brand"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compatible Vehicle Model (optional)</FormLabel>
                <ModelSearchDropdown
                  value={field.value || ""}
                  onChange={field.onChange}
                  brand={brand || ""}
                  placeholder="Select or type model"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    default:
      return null;
  }
}

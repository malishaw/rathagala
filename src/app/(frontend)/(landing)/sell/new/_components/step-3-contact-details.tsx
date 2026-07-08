"use client";

import { useFormContext } from "react-hook-form";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CitySearchDropdown } from "@/components/ui/city-search-dropdown";
import { useLocations } from "@/hooks/use-locations";
import { useState } from "react";
import { MediaGallery } from "@/modules/media/components/media-gallery";
import type { MediaFile } from "@/modules/media/types";
import { Camera, PlusCircle, X, Loader2, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Step3Props {
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
  showBoostDialog: boolean;
  setShowBoostDialog: React.Dispatch<React.SetStateAction<boolean>>;
  selectedImages: MediaFile[];
  setSelectedImages: React.Dispatch<React.SetStateAction<MediaFile[]>>;
  canProceed: boolean;
}

export function Step3ContactDetails({
  onBack,
  onSubmit,
  isPending,
  showBoostDialog,
  setShowBoostDialog,
  selectedImages,
  setSelectedImages,
  canProceed
}: Step3Props) {
  const form = useFormContext<CreateAdSchema>();
  const { locationData } = useLocations();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const province = form.watch("province");
  const district = form.watch("district");

  // Get available districts based on selected province
  const getAvailableDistricts = () => {
    if (!province) return [];
    return Object.keys(locationData[province] || {});
  };

  // Get available cities based on selected district
  const getAvailableCities = () => {
    if (!province || !district) return [];
    const provinceData = locationData[province];
    return provinceData?.[district] || [];
  };

  // Handle media selection from gallery
  const handleMediaSelect = (media: MediaFile[]) => {
    // Check if we exceed the maximum allowed (6 images)
    if (media.length > 6) {
      setSelectedImages(media.slice(0, 6));
    } else {
      setSelectedImages(media);
    }
    // Note: We'll set mediaIds in the parent component during submit
  };

  // Handle removing a media item
  const removeMedia = (idToRemove: string) => {
    setSelectedImages(prev => prev.filter((media) => media.id !== idToRemove));
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your Name<span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input placeholder="Enter your name" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number<span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input placeholder="e.g., 0777123456" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="whatsappNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>WhatsApp Number (optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., 0777123456" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="province"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Province<span className="text-red-500">*</span></FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("district", undefined);
                form.setValue("city", undefined);
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.keys(locationData).map(prov => (
                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="district"
        render={({ field }) => (
          <FormItem>
            <FormLabel>District<span className="text-red-500">*</span></FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("city", undefined);
              }}
              disabled={!province}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={province ? "Select district" : "Select province first"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {getAvailableDistricts().map(dist => (
                  <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City<span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <CitySearchDropdown
                cities={getAvailableCities()}
                value={field.value || ""}
                onChange={field.onChange}
                disabled={!district}
                placeholder="Select city"
                disabledPlaceholder="Select district first"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location/Area<span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input placeholder="e.g., Nugegoda" {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="termsAndConditions"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 mt-2 space-y-0">
            <FormControl>
              <Switch
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-sm">
                I agree to the Terms & Conditions<span className="text-red-500">*</span>
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Image Selection Section */}
      <div className="pt-2">
        <label className="block text-sm font-medium mb-2">Vehicle Images<span className="ms-1 text-red-500">*</span></label>
        <p className="text-xs text-slate-500 mb-3">
          Select up to 6 images from your media gallery. First image will be the main photo.
        </p>

        {/* Media Gallery Button */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center mb-3">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Camera className="h-10 w-10 text-slate-400" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">
                {selectedImages.length === 0
                  ? "No images selected yet"
                  : selectedImages.length >= 6
                    ? "Maximum images selected (6/6)"
                    : `${selectedImages.length} image(s) selected, you can add ${6 - selectedImages.length
                    } more`}
              </p>
              <p className="text-xs text-slate-500">
                Select images from your media gallery
              </p>
            </div>

            <MediaGallery
              onMediaSelect={handleMediaSelect}
              multiSelect={true}
              open={isGalleryOpen}
              onOpenChange={setIsGalleryOpen}
              title="Select Vehicle Images"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-2"
                disabled={selectedImages.length >= 6}
              >
                <PlusCircle className="h-4 w-4" />
                {selectedImages.length === 0 ? "Select Images" : "Select More"}
              </Button>
            </MediaGallery>
          </div>
        </div>

        {/* Image Preview Grid */}
        {selectedImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedImages.length} of 6 images
              </p>
              <p className="text-xs text-slate-500">
                {selectedImages.length === 6 ? "Maximum reached" : "First image is main"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {selectedImages.map((image, index) => (
                <div key={image.id} className="relative group aspect-square">
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-slate-200"
                  />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-teal-700 text-white text-xs px-2 py-0.5 rounded">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(image.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            type="button"
            className="flex-1 bg-teal-700 hover:bg-teal-800"
            onClick={onSubmit}
            disabled={isPending || !canProceed}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : showBoostDialog ? "Post Ad" : "Post Ad"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1 bg-orange-400 hover:bg-orange-400/70"
            onClick={() => setShowBoostDialog((v) => !v)}
            disabled={isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            {showBoostDialog ? "Hide Boost Options" : "Boost Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

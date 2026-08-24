"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateAd } from "@/features/ads/api/use-update-ad";
import type { AdType } from "@/features/ads/components/ad-table/admin-columns";
import { ExternalLink, Save, Sparkles, Check, Car, User, Phone, MapPin, DollarSign } from "lucide-react";

interface QuickEditAdModalProps {
  ad: AdType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickEditAdModal({ ad, open, onOpenChange }: QuickEditAdModalProps) {
  const updateMutation = useUpdateAd();

  const [title, setTitle] = useState(ad.title || "");
  const [brand, setBrand] = useState(ad.brand || "");
  const [model, setModel] = useState(ad.model || "");
  const [trimEdition, setTrimEdition] = useState(ad.trimEdition || "");
  const [manufacturedYear, setManufacturedYear] = useState(ad.manufacturedYear || "");
  const [price, setPrice] = useState(ad.price ? String(ad.price) : "");
  const [isNegotiable, setIsNegotiable] = useState(
    (ad.metadata as any)?.isNegotiable ?? false
  );
  const [mileage, setMileage] = useState(ad.mileage ? String(ad.mileage) : "");
  const [status, setStatus] = useState<string>(ad.status || "ACTIVE");
  const [boosted, setBoosted] = useState<boolean>(ad.boosted || false);
  const [featured, setFeatured] = useState<boolean>(ad.featured || false);
  const [name, setName] = useState(ad.name || "");
  const [phoneNumber, setPhoneNumber] = useState(ad.phoneNumber || "");
  const [whatsappNumber, setWhatsappNumber] = useState(ad.whatsappNumber || "");
  const [city, setCity] = useState(ad.city || "");
  const [district, setDistrict] = useState(ad.district || "");
  const [rejectionDescription, setRejectionDescription] = useState(ad.rejectionDescription || "");

  // Sync state whenever ad prop updates
  useEffect(() => {
    if (open) {
      setTitle(ad.title || "");
      setBrand(ad.brand || "");
      setModel(ad.model || "");
      setTrimEdition(ad.trimEdition || "");
      setManufacturedYear(ad.manufacturedYear || "");
      setPrice(ad.price ? String(ad.price) : "");
      setIsNegotiable((ad.metadata as any)?.isNegotiable ?? false);
      setMileage(ad.mileage ? String(ad.mileage) : "");
      setStatus(ad.status || "ACTIVE");
      setBoosted(ad.boosted || false);
      setFeatured(ad.featured || false);
      setName(ad.name || "");
      setPhoneNumber(ad.phoneNumber || "");
      setWhatsappNumber(ad.whatsappNumber || "");
      setCity(ad.city || "");
      setDistrict(ad.district || "");
      setRejectionDescription(ad.rejectionDescription || "");
    }
  }, [ad, open]);

  const handleSave = () => {
    const payload: any = {
      title: title.trim(),
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      trimEdition: trimEdition.trim() || undefined,
      manufacturedYear: manufacturedYear.trim() || undefined,
      price: price ? Number(price) : null,
      mileage: mileage ? Number(mileage) : null,
      name: name.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      city: city.trim() || undefined,
      district: district.trim() || undefined,
      status: status as any,
      boosted,
      featured,
      rejectionDescription: status === "REJECTED" ? rejectionDescription.trim() || null : null,
      metadata: {
        ...((ad.metadata as any) || {}),
        isNegotiable,
      },
    };

    updateMutation.mutate(
      { id: ad.id, values: payload },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>Quick Edit Ad</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  ID: {ad.id.slice(0, 8)}...
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Quickly update pricing, contact information, and listing status
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8 border-teal-600 text-teal-700 hover:bg-teal-50"
              onClick={() => window.open(`/dashboard/ads/${ad.id}`, "_blank")}
            >
              <span>Full Edit Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Promotion Banner */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Listing Status & Visibility
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="quick-status" className="text-xs font-medium">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="quick-status" className="h-8 text-xs">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE" className="text-xs">Active (Published)</SelectItem>
                    <SelectItem value="PENDING_REVIEW" className="text-xs">Pending Review</SelectItem>
                    <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                    <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                    <SelectItem value="EXPIRED" className="text-xs">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-0">
                <div className="space-y-0.5">
                  <Label htmlFor="quick-boosted" className="text-xs font-medium">Boost Ad</Label>
                  <p className="text-[10px] text-muted-foreground">Top / Bump highlight</p>
                </div>
                <Switch
                  id="quick-boosted"
                  checked={boosted}
                  onCheckedChange={setBoosted}
                />
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-0">
                <div className="space-y-0.5">
                  <Label htmlFor="quick-featured" className="text-xs font-medium">Featured Ad</Label>
                  <p className="text-[10px] text-muted-foreground">Homepage featured</p>
                </div>
                <Switch
                  id="quick-featured"
                  checked={featured}
                  onCheckedChange={setFeatured}
                />
              </div>
            </div>

            {status === "REJECTED" && (
              <div className="pt-2 space-y-1.5">
                <Label htmlFor="quick-rejection" className="text-xs font-medium text-red-600">Rejection Reason</Label>
                <Input
                  id="quick-rejection"
                  placeholder="Reason for rejection (e.g. Inappropriate images, Duplicate listing)..."
                  value={rejectionDescription}
                  onChange={(e) => setRejectionDescription(e.target.value)}
                  className="h-8 text-xs border-red-200"
                />
              </div>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-teal-600" />
              Vehicle Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="quick-title" className="text-xs">Ad Title</Label>
                <Input
                  id="quick-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Toyota Prius S Grade 2018"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-brand" className="text-xs">Brand / Make</Label>
                <Input
                  id="quick-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Toyota"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-model" className="text-xs">Model</Label>
                <Input
                  id="quick-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Prius"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-trim" className="text-xs">Trim / Edition</Label>
                <Input
                  id="quick-trim"
                  value={trimEdition}
                  onChange={(e) => setTrimEdition(e.target.value)}
                  placeholder="e.g. G Touring, S Grade"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-year" className="text-xs">Manufactured Year</Label>
                <Input
                  id="quick-year"
                  value={manufacturedYear}
                  onChange={(e) => setManufacturedYear(e.target.value)}
                  placeholder="e.g. 2018"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-mileage" className="text-xs">Mileage (km)</Label>
                <Input
                  id="quick-mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g. 65000"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-teal-600" />
              Pricing
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="quick-price" className="text-xs">Price (LKR)</Label>
                <Input
                  id="quick-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 8500000"
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <Switch
                  id="quick-negotiable"
                  checked={isNegotiable}
                  onCheckedChange={setIsNegotiable}
                />
                <Label htmlFor="quick-negotiable" className="text-xs cursor-pointer font-medium">
                  Price is Negotiable
                </Label>
              </div>
            </div>
          </div>

          {/* Seller & Contact */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Contact & Location
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quick-name" className="text-xs">Seller Name</Label>
                <Input
                  id="quick-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seller contact name"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-phone" className="text-xs">Phone Number</Label>
                <Input
                  id="quick-phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07xxxxxxxx"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-whatsapp" className="text-xs">WhatsApp Number</Label>
                <Input
                  id="quick-whatsapp"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="07xxxxxxxx"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quick-district" className="text-xs">District</Label>
                <Input
                  id="quick-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Colombo"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="quick-city" className="text-xs">City / Town</Label>
                <Input
                  id="quick-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nugegoda"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="text-xs gap-1.5 bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {updateMutation.isPending ? "Saving Changes..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

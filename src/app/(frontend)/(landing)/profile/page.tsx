/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DELETE_AD_REASONS, type DeleteAdReason } from "@/constants/delete-reasons";
import { useGetUserAds } from "@/features/ads/api/use-get-user-ads";
import { SignoutButton } from "@/features/auth/components/signout-button";
import { useGetFavorites } from "@/features/saved-ads/api/use-get-favorites";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { MediaGallery } from "@/modules/media/components/media-gallery";
import type { MediaFile } from "@/modules/media/types";
import { buildAdUrl } from "@/lib/ad-url";
import { betterFetch } from "@better-fetch/fetch";
import { format } from "date-fns";
import { getRelativeTime } from "@/lib/utils";
import { Building2, Calendar, Car, CheckCircle, ChevronRight, Edit, Eye, Bookmark, Loader2, Lock, MapPin, MessageCircle, Phone, Trash2, Camera, Zap, Mail, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BoostSelector, type BoostSelection } from "@/features/boost/components/boost-selector";
import { useRequestBoost } from "@/features/boost/api/use-request-boost";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocations } from "@/hooks/use-locations";
import { CitySearchDropdown } from "@/components/ui/city-search-dropdown";

// User type from auth
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  whatsappNumber?: string;
  province?: string;
  district?: string;
  city?: string;
  location?: string;
  phoneVerified?: "verified" | "not_verified" | "rejected" | null;
  organization?: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
}

// Ad type
interface UserAd {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  createdAt: string;
  updatedAt?: string | null;
  seoSlug?: string | null;
  status?: string;
  media?: Array<{
    media: {
      url: string;
    }
  }>;
  views?: number;
  brand?: string | null;
  model?: string | null;
  manufacturedYear?: string | null;
  type?: string | null;
  analytics?: { views?: number } | null;
  topAdActive?: boolean;
  bumpActive?: boolean;
  urgentActive?: boolean;
  featuredActive?: boolean;
}

export default function ProfilePage() {
  // State for delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ad: UserAd | null }>({ open: false, ad: null });
  const [deleteReason, setDeleteReason] = useState<DeleteAdReason>(DELETE_AD_REASONS[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessDialog, setDeleteSuccessDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { locationData, provinces: locationProvinces } = useLocations();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarActive, setSidebarActive] = useState("personal");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [adsFilter, setAdsFilter] = useState<string>("all");
  const [boostDialog, setBoostDialog] = useState<{ open: boolean; adId: string | null }>({ open: false, adId: null });
  const [boostSelection, setBoostSelection] = useState<BoostSelection | null>(null);
  const { mutate: requestBoost, isPending: isBoostPending } = useRequestBoost();

  // Fetch user ads with the new hook
  const userAdsQuery = useGetUserAds();

  // Fetch favorites
  const { data: favorites, isLoading: isFavoritesLoading } = useGetFavorites();

  // Form data for profile edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    province: "",
    district: "",
    city: "",
    location: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch user data directly from /api/users/me
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);

      try {
        const { data: meData, error } = await betterFetch<any>("/api/users/me");

        if (error || !meData) {
          router.push("/signin?callbackUrl=/profile");
          return;
        }

        const fullUser = {
          id: meData.id,
          name: meData.name,
          email: meData.email,
          avatar: meData.image || meData.avatar,
          phone: meData.phone,
          phoneVerified: meData.phoneVerified,
          organization: meData.organization,
          whatsappNumber: meData.whatsappNumber,
          province: meData.province,
          district: meData.district,
          city: meData.city,
          location: meData.location
        };

        setUser(fullUser);

        // Initialize form data with user info
        setFormData({
          name: fullUser.name || "",
          email: fullUser.email || "",
          phone: fullUser.phone || "",
          whatsappNumber: fullUser.whatsappNumber || "",
          province: fullUser.province || "",
          district: fullUser.district || "",
          city: fullUser.city || "",
          location: fullUser.location || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/signin?callbackUrl=/profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Handle hash navigation (e.g., #my-ads)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'my-ads') {
      setSidebarActive('ads');
    }
  }, []);

  // Silently check and send 2-week ad notification emails (fires once per page load, non-blocking)
  useEffect(() => {
    fetch("/api/check-ad-notifications", { method: "POST" }).catch(() => {});
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change for location fields
  const handleFilterChange = (field: string, value: string) => {
    if (field === "province") {
      setFormData(prev => ({ ...prev, province: value, district: "", city: "" }));
    } else if (field === "district") {
      setFormData(prev => ({ ...prev, district: value, city: "" }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Get districts for selected province
  const getDistrictsForProvince = (province: string): string[] => {
    if (!province || !locationData[province]) return [];
    return Object.keys(locationData[province]);
  };

  // Get cities for selected district
  const getCitiesForDistrict = (province: string, district: string): string[] => {
    if (!province || !district || !locationData[province] || !locationData[province][district]) return [];
    return locationData[province][district];
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await betterFetch<any>("/api/user/profile", {
        method: "PATCH",
        body: {
          name: formData.name,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          province: formData.province,
          district: formData.district,
          city: formData.city,
          location: formData.location
        }
      });

      if (!response.data?.user) {
        const message =
          (response.error as any)?.message ||
          (response.data as any)?.message ||
          "This phone number already in use. Add another";
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSaving(false);
        return;
      }

      if (user) {
        setUser({
          ...user,
          name: formData.name,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          province: formData.province,
          district: formData.district,
          city: formData.city,
          location: formData.location
        });
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast.success("Profile updated successfully");

    } catch (error: any) {
      console.error("Error updating profile:", error);
      const message =
        error?.error?.message ||
        error?.data?.message ||
        error?.body?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "This phone number already in use. Add another";
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    setIsSaving(true);

    try {
      const { error } = await betterFetch("/api/user/change-password", {
        method: "POST",
        body: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to change password");
      }

      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast.success("Password changed successfully");

    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  // Format price to display with commas
  const formatPrice = (price: number | null, isNegotiable = false) => {
    if (price === null && isNegotiable) return "Negotiable";
    if (price === null) return "Price on request";
    const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (isNegotiable) {
      return <>{formatted}<span className="text-sm font-normal opacity-70"> Negotiable</span></>;
    }
    return formatted;
  };

  // Get phone verification badge
  const getPhoneVerificationBadge = (status: "verified" | "not_verified" | "rejected" | null | undefined) => {
    if (!status) {
      return <Badge variant="outline" className="text-zinc-500 text-xs border-zinc-200">Not Verified</Badge>;
    }

    switch (status) {
      case "verified":
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-xs">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      case "not_verified":
      default:
        return <Badge variant="outline" className="text-amber-700 text-xs border-amber-200">Not Verified</Badge>;
    }
  };

  // Format vehicle type for display
  const formatVehicleType = (type?: string | null) => {
    if (!type) return "";
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Handle delete ad
  const handleDeleteAd = async (ad: UserAd) => {
    setIsDeleting(true);
    try {
      const { error } = await betterFetch<{ message?: string }>(`/api/ad/${ad.id}`, {
        method: "DELETE",
        body: { reason: deleteReason },
      });
      if (error) {
        throw new Error(error.message || "Failed to delete ad");
      }
      userAdsQuery.refetch();

      const parts = [
        ad.brand,
        ad.model,
        ad.manufacturedYear,
        formatVehicleType(ad.type),
      ].filter(Boolean);
      const adDescription = parts.length > 0 ? parts.join(" ") : ad.title;
      setDeleteSuccessDialog({
        open: true,
        message: `Your ${adDescription} ad successfully deleted.`,
      });

      setDeleteDialog({ open: false, ad: null });
      setDeleteReason(DELETE_AD_REASONS[0]);
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast.error("Failed to delete ad");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle profile photo selection
  const handlePhotoSelect = async (media: MediaFile[]) => {
    if (media.length === 0) return;

    const selectedPhoto = media[0];
    setIsSavingPhoto(true);

    try {
      const response = await betterFetch<any>("/api/user/profile", {
        method: "PATCH",
        body: {
          name: formData.name,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          province: formData.province,
          district: formData.district,
          city: formData.city,
          location: formData.location,
          image: selectedPhoto.url
        }
      });

      if (!response.data?.user) {
        const errorMsg = (response.error as any)?.message ||
          (response.data as any)?.message ||
          "Failed to update profile photo";
        throw new Error(errorMsg);
      }

      if (user) {
        setUser({
          ...user,
          avatar: selectedPhoto.url
        });
      }

      toast.success("Profile photo updated");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error updating profile photo:", error);
      const message = error?.error?.message || error?.message || "Failed to update profile photo";
      toast.error(message);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Handle remove profile photo
  const handleRemovePhoto = async () => {
    setIsSavingPhoto(true);

    try {
      const response = await betterFetch<any>("/api/user/profile", {
        method: "PATCH",
        body: {
          name: formData.name,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          province: formData.province,
          district: formData.district,
          city: formData.city,
          location: formData.location,
          image: null
        }
      });

      if (!response.data?.user) {
        const errorMsg = (response.error as any)?.message ||
          (response.data as any)?.message ||
          "Failed to remove profile photo";
        throw new Error(errorMsg);
      }

      if (user) {
        setUser({
          ...user,
          avatar: undefined
        });
      }

      toast.success("Profile photo removed");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error removing profile photo:", error);
      const message = error?.error?.message || error?.message || "Failed to remove profile photo";
      toast.error(message);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      return getRelativeTime(dateStr);
    } catch (e) {
      return dateStr;
    }
  };

  // Get ad image
  const getAdImage = (ad: UserAd) => {
    if (ad.media && ad.media.length > 0 && ad.media[0].media) {
      return ad.media[0].media.url;
    }
    return "";
  };

  const getBoostTotalAmount = (ad: any): string => {
    const value =
      ad?.boostTotalAmount ??
      ad?.boostRequests?.[0]?.totalAmount ??
      ad?.metadata?.boostTotalAmount ??
      null;

    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    return numericValue.toLocaleString("en-LK");
  };

  const getAddedPromotions = (ad: any): string[] => {
    const promotions: string[] = [];

    if (ad?.topAdActive || ad?.boostTypes?.includes("TOP_AD")) {
      promotions.push("Top Ad");
    }
    if (ad?.bumpActive || ad?.boostTypes?.includes("BUMP")) {
      promotions.push("Bump Up");
    }
    if (ad?.urgentActive || ad?.boostTypes?.includes("URGENT")) {
      promotions.push("Urgent");
    }
    if (ad?.featuredActive || ad?.boostTypes?.includes("FEATURED")) {
      promotions.push("Featured");
    }

    return promotions;
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500 text-white border-0">Active</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-amber-500 text-white border-0">Pending Review</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500 text-white border-0">Rejected</Badge>;
      case "DRAFT":
        return <Badge variant="outline" className="border-zinc-200">Draft</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="border-zinc-200">Expired</Badge>;
      default:
        return <Badge variant="outline" className="border-zinc-200">{status}</Badge>;
    }
  };

  const userAds = useMemo(() => {
    const rawUserAds = userAdsQuery.data || [];
    return Array.isArray(rawUserAds) ? rawUserAds : rawUserAds.ads || [];
  }, [userAdsQuery.data]);

  const sortByUpdatedDesc = (ads: UserAd[]) =>
    [...ads].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  const filteredAds = useMemo(() => {
    if (adsFilter === "pending") return sortByUpdatedDesc(userAds.filter((ad: UserAd) => ad.status === "PENDING_REVIEW"));
    if (adsFilter === "rejected") return sortByUpdatedDesc(userAds.filter((ad: UserAd) => ad.status === "REJECTED"));

    const activeAds = userAds.filter((ad: UserAd) => ad.status !== "EXPIRED");

    if (adsFilter === "all") return sortByUpdatedDesc(activeAds);
    if (adsFilter === "top") return sortByUpdatedDesc(activeAds.filter((ad: UserAd) => !!ad.topAdActive));
    if (adsFilter === "bump") return sortByUpdatedDesc(activeAds.filter((ad: UserAd) => !!ad.bumpActive));
    if (adsFilter === "urgent") return sortByUpdatedDesc(activeAds.filter((ad: UserAd) => !!ad.urgentActive));
    if (adsFilter === "featured") return sortByUpdatedDesc(activeAds.filter((ad: UserAd) => !!ad.featuredActive));

    return sortByUpdatedDesc(activeAds);
  }, [userAds, adsFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-[#024950]" />
      </div>
    );
  }

  if (!user) return null;

  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";
  const isAdsLoading = userAdsQuery.isLoading;

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <Dialog open={boostDialog.open} onOpenChange={(open) => setBoostDialog({ open, adId: open ? boostDialog.adId : null })}>
          <DialogContent className="max-w-3xl bg-white border border-zinc-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-zinc-900">
                <Zap className="h-5 w-5 text-teal-600" />
                Boost Your Ad
              </DialogTitle>
            </DialogHeader>
            <BoostSelector onChange={setBoostSelection} showPaymentDetails={true} layout="two-column" />
            <DialogFooter className="gap-2">
              <Button variant="outline" className="border-zinc-200 hover:bg-zinc-50" onClick={() => setBoostDialog({ open: false, adId: null })}>
                Cancel
              </Button>
              <Button
                className="bg-[#024950] hover:bg-[#0D5C63] text-white"
                disabled={!boostSelection || boostSelection.boostTypes.length === 0 || isBoostPending}
                onClick={() => {
                  if (!boostDialog.adId || !boostSelection || boostSelection.boostTypes.length === 0) return;
                  requestBoost(
                    {
                      adId: boostDialog.adId,
                      boostTypes: boostSelection.boostTypes,
                      bumpDays: boostSelection.bumpDays,
                      topAdDays: boostSelection.topAdDays,
                      urgentDays: boostSelection.urgentDays,
                      featuredDays: boostSelection.featuredDays,
                    },
                    { onSuccess: () => setBoostDialog({ open: false, adId: null }) }
                  );
                }}
              >
                {isBoostPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                Boost Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
          <AlertDialogContent className="bg-white border border-zinc-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-zinc-800 font-bold">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-500">
                This action cannot be undone. This will permanently delete the advertisement "{deleteDialog.ad?.title}" and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              <label className="text-xs font-semibold text-zinc-700">Reason for deletion</label>
              <Select value={deleteReason} onValueChange={value => setDeleteReason(value as DeleteAdReason)}>
                <SelectTrigger className="border-zinc-200">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {DELETE_AD_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} className="border border-zinc-200 bg-white hover:bg-zinc-50">Cancel</AlertDialogCancel>
              <AlertDialogAction
                asChild
                onClick={e => {
                  e.preventDefault();
                  if (deleteDialog.ad) handleDeleteAd(deleteDialog.ad);
                }}
              >
                <Button variant="destructive" disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Success Popup */}
        <AlertDialog open={deleteSuccessDialog.open} onOpenChange={open => { if (!open) setDeleteSuccessDialog({ open: false, message: "" }); }}>
          <AlertDialogContent className="bg-white border border-zinc-200 max-w-md">
            <AlertDialogHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-zinc-800">Ad Deleted</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-zinc-500 pt-2">
                {deleteSuccessDialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="justify-center sm:justify-center">
              <AlertDialogAction
                className="bg-[#024950] text-white hover:bg-[#0D5C63] border-0 px-8"
                onClick={() => setDeleteSuccessDialog({ open: false, message: "" })}
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success indicator */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-white border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg flex items-center z-50 animate-in slide-in-from-top text-sm font-medium">
            <CheckCircle className="h-4 w-4 mr-2" />
            Changes saved successfully!
          </div>
        )}

        {/* Error indicator */}
        {errorMessage && (
          <div className="fixed top-4 right-4 bg-white border border-red-200 text-red-700 px-4 py-2.5 rounded-lg flex items-center z-50 animate-in slide-in-from-top text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-zinc-200 pb-4">
          <h1 className="text-2xl font-bold text-zinc-950">My Account</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left sidebar navigation */}
          <div className="md:w-1/4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-6">
              {/* User info at the top of sidebar */}
              <div className="text-center flex flex-col items-center border-b border-zinc-100 pb-5">
                <div className="relative inline-block mb-3 group">
                  <MediaGallery
                    onMediaSelect={handlePhotoSelect}
                    multiSelect={false}
                    title="Change Profile Photo"
                  >
                    <button
                      className="relative cursor-pointer transition-all hover:opacity-90 focus:outline-none"
                      disabled={isSavingPhoto}
                    >
                      <Avatar className="h-20 w-20 border border-zinc-200">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-zinc-100 text-zinc-700 text-2xl font-bold">
                          {firstLetter}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </button>
                  </MediaGallery>
                </div>
                <h2 className="font-bold text-base text-zinc-900 tracking-tight">{user.name}</h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium bg-zinc-50 border border-zinc-200/50 px-2.5 py-0.5 rounded-full">{user.email}</p>
                {user.avatar && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={isSavingPhoto}
                    className="text-xs cursor-pointer text-red-500 hover:text-red-600 font-semibold mt-2.5 transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Navigation options */}
              <div className="space-y-1">
                <button
                  className={`cursor-pointer w-full text-left py-2.5 px-3.5 rounded-xl transition-colors flex items-center gap-3 text-sm font-medium ${sidebarActive === "personal"
                    ? "bg-[#024950] text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  onClick={() => setSidebarActive("personal")}
                >
                  <User className="w-4 h-4" />
                  Personal Info
                </button>

                <button
                  className={`cursor-pointer w-full text-left py-2.5 px-3.5 rounded-xl transition-colors flex items-center gap-3 text-sm font-medium ${sidebarActive === "security"
                    ? "bg-[#024950] text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  onClick={() => setSidebarActive("security")}
                >
                  <Lock className="w-4 h-4" />
                  Sign-In and Security
                </button>

                <button
                  className={`w-full cursor-pointer text-left py-2.5 px-3.5 rounded-xl transition-colors flex items-center gap-3 text-sm font-medium ${sidebarActive === "ads"
                    ? "bg-[#024950] text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  onClick={() => setSidebarActive("ads")}
                >
                  <Car className="w-4 h-4" />
                  My Ads
                </button>

                <button
                  className={`w-full cursor-pointer text-left py-2.5 px-3.5 rounded-xl transition-colors flex items-center gap-3 text-sm font-medium ${sidebarActive === "favorites"
                    ? "bg-[#024950] text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  onClick={() => setSidebarActive("favorites")}
                >
                  <Bookmark className="w-4 h-4" />
                  Saved Ads
                </button>
              </div>

              {/* Signout Button */}
              <div className="pt-4 border-t border-zinc-100">
                <SignoutButton
                  variant="outline"
                  className="w-full bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Right content area */}
          <div className="md:w-3/4">
            {/* Personal Information */}
            {sidebarActive === "personal" && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-xl font-bold text-zinc-900 mb-1">
                    Personal Information
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Update your details and location settings.
                  </p>
                </div>

                <div className="space-y-6">
                  {user.organization && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-zinc-500" />
                        <div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Organization</div>
                          <div className="font-bold text-sm text-zinc-800">{user.organization.name}</div>
                        </div>
                      </div>
                      <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-100 text-xs font-medium px-2 py-0.5 rounded-full">
                        Assigned
                      </Badge>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Name</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                      <Input
                        value={formData.email}
                        disabled
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl h-10 text-sm text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Phone Number</label>
                      <div className="space-y-2">
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800"
                          placeholder="Your phone number"
                        />
                        <div className="flex items-center gap-2">
                          {getPhoneVerificationBadge(user.phoneVerified)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">WhatsApp Number</label>
                      <Input
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800"
                        placeholder="Your WhatsApp number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Province</label>
                      <Select value={formData.province} onValueChange={(value) => handleFilterChange("province", value)}>
                        <SelectTrigger className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationProvinces.map((p) => (
                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">District</label>
                      <Select
                        value={formData.district}
                        onValueChange={(value) => handleFilterChange("district", value)}
                        disabled={!formData.province}
                      >
                        <SelectTrigger className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800">
                          <SelectValue placeholder={formData.province ? "Select district" : "Select province first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getDistrictsForProvince(formData.province).map((district) => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">City</label>
                      <CitySearchDropdown
                        cities={getCitiesForDistrict(formData.province, formData.district)}
                        value={formData.city}
                        onChange={(value) => handleFilterChange("city", value)}
                        disabled={!formData.district}
                        placeholder="Select city"
                        disabledPlaceholder="Select district first"
                        triggerClassName="w-full bg-white border border-zinc-200 rounded-xl h-10 text-sm text-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Detailed Location</label>
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800"
                        placeholder="Your detailed location"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <Button
                      className="bg-[#024950] hover:bg-[#0D5C63] text-white rounded-xl h-10 px-6 border-0 text-sm font-medium transition-colors"
                      onClick={handleUpdateProfile}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {sidebarActive === "security" && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <h2 className="text-xl font-bold text-zinc-900 mb-1">
                    Sign-In and Security
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Manage your password and security credentials.
                  </p>
                </div>

                <div className="max-w-md space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Current Password</label>
                    <Input
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">New Password</label>
                    <Input
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 focus:border-[#024950] focus:ring-0 transition-colors rounded-xl h-10 text-sm text-zinc-800"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      className="w-full bg-[#024950] hover:bg-[#0D5C63] text-white rounded-xl h-10 border-0 transition-colors text-sm font-medium"
                      onClick={handleChangePassword}
                      disabled={!formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : "Change Password"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* My Ads */}
            {sidebarActive === "ads" && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-100 pb-4">
                  <div id="my-ads">
                    <h2 className="text-xl font-bold text-zinc-900 mb-1">
                      My Ads
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Manage your posted advertisements
                    </p>
                  </div>
                  <Button
                    className="bg-[#024950] hover:bg-[#0D5C63] text-white rounded-xl px-5 h-10 border-0 self-start sm:self-auto text-sm font-medium transition-colors"
                    onClick={() => router.push("/sell/new")}
                  >
                    Post New Ad
                  </Button>
                </div>

                {/* Filter dropdown */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filter:</span>
                  <Select value={adsFilter} onValueChange={setAdsFilter}>
                    <SelectTrigger className="w-48 bg-white border border-zinc-200 rounded-xl h-9 text-xs text-zinc-700">
                      <SelectValue placeholder="All Ads" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ads</SelectItem>
                      <SelectItem value="pending">Pending Ads</SelectItem>
                      <SelectItem value="rejected">Rejected Ads</SelectItem>
                      <SelectItem value="top">Top Ads</SelectItem>
                      <SelectItem value="bump">Bump Up Ads</SelectItem>
                      <SelectItem value="urgent">Urgent Ads</SelectItem>
                      <SelectItem value="featured">Featured Ads</SelectItem>
                    </SelectContent>
                  </Select>
                  {adsFilter !== "all" && (
                    <button
                      onClick={() => setAdsFilter("all")}
                      className="text-xs text-zinc-500 hover:text-zinc-700 underline cursor-pointer transition-colors font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {isAdsLoading ? (
                    <div className="p-12 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#024950]" />
                    </div>
                  ) : filteredAds.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                      <div className="h-10 w-10 border border-zinc-200 rounded-lg bg-white mx-auto flex items-center justify-center mb-3 text-zinc-400">
                        <Car className="h-5 w-5" />
                      </div>
                      {userAds.length === 0 ? (
                        <>
                          <p className="text-zinc-600 mb-4 text-sm font-semibold">You haven't posted any ads yet</p>
                          <Button
                            className="bg-[#024950] hover:bg-[#0D5C63] text-white rounded-xl px-6 h-10 border-0 text-sm font-medium transition-colors"
                            onClick={() => router.push("/sell/new")}
                          >
                            Post Your First Ad
                          </Button>
                        </>
                      ) : (
                        <p className="text-zinc-500 text-sm font-semibold">
                          No ads match this filter
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredAds.map((ad: UserAd) => {
                      return (
                        <div
                          key={ad.id}
                          className="group relative overflow-hidden rounded-xl border border-zinc-250/80 bg-white p-4 transition-colors hover:border-zinc-300 flex flex-col gap-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <button
                              type="button"
                              className="relative h-24 w-full overflow-hidden rounded-xl border border-zinc-100 sm:h-20 sm:w-28 flex-shrink-0 cursor-pointer"
                              onClick={() => router.push(buildAdUrl(ad))}
                            >
                              {getAdImage(ad) ? (
                                <img
                                  src={getAdImage(ad)}
                                  alt={ad.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-zinc-50">
                                  <Car className="h-6 w-6 text-zinc-300" />
                                </div>
                              )}
                            </button>

                            <div className="min-w-0 flex-1 flex flex-col justify-between min-h-[80px]">
                              <div>
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    className="line-clamp-2 text-left text-sm font-bold text-zinc-800 transition-colors hover:text-[#024950] cursor-pointer"
                                    onClick={() => router.push(buildAdUrl(ad))}
                                  >
                                    {ad.title}
                                  </button>
                                  <span className="inline-block">{getStatusBadge(ad.status)}</span>
                                </div>

                                <div className="text-sm font-bold text-zinc-900">
                                  Rs {formatPrice(ad.price, (ad as any).metadata?.isNegotiable)}
                                </div>
                              </div>

                              <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 border border-zinc-200/50 px-2 py-0.5 text-zinc-500 font-medium">
                                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                  <span>Posted: {formatDate(ad.createdAt)}</span>
                                </div>
                                {ad.updatedAt && ad.updatedAt !== ad.createdAt && (
                                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 border border-zinc-200/50 px-2 py-0.5 text-zinc-500 font-medium">
                                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>Updated: {formatDate(ad.updatedAt)}</span>
                                  </div>
                                )}
                                <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 border border-zinc-200/50 px-2 py-0.5 text-zinc-500 font-medium">
                                  <Eye className="h-3.5 w-3.5 text-zinc-400" />
                                  {ad.analytics?.views || 0} views
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col gap-2 sm:items-end flex-wrap mt-2 sm:mt-0">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 shadow-none cursor-pointer text-xs"
                                  onClick={() => router.push(`/edit-ad/${ad.seoSlug || ad.id}`)}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  <span>Edit</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg border-zinc-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-200 shadow-none cursor-pointer text-xs"
                                  onClick={() => setDeleteDialog({ open: true, ad })}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  <span>Delete</span>
                                </Button>
                              </div>

                              <div className="w-full sm:w-auto">
                                {(ad as any).boostStatus === "PENDING" ? (
                                  <Badge className="border-amber-250 bg-amber-50 text-[10px] text-amber-800 font-medium rounded-lg px-2.5 py-0.5">
                                    Boost Requested
                                  </Badge>
                                ) : (ad as any).boostStatus === "ACTIVE" ? (
                                  <div className="rounded-xl border border-emerald-250/50 bg-emerald-50/20 p-2.5 text-left sm:text-right w-full">
                                    <Badge className="mb-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800 font-semibold rounded-lg">Boost Active</Badge>
                                    {getAddedPromotions(ad).length > 0 && (
                                      <div className="text-[10px] font-semibold text-emerald-700">
                                        Active: {getAddedPromotions(ad).join(", ")}
                                      </div>
                                    )}
                                    {(ad as any).boostEndAt && (
                                      <div className="text-[9px] text-emerald-600 font-medium mt-0.5">
                                        Until {format(new Date((ad as any).boostEndAt), "MMM d, yyyy HH:mm")}
                                      </div>
                                    )}
                                  </div>
                                ) : ad.status !== "REJECTED" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-full sm:w-auto rounded-lg border-teal-200 bg-white text-xs text-teal-700 hover:bg-teal-50 hover:border-teal-300 shadow-none cursor-pointer font-semibold"
                                    onClick={() => {
                                      setBoostDialog({ open: true, adId: ad.id });
                                      setBoostSelection(null);
                                    }}
                                  >
                                    <Zap className="mr-1 h-3 w-3 text-teal-600" />
                                    Boost Now
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {ad.status === "PENDING_REVIEW" && (
                            <div className="w-full rounded-lg border border-amber-200/60 bg-amber-50/20 p-3.5">
                              <p className="text-xs text-amber-850">
                                <span className="font-bold">To publish your ad</span>, please send your name via SMS or WhatsApp to{" "}
                                <a href="https://wa.me/94766220170" target="_blank" rel="noopener noreferrer" className="font-bold text-[#024950] hover:underline">0766220170</a>.
                              </p>
                            </div>
                          )}

                          {(ad as any).boostStatus === "PENDING" && (
                            <div className="w-full rounded-xl border border-amber-200 bg-amber-50/20 p-4 space-y-3">
                              <div>
                                <p className="text-xs font-bold text-amber-800">Boost Pending Verification</p>
                                <p className="mt-1 text-xs font-semibold text-amber-705">Amount due: Rs. {getBoostTotalAmount(ad)}</p>
                                <p className="mt-1 text-[11px] text-amber-650 font-medium">Please transfer the amount and WhatsApp the slip to <strong>0766220170</strong>. The admin will verify shortly.</p>
                              </div>
                              <div className="border border-amber-200/40 rounded-lg p-3 bg-white space-y-1 text-xs text-amber-900/80">
                                <p><strong>Bank:</strong> Commercial Bank of Ceylon</p>
                                <p><strong>Account Name:</strong> R.A. Amila</p>
                                <p><strong>Account No:</strong> 8005862029</p>
                                <p><strong>Branch:</strong> Pita Kotte Branch</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Saved Ads Section */}
            {sidebarActive === "favorites" && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="border-b border-zinc-100 pb-4">
                  <div id="saved-ads">
                    <h2 className="text-xl font-bold text-zinc-900 mb-1">
                      Saved Ads
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Your bookmarked and favorite advertisements
                    </p>
                  </div>
                </div>

                {isFavoritesLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#024950]" />
                  </div>
                ) : !favorites || favorites.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                    <div className="h-10 w-10 border border-zinc-200 bg-white rounded-lg mx-auto flex items-center justify-center mb-3 text-zinc-400">
                      <Bookmark className="h-5 w-5" />
                    </div>
                    <p className="text-zinc-600 mb-4 text-sm font-semibold">You haven't saved any ads yet</p>
                    <Button
                      className="bg-[#024950] hover:bg-[#0D5C63] text-white rounded-xl px-6 h-10 border-0 text-sm font-medium transition-colors"
                      onClick={() => router.push("/")}
                    >
                      Browse Ads
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {favorites.map((favorite: any) => {
                      const ad = favorite.ad;
                      const adImage = ad.media?.[0]?.media?.url || "";

                      return (
                        <div
                          key={favorite.id}
                          className="bg-white rounded-xl border border-zinc-200 p-3.5 transition-colors hover:border-zinc-300 cursor-pointer group relative flex gap-4"
                          onClick={() => router.push(buildAdUrl(ad))}
                        >
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <FavoriteButton adId={ad.id} />
                          </div>

                          {/* Ad Image */}
                          <div className="w-24 h-20 sm:w-28 sm:h-20 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
                            {adImage ? (
                              <img
                                src={adImage}
                                alt={ad.title}
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="h-5 w-5 text-zinc-300" />
                              </div>
                            )}
                          </div>

                          {/* Ad Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between pr-6">
                            <div>
                              <h3 className="font-bold text-xs sm:text-sm text-zinc-800 transition-colors group-hover:text-teal-700 line-clamp-1 mb-1">
                                {ad.title}
                              </h3>

                              <div className="text-[10px] sm:text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-zinc-400/80" />
                                <span className="truncate">{ad.location || "No location"}</span>
                              </div>

                              <div className="text-xs sm:text-sm font-bold text-zinc-900">
                                {ad.price
                                  ? <>{`Rs. ${ad.price.toLocaleString()}`}{(ad as any).metadata?.isNegotiable && <span className="text-[10px] sm:text-xs font-normal opacity-70"> Neg</span>}</>
                                  : ((ad as any).metadata?.isNegotiable ? "Negotiable" : "N/A")}
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-semibold mt-1">
                              <span>{formatDate(ad.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
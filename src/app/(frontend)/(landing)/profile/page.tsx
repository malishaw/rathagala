"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetUserAds } from "@/features/ads/api/use-get-user-ads";
import { SignoutButton } from "@/features/auth/components/signout-button";
import { useGetFavorites } from "@/features/saved-ads/api/use-get-favorites";
import { FavoriteButton } from "@/features/saved-ads/components/favorite-button";
import { MediaGallery } from "@/modules/media/components/media-gallery";
import type { MediaFile } from "@/modules/media/types";
import { betterFetch } from "@better-fetch/fetch";
import { format } from "date-fns";
import { Building2, Car, CheckCircle, ChevronRight, CreditCard, Edit, Heart, Loader2, Lock, MapPin, MessageCircle, Phone, Shield, Trash2, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

interface Session {
  user: User;
}

// Ad type
interface UserAd {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  createdAt: string;
  status?: string;
  media?: Array<{
    media: {
      url: string;
    }
  }>;
  views?: number;
}

// Sri Lanka location data
const locationData: Record<string, Record<string, string[]>> = {
  "Western": {
    "Colombo": ["Colombo 1", "Colombo 2", "Colombo 3", "Colombo 4", "Colombo 5", "Colombo 6", "Colombo 7", "Colombo 8", "Colombo 9", "Colombo 10", "Colombo 11", "Colombo 12", "Colombo 13", "Colombo 14", "Colombo 15"],
    "Gampaha": ["Gampaha", "Negombo", "Katunayake", "Wattala", "Kelaniya", "Ja-Ela", "Minuwangoda", "Kadawatha", "Ragama", "Divulapitiya"],
    "Kalutara": ["Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Wadduwa", "Bandaragama"]
  },
  "Central": {
    "Kandy": ["Kandy", "Katugastota", "Gampola", "Nawalapitiya", "Peradeniya", "Akurana", "Kadugannawa"],
    "Matale": ["Matale", "Dambulla", "Sigiriya", "Galewela", "Ukuwela", "Rattota"],
    "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Nandikadal", "Talawakelle", "Bandarawela", "Haputale"]
  },
  "Southern": {
    "Galle": ["Galle", "Hikkaduwa", "Ambalangoda", "Bentota", "Elpitiya", "Baddegama"],
    "Matara": ["Matara", "Weligama", "Mirissa", "Dikwella", "Akuressa", "Hakmana"],
    "Hambantota": ["Hambantota", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta"]
  },
  "Northern": {
    "Jaffna": ["Jaffna", "Nallur", "Chavakachcheri", "Point Pedro", "Karainagar"],
    "Kilinochchi": ["Kilinochchi", "Pallai", "Paranthan"],
    "Mannar": ["Mannar", "Nanattan", "Madhu"],
    "Vavuniya": ["Vavuniya", "Nedunkeni", "Omanthai"],
    "Mullaitivu": ["Mullaitivu", "Pudukudiyiruppu", "Oddusuddan"]
  },
  "Eastern": {
    "Trincomalee": ["Trincomalee", "Kinniya", "Mutur", "Kantale"],
    "Batticaloa": ["Batticaloa", "Kattankudy", "Eravur", "Valachchenai"],
    "Ampara": ["Ampara", "Kalmunai", "Sainthamaruthu", "Akkaraipattu", "Pottuvil"]
  },
  "North Western": {
    "Kurunegala": ["Kurunegala", "Kuliyapitiya", "Narammala", "Wariyapola", "Pannala", "Mawathagama"],
    "Puttalam": ["Puttalam", "Chilaw", "Wennappuwa", "Nattandiya", "Dankotuwa", "Anamaduwa"]
  },
  "North Central": {
    "Anuradhapura": ["Anuradhapura", "Kekirawa", "Tambuttegama", "Eppawala", "Medawachchiya"],
    "Polonnaruwa": ["Polonnaruwa", "Kaduruwela", "Medirigiriya", "Hingurakgoda"]
  },
  "Uva": {
    "Badulla": ["Badulla", "Bandarawela", "Haputale", "Welimada", "Mahiyanganaya", "Hali Ela"],
    "Monaragala": ["Monaragala", "Bibile", "Wellawaya", "Buttala"]
  },
  "Sabaragamuwa": {
    "Ratnapura": ["Ratnapura", "Embilipitiya", "Balangoda", "Pelmadulla", "Eheliyagoda", "Kuruwita"],
    "Kegalle": ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Galigamuwa"]
  }
};

export default function ProfilePage() {
  // State for delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ad: UserAd | null }>({ open: false, ad: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sidebarActive, setSidebarActive] = useState("personal");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  // Fetch user ads with the new hook
  const userAdsQuery = useGetUserAds();

  // Fetch favorites
  const { data: favorites, isLoading: isFavoritesLoading, refetch: refetchFavorites } = useGetFavorites();

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

  // Fetch actual user data from session
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);

      try {
        // Get user session from API
        const { data: session, error } = await betterFetch<Session>("/api/auth/get-session");

        if (error || !session) {
          // If error or no session, redirect to signin
          // Note: Middleware should handle this, but this is a fallback
          router.push("/signin?callbackUrl=/profile");
          return;
        }

        // Fetch full user data to get organization info and phoneVerified
        try {
          const { data: meData } = await betterFetch<any>("/api/users/me");
          
          // Merge session user with full user data from API
          const fullUser = {
            ...session.user,
            phone: meData?.phone || session.user.phone,
            phoneVerified: meData?.phoneVerified || session.user.phoneVerified,
            organization: meData?.organization
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
        } catch (meError) {
          console.error("Error fetching full user data:", meError);
          
          // Fallback to session data if /api/users/me fails
          setUser(session.user);
          
          setFormData({
            name: session.user.name || "",
            email: session.user.email || "",
            phone: session.user.phone || "",
            whatsappNumber: session.user.whatsappNumber || "",
            province: session.user.province || "",
            district: session.user.district || "",
            city: session.user.city || "",
            location: session.user.location || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load profile data");
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

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change for location fields
  const handleFilterChange = (field: string, value: string) => {
    if (field === "province") {
      // Reset district and city when province changes
      setFormData(prev => ({ ...prev, province: value, district: "", city: "" }));
    } else if (field === "district") {
      // Reset city when district changes
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
    setErrorMessage(null); // Clear any previous error

    try {
      // Update user profile via API
      const response = await betterFetch("/api/user/profile", {
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

      // Check if response has error or missing user data (validation error)
      if (!response.data?.user) {
        // Try to extract error message from various possible paths
        const message = 
          (response.error as any)?.message ||
          (response.data as any)?.message || 
          "This phone number already in use. Add another";
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSaving(false);
        return;
      }

      // Update local state
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

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast.success("Profile updated successfully");
      setActiveSection(null);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      // Extract error message from betterFetch thrown error - try multiple paths
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
      // Update password via API
      const { data, error } = await betterFetch("/api/user/change-password", {
        method: "POST",
        body: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to change password");
      }

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      toast.success("Password changed successfully");

    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setActiveSection(null);
      setIsSaving(false);
    }
  };

  // Format price to display with commas
  const formatPrice = (price: number | null) => {
    if (price === null) return "Price on request";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get phone verification badge
  const getPhoneVerificationBadge = (status: "verified" | "not_verified" | "rejected" | null | undefined) => {
    if (!status) {
      return <Badge variant="outline" className="text-gray-500 text-xs">Not Verified</Badge>;
    }
    
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      case "not_verified":
      default:
        return <Badge variant="outline" className="text-yellow-600 text-xs">Not Verified</Badge>;
    }
  };

  // Handle delete ad
  const handleDeleteAd = async (ad: UserAd) => {
    setIsDeleting(true);
    try {
      const { error } = await betterFetch(`/api/ad/${ad.id}`, { method: "DELETE" });
      if (error) {
        throw new Error(error.message || "Failed to delete ad");
      }
      userAdsQuery.refetch();
      toast.success("Ad deleted successfully");
      setDeleteDialog({ open: false, ad: null });
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
      const response = await betterFetch("/api/user/profile", {
        method: "PATCH",
        body: {
          image: selectedPhoto.url
        }
      });

      if (!response.data?.user) {
        throw new Error("Failed to update profile photo");
      }

      if (user) {
        setUser({
          ...user,
          avatar: selectedPhoto.url
        });
      }

      setIsPhotoGalleryOpen(false);
      toast.success("Profile photo updated");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error updating profile photo:", error);
      toast.error("Failed to update profile photo");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Handle remove profile photo
  const handleRemovePhoto = async () => {
    setIsSavingPhoto(true);
    
    try {
      const response = await betterFetch("/api/user/profile", {
        method: "PATCH",
        body: {
          image: null
        }
      });

      if (!response.data?.user) {
        throw new Error("Failed to remove profile photo");
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
      toast.error("Failed to remove profile photo");
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
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

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-yellow-500 text-white">Pending Review</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "EXPIRED":
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state for the entire page
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  // First letter for avatar
  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";

  const userAds = userAdsQuery.data || [];
  const isAdsLoading = userAdsQuery.isLoading;

  return (
    <div className="min-h-screen bg-slate-100 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog(d => ({ ...d, open }))}>
          <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-2 border-white/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-800">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                This action cannot be undone. This will permanently delete the advertisement "{deleteDialog.ad?.title}" and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} className="bg-white/50 hover:bg-white/70 backdrop-blur-md border border-white/30">Cancel</AlertDialogCancel>
              <AlertDialogAction
                asChild
                onClick={e => {
                  e.preventDefault();
                  if (deleteDialog.ad) handleDeleteAd(deleteDialog.ad);
                }}
              >
                <Button variant="destructive" disabled={isDeleting} className="bg-gradient-to-r from-red-500 to-red-600">
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success indicator */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-xl border border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl flex items-center z-50 animate-in slide-in-from-top">
            <CheckCircle className="h-5 w-5 mr-2" />
            Changes saved successfully!
          </div>
        )}

        {/* Error indicator */}
        {errorMessage && (
          <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-xl border border-red-200 text-red-700 px-6 py-3 rounded-xl flex items-center z-50 animate-in slide-in-from-top">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0D5C63] via-teal-600 to-emerald-600 bg-clip-text text-transparent">Profile</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Left sidebar navigation */}
          <div className="md:w-1/4">
            <div className="bg-white/80 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-6 space-y-6">
              {/* User info at the top of sidebar */}
              <div className="text-center">
                <div className="relative inline-block mb-3 group">
                  <MediaGallery
                    onMediaSelect={handlePhotoSelect}
                    multiSelect={false}
                    title="Change Profile Photo"
                  >
                    <button
                      className="relative cursor-pointer transition-transform hover:scale-105"
                      disabled={isSavingPhoto}
                    >
                      <Avatar className="h-20 w-20 ring-4 ring-white/50 group-hover:ring-teal-500/50 transition-all">
                        <AvatarImage src={user.avatar || ""} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-[#0D5C63] to-teal-600 text-white text-2xl font-semibold">
                          {firstLetter}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </button>
                  </MediaGallery>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <h2 className="font-semibold text-lg text-slate-800">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                {user.avatar && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={isSavingPhoto}
                    className="text-xs text-red-600 hover:text-red-700 mt-2 transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Navigation options */}
              <div className="space-y-1">
                <button
                  className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${sidebarActive === "personal"
                    ? "bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white font-semibold"
                    : "text-slate-700 hover:bg-white/60 hover:backdrop-blur-md"
                    }`}
                  onClick={() => setSidebarActive("personal")}
                >
                  <Shield className="w-4 h-4" />
                  Personal Information
                </button>

                <button
                  className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${sidebarActive === "security"
                    ? "bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white font-semibold"
                    : "text-slate-700 hover:bg-white/60 hover:backdrop-blur-md"
                    }`}
                  onClick={() => setSidebarActive("security")}
                >
                  <Lock className="w-4 h-4" />
                  Sign-In and Security
                </button>

                <button
                  className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${sidebarActive === "ads"
                    ? "bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white font-semibold"
                    : "text-slate-700 hover:bg-white/60 hover:backdrop-blur-md"
                    }`}
                  onClick={() => setSidebarActive("ads")}
                >
                  <Car className="w-4 h-4" />
                  My Ads
                </button>

                <button
                  className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${sidebarActive === "favorites"
                    ? "bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white font-semibold"
                    : "text-slate-700 hover:bg-white/60 hover:backdrop-blur-md"
                    }`}
                  onClick={() => setSidebarActive("favorites")}
                >
                  <Heart className="w-4 h-4" />
                  Saved Ads
                </button>
              </div>

              {/* Signout Button */}
              <div className="pt-4 border-t border-white/30">
                <SignoutButton
                  variant="outline"
                  className="w-full bg-white/80 backdrop-blur-md text-red-600 hover:bg-red-50 border-2 hover:text-red-600  border-white/30 hover:border-red-200 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Right content area */}
          <div className="md:w-3/4 space-y-6">
            {/* Personal Information */}
            {sidebarActive === "personal" && (
              <div className="bg-white/80 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8 space-y-6">
                <div className="border-b border-white/30 pb-4">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0D5C63] to-teal-600 bg-clip-text text-transparent mb-2">
                    Personal Information
                  </h2>
                  <p className="text-sm text-slate-600">
                    Update your personal details here.
                  </p>
                </div>

                <div className="space-y-5">
                  {activeSection === "personal" ? (
                    <div className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-6 space-y-4">
                      <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800"
                          placeholder="Your phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number</label>
                        <Input
                          name="whatsappNumber"
                          value={formData.whatsappNumber}
                          onChange={handleChange}
                          className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800"
                          placeholder="Your WhatsApp number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Province</label>
                        <Select value={formData.province} onValueChange={(value) => handleFilterChange("province", value)}>
                          <SelectTrigger className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Western">Western</SelectItem>
                            <SelectItem value="Central">Central</SelectItem>
                            <SelectItem value="Southern">Southern</SelectItem>
                            <SelectItem value="Northern">Northern</SelectItem>
                            <SelectItem value="Eastern">Eastern</SelectItem>
                            <SelectItem value="North Western">North Western</SelectItem>
                            <SelectItem value="North Central">North Central</SelectItem>
                            <SelectItem value="Uva">Uva</SelectItem>
                            <SelectItem value="Sabaragamuwa">Sabaragamuwa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">District</label>
                        <Select
                          value={formData.district}
                          onValueChange={(value) => handleFilterChange("district", value)}
                          disabled={!formData.province}
                        >
                          <SelectTrigger className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800">
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
                        <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                        <Select
                          value={formData.city}
                          onValueChange={(value) => handleFilterChange("city", value)}
                          disabled={!formData.district}
                        >
                          <SelectTrigger className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800">
                            <SelectValue placeholder={formData.district ? "Select city" : "Select district first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {getCitiesForDistrict(formData.province, formData.district).map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                        <Input
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800"
                          placeholder="Your detailed location"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 bg-white hover:bg-gray-100 text-black hover:text-black border-2 border-white/30"
                          onClick={() => setActiveSection(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 border-0"
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
                  ) : (
                    <>
                      <div
                        className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-6 flex justify-between items-center cursor-pointer hover:bg-white/70 hover:border-[#0D5C63]/30 transition-all duration-300 group"
                        onClick={() => setActiveSection("personal")}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0D5C63] to-teal-600 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 font-medium">Name</div>
                            <div className="font-semibold text-slate-800 mt-1">{user.name}</div>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center group-hover:bg-gradient-to-r from-[#0D5C63] to-teal-600 transition-all duration-300">
                          <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white" />
                        </div>
                      </div>

                      {user.organization && (
                        <div
                          className="bg-blue-50/50 backdrop-blur-md rounded-xl border-2 border-blue-100 p-6 flex justify-between items-center hover:bg-blue-100/50 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-sm text-blue-600 font-medium">Organization</div>
                              <div className="font-semibold text-slate-800 mt-1">{user.organization.name}</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-normal">
                            Assigned
                          </Badge>
                        </div>
                      )}

                      <div
                        className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-6 flex justify-between items-center cursor-pointer hover:bg-white/70 hover:border-[#0D5C63]/30 transition-all duration-300 group"
                        onClick={() => setActiveSection("personal")}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Phone className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 font-medium">Phone Number</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="font-semibold text-slate-800">{user.phone || "Not set"}</div>
                              {user.phone && getPhoneVerificationBadge(user.phoneVerified)}
                            </div>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center group-hover:bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300">
                          <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white" />
                        </div>
                      </div>

                      <div
                        className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-6 flex justify-between items-center cursor-pointer hover:bg-white/70 hover:border-[#0D5C63]/30 transition-all duration-300 group"
                        onClick={() => setActiveSection("personal")}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <MessageCircle className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 font-medium">WhatsApp Number</div>
                            <div className="font-semibold text-slate-800 mt-1">{user.whatsappNumber || "Not set"}</div>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center group-hover:bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300">
                          <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white" />
                        </div>
                      </div>

                      <div
                        className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-6 flex justify-between items-center cursor-pointer hover:bg-white/70 hover:border-[#0D5C63]/30 transition-all duration-300 group"
                        onClick={() => setActiveSection("personal")}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-500 font-medium">Location</div>
                            <div className="font-semibold text-slate-800 mt-1">
                              {user.city && user.province ? `${user.city}, ${user.province}` : user.city || user.province || "Not set"}
                            </div>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center group-hover:bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300">
                          <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-6 flex justify-between items-center hover:bg-white/70 hover:border-teal-500/30 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 font-medium">Email</div>
                        <div className="font-semibold text-slate-800 mt-1">{user.email}</div>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center group-hover:bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300">
                      <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {sidebarActive === "security" && (
              <div className="bg-white/80 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8 space-y-6">
                <div className="border-b border-white/30 pb-4">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0D5C63] to-teal-600 bg-clip-text text-transparent mb-2">
                    Sign-In and Security
                  </h2>
                  <p className="text-sm text-slate-600">
                    Manage settings related to signing in to your account, account security and how to recover your data
                    when you are having trouble signing in.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Password card */}
                  <div
                    className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-6 flex justify-between items-center cursor-pointer hover:bg-white/70 hover:border-amber-500/30 transition-all duration-300 group"
                    onClick={() => setActiveSection("password")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">Password</h3>
                        <p className="text-sm text-slate-500 mt-1">Last updated: Not available</p>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-white/50 flex items-center justify-center group-hover:bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300">
                      <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white" />
                    </div>
                  </div>
                </div>

                {/* Password change form */}
                {activeSection === "password" && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl border-2 border-white/20 p-8 max-w-md w-full">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-[#0D5C63] to-teal-600 bg-clip-text text-transparent mb-6">
                        Change Password
                      </h3>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                          <Input
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                          <Input
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                          <Input
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full bg-white/60 backdrop-blur-md border-2 border-white/30 focus:border-[#0D5C63] focus:bg-white/80 transition-all duration-300 rounded-xl h-12 text-slate-800"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1 bg-white/50 hover:bg-white/70 backdrop-blur-md border-2 border-white/30"
                            onClick={() => setActiveSection(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 border-0"
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
                  </div>
                )}
              </div>
            )}

            {/* My Ads - Updated to use the real data from API */}
            {sidebarActive === "ads" && (
              <div className="bg-white/80 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-white/30 pb-4">
                  <div id="my-ads">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0D5C63] to-teal-600 bg-clip-text text-transparent mb-2">
                      My Ads
                    </h2>
                    <p className="text-sm text-slate-600">
                      Manage your posted advertisements
                    </p>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 border-0 px-6"
                    onClick={() => router.push("/sell/new")}
                  >
                    Post New Ad
                  </Button>
                </div>

                <div className="space-y-4">
                  {isAdsLoading ? (
                    <div className="p-12 flex justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-[#0D5C63]" />
                    </div>
                  ) : (Array.isArray(userAds) && userAds.length === 0) || (!Array.isArray(userAds) && userAds.ads && userAds.ads.length === 0) ? (
                    <div className="p-12 text-center">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mx-auto flex items-center justify-center mb-4">
                        <Car className="h-10 w-10 text-slate-400" />
                      </div>
                      <p className="text-slate-600 mb-5 text-lg font-medium">You haven't posted any ads yet</p>
                      <Button
                        className="bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 border-0 px-8"
                        onClick={() => router.push("/sell/new")}
                      >
                        Post Your First Ad
                      </Button>
                    </div>
                  ) : (
                    (Array.isArray(userAds) ? userAds : userAds.ads).map((ad: UserAd) => (
                      <div
                        key={ad.id}
                        className="bg-white/60 backdrop-blur-md rounded-xl border-2 border-white/30 p-5 flex items-center hover:bg-white/70 hover:border-[#0D5C63]/30 transition-all duration-300 group"
                      >
                        <div className="h-20 w-20 flex-shrink-0 mr-5 rounded-xl overflow-hidden border-2 border-white/50">
                          {getAdImage(ad) ? (
                            <img
                              src={getAdImage(ad)}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200">
                              <Car className="h-10 w-10 text-slate-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="font-semibold text-lg text-slate-800 hover:text-[#0D5C63] cursor-pointer transition-colors duration-300"
                              onClick={() => router.push(`/${ad.id}`)}
                            >
                              {ad.title}
                            </div>
                            {getStatusBadge(ad.status)}
                          </div>
                          <div className="text-base font-bold text-[#0D5C63] mt-1">Rs {formatPrice(ad.price)}</div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 mt-2">
                            <span className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                              {ad.location || "No location"}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                              {formatDate(ad.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                              {ad.views || 0} views
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-lg bg-white/50 hover:bg-gradient-to-r from-[#0D5C63] to-teal-600 text-slate-600 hover:text-white transition-all duration-300"
                            onClick={() => router.push(`/edit-ad/${ad.id}`)}
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-lg bg-white/50 hover:bg-gradient-to-r from-red-500 to-red-600 text-slate-600 hover:text-white transition-all duration-300"
                            onClick={() => setDeleteDialog({ open: true, ad })}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Saved Ads Section */}
            {sidebarActive === "favorites" && (
              <div className="bg-white/80 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8 space-y-6">
                <div className="border-b border-white/30 pb-4">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#0D5C63] to-teal-600 bg-clip-text text-transparent mb-2">
                    Saved Ads
                  </h2>
                  <p className="text-sm text-slate-600">
                    Your favorite advertisements
                  </p>
                </div>

                {isFavoritesLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#0D5C63]" />
                  </div>
                ) : !favorites || favorites.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mx-auto flex items-center justify-center mb-4">
                      <Heart className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-slate-600 mb-5 text-lg font-medium">You haven't saved any ads yet</p>
                    <Button
                      className="bg-gradient-to-r from-[#0D5C63] to-teal-600 text-white hover:from-[#0a4a50] hover:to-teal-700 border-0 px-8"
                      onClick={() => router.push("/")}
                    >
                      Browse Ads
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((favorite: any) => {
                      const ad = favorite.ad;
                      const adImage = ad.media?.[0]?.media?.url || "";

                      return (
                        <div
                          key={favorite.id}
                          className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group relative"
                          onClick={() => router.push(`/${ad.id}`)}
                        >
                          {/* Favorite Button */}
                          <div className="absolute top-2 right-2 z-10">
                            <FavoriteButton adId={ad.id} />
                          </div>

                          <div className="p-3">
                            {/* Ad Title - Centered */}
                            <h3 className="font-semibold text-sm text-slate-800 text-center mb-2 transition-colors group-hover:text-teal-700 line-clamp-1">
                              {ad.title}
                            </h3>

                            <div className="flex">
                              {/* Ad Image */}
                              <div className="w-32 h-20 flex-shrink-0">
                                {adImage ? (
                                  <img
                                    src={adImage}
                                    alt={ad.title}
                                    className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-md flex items-center justify-center">
                                    <Car className="h-8 w-8 text-slate-400" />
                                  </div>
                                )}
                              </div>

                              {/* Ad Details */}
                              <div className="flex-1 pl-3 flex flex-col justify-between">
                                <div>
                                  <div className="text-xs text-slate-600 mb-1 line-clamp-1">
                                    {ad.location || "No location"}
                                  </div>

                                  <div className="text-sm font-semibold text-teal-700 mb-1">
                                    Rs. {ad.price ? ad.price.toLocaleString() : "N/A"}
                                  </div>

                                  <div className="text-xs text-slate-500">
                                    {ad.type || "Car"}
                                  </div>
                                </div>

                                <div className="text-xs text-slate-400 mt-1">
                                  {format(new Date(ad.createdAt || favorite.createdAt), "MMM d, yyyy")}
                                </div>
                              </div>
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
    </div >
  );
}
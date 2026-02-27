"use client"

import { useState, useEffect, useRef } from "react";
import { useSetupAd } from "@/features/ads/api/use-setup-ad";
import { useRouter } from "next/navigation";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { authClient } from "@/lib/auth-client";
import { client } from "@/lib/rpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Camera, ChevronRight, CheckCircle2, X, PlusCircle, Zap, Star } from "lucide-react";
import { MediaGallery } from "@/modules/media/components/media-gallery";
import type { MediaFile } from "@/modules/media/types";
import { PendingAdModal } from "@/features/ads/components/pending-ad-modal";
import { AdSubmissionSuccessModal } from "@/features/ads/components/ad-submission-success-modal";
import { locationData } from "@/lib/location-data";
import { CitySearchDropdown } from "@/components/ui/city-search-dropdown";

export default function QuickAdCreatePage() {
  const router = useRouter();
  const { mutate: createAd, isPending } = useSetupAd();
  const { data: session } = authClient.useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<MediaFile[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Ref to track whether "Create Another" was chosen in pending modal
  // (prevents redirect to profile when user wants to stay and create again)
  const pendingModalActionRef = useRef<"createAnother" | "none">("none");

  // Promotion state
  const [promotionType, setPromotionType] = useState<"boost" | "featured" | "none">("none");
  const [promotionDuration, setPromotionDuration] = useState<"1week" | "2weeks" | "1month">("1week");
  const [formData, setFormData] = useState({
    // Listing type
    listingType: "SELL",

    // Basic info
    type: "CAR", // API enum value
    brand: "",
    model: "",
    manufacturedYear: "",
    modelYear: "",
    price: "",
    isNegotiable: false,
    condition: "",
    description: "",

    // Vehicle details based on type
    transmission: "",
    fuelType: "",
    mileage: "",
    engineCapacity: "",
    trimEdition: "",

    // Type-specific fields
    bikeType: "",
    bodyType: "",
    serviceType: "",
    partType: "",
    maintenanceType: "",
    vehicleType: "",

    // Contact info
    name: "",
    phoneNumber: "",
    whatsappNumber: "",
    province: "",
    district: "",
    city: "",
    location: "",
    termsAndConditions: false,

    // Publication status
    published: true,
    isDraft: false,
  });

  // Auto-fill user profile data - only when form is first loaded
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await client.api.users.me.$get();
        if (response.ok) {
          const userData = await response.json();
          console.log("Fetched user data:", userData);
          
          // Only auto-fill empty fields to avoid overwriting user input
          setFormData(prev => ({
            ...prev,
            name: prev.name || userData.name || "",
            phoneNumber: prev.phoneNumber || userData.phone || "",
            whatsappNumber: prev.whatsappNumber || userData.whatsappNumber || "",
            province: prev.province || userData.province || "",
            district: prev.district || userData.district || "",
            city: prev.city || userData.city || "",
            location: prev.location || userData.location || "",
          }));
          setHasAutoFilled(true);
        } else {
          console.error("Failed to fetch user profile, status:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    if (session?.user && !hasAutoFilled) {
      fetchUserProfile();
    }
  }, [session, hasAutoFilled]);

  // Generate available years (current year down to 1970)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1969 },
    (_, i) => String(currentYear - i)
  );

  // Vehicle makes list - same as your ad-form.tsx
  const vehicleMakes = [
    // Popular brands first
    "Toyota", "Suzuki", "Honda", "Nissan", "Mitsubishi", "BMW", "Audi", "BYD",
    // Rest alphabetically
    "Acura", "Alfa-Romeo", "Aprilia", "Ashok-Leyland", "Aston", "Atco", "ATHER",
    "Austin", "Baic", "Bajaj", "Bentley", "Borgward",
    "Cadillac", "Cal", "CAT", "Ceygra", "Changan", "Chery", "Chevrolet",
    "Chrysler", "Citroen", "Corvette", "Daewoo", "Daido", "Daihatsu", "Datsun",
    "Demak", "Dfac", "DFSK", "Ducati", "Dyno", "Eicher", "FAW", "Ferrari", "Fiat",
    "Force", "Ford", "Foton", "Hero", "Hero-Honda", "Higer", "Hillman", "HINO",
    "Hitachi", "Holden", "Hummer", "Hyundai", "IHI", "Isuzu", "Iveco",
    "JAC", "Jaguar", "JCB", "Jeep", "JiaLing", "JMC", "John-Deere", "Jonway",
    "KAPLA", "Kawasaki", "Kia", "Kinetic", "KMC", "Kobelco", "Komatsu", "KTM",
    "Kubota", "Lamborghini", "Land-Rover", "Lexus", "Loncin", "Longjia", "Lotus",
    "Lti", "Mahindra", "Maserati", "Massey-Ferguson", "Mazda", "Mercedes-Benz",
    "Metrocab", "MG", "Mg-Rover", "Micro", "Mini", "Minnelli",
    "Morgan", "Morris", "New-Holland", "NWOW", "Opel", "Other",
    "Perodua", "Peugeot", "Piaggio", "Porsche", "Powertrac", "Proton",
    "Range-Rover", "Ranomoto", "Renault", "Reva", "REVOLT", "Rolls-Royce", "Saab",
    "Sakai", "Seat", "Senaro", "Singer", "Skoda", "Smart", "Sonalika", "Subaru",
    "Swaraj", "Syuk", "TAFE", "TAILG", "Tata", "Tesla",
    "Triumph", "TVS", "Vauxhall", "Vespa", "Volkswagen", "Volvo", "Wave", "Willys",
    "Yadea", "Yamaha", "Yanmar", "Yuejin", "Zongshen", "Zotye"
  ];

  // Motorcycle brands list
  const motorbikeBrands = [
    "Honda", "Yamaha", "Suzuki", "Kawasaki", "BMW Motorrad", "Ducati", "KTM", "Husqvarna",
    "GasGas", "Aprilia", "Moto Guzzi", "MV Agusta", "Benelli", "CFMoto", "Royal Enfield",
    "Triumph", "Harley-Davidson", "Indian", "Victory", "Zero Motorcycles", "Energica",
    "LiveWire", "Bajaj", "TVS", "Hero", "Hero Honda", "Mahindra", "Jawa", "Yezdi",
    "Lifan", "Loncin", "Zongshen", "QJMotor", "Keeway", "Kymco", "SYM", "PGO",
    "Aeon", "Daelim", "Hyosung", "Sanyang", "AJP", "Beta", "Sherco", "Fantic",
    "Rieju", "Derbi", "Montesa", "Bultaco", "Ossa", "MZ", "Ural", "Izh",
    "Jawa Moto", "CZ", "Zundapp", "NSU", "Horex", "Brough Superior", "Norton", "Vincent",
    "Matchless", "AJS", "Royal Enfield (UK)", "Lambretta", "Vespa", "Piaggio", "Gilera",
    "Italjet", "Malaguti", "Cagiva", "SWM", "Mondial", "Kreidler", "Sachs", "Peugeot Motocycles",
    "MBK", "Romet", "Junak", "Bajaj Auto", "TVS Motor", "Hero MotoCorp", "Kymstone", "Zontes",
    "Voge", "Haojue", "Dayang", "Husaberg", "Alta Motors", "Buccaneer", "Mash", "Arch Motorcycle"
  ];

  // Get available districts based on selected province
  const getAvailableDistricts = () => {
    if (!formData.province) return [];
    return Object.keys(locationData[formData.province] || {});
  };

  // Get available cities based on selected district
  const getAvailableCities = () => {
    if (!formData.province || !formData.district) return [];
    const provinceData = locationData[formData.province];
    return provinceData?.[formData.district] || [];
  };

  // Simple form field change handler
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Reset dependent fields when province or district changes
      if (field === "province") {
        newData.district = "";
        newData.city = "";
      } else if (field === "district") {
        newData.city = "";
      }

      return newData;
    });
  };

  // Handle media selection from gallery
  const handleMediaSelect = (media: MediaFile[]) => {
    // Check if we exceed the maximum allowed (6 images)
    if (media.length > 6) {
      setSelectedImages(media.slice(0, 6));
    } else {
      setSelectedImages(media);
    }
  };

  // Handle removing a media item
  const removeMedia = (idToRemove: string) => {
    setSelectedImages(prev => prev.filter((media) => media.id !== idToRemove));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Calculate boost/featured expiry dates based on selection
    let boostExpiry: Date | undefined = undefined;
    let featureExpiry: Date | undefined = undefined;
    let boosted = false;
    let featured = false;

    if (promotionType !== "none") {
      const now = new Date();
      let expiryDate: Date;

      switch (promotionDuration) {
        case "1week":
          expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "2weeks":
          expiryDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        case "1month":
          expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      if (promotionType === "boost") {
        boosted = true;
        boostExpiry = expiryDate;
      } else if (promotionType === "featured") {
        featured = true;
        featureExpiry = expiryDate;
      }
    }
    // Validate at least 1 image is selected
    // if (selectedImages.length === 0) {
    //   alert("Please upload at least 1 image for your ad");
    //   return;
    // }

    // Auto-generate title from vehicle details
    // Vehicle type labels for title generation
    const vehicleTypeLabels: Record<string, string> = {
      CAR: "Car",
      VAN: "Van",
      SUV_JEEP: "SUV / Jeep",
      MOTORCYCLE: "Motorbike",
      CREW_CAB: "Crew Cab",
      PICKUP_DOUBLE_CAB: "Pickup / Double Cab",
      BUS: "Bus",
      LORRY: "Lorry",
      THREE_WHEEL: "Three Wheeler",
      OTHER: "Other",
      TRACTOR: "Tractor",
      HEAVY_DUTY: "Heavy-Duty",
      BICYCLE: "Bicycle",
      AUTO_SERVICE: "Auto Service",
      RENTAL: "Rental",
      AUTO_PARTS: "Auto Parts",
      MAINTENANCE: "Maintenance",
      BOAT: "Boat"
    };

    const typeLabel = vehicleTypeLabels[formData.type] || formData.type;

    const baseInfoParts = [
      formData.brand,
      formData.model,
      formData.manufacturedYear || formData.modelYear,
      typeLabel
    ].filter(Boolean);

    const vehicleInfo = baseInfoParts.join(" ");

    let title = "Vehicle Ad";
    if (formData.listingType === "WANT") {
      title = `Want ${vehicleInfo}`;
    } else if (formData.listingType === "RENT") {
      title = `${vehicleInfo} for Rent`;
    } else if (formData.listingType === "HIRE") {
      title = `${vehicleInfo} for Hire`;
    } else {
      // SELL format: Condition Brand Model Year Type
      const sellParts = [
        formData.condition,
        ...baseInfoParts,
        formData.trimEdition
      ].filter(Boolean);
      title = sellParts.join(" ");
    }

    // Format numeric fields
    const price = formData.price ? parseFloat(formData.price) : undefined;
    const mileage = formData.mileage ? parseFloat(formData.mileage) : undefined;
    const engineCapacity = formData.engineCapacity ? parseFloat(formData.engineCapacity) : undefined;

    // Prepare ad data according to your updated schema
    const adData: CreateAdSchema = {
      title,
      description: formData.description || "No description provided",
      type: formData.type as any,
      listingType: formData.listingType as any,
      price,

      // Media IDs from uploaded images
      mediaIds: selectedImages.map(img => img.id),

      // Common vehicle fields
      condition: formData.condition || undefined,
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      trimEdition: formData.trimEdition || undefined,

      // Year fields (use appropriate field based on type)
      manufacturedYear: (formData.type === "CAR" || formData.type === "MOTORCYCLE" || formData.type === "THREE_WHEEL" || formData.type === "BUS" || formData.type === "LORRY" || formData.type === "HEAVY_DUTY" || formData.type === "TRACTOR") ? formData.manufacturedYear || undefined : undefined,
      modelYear: (formData.type === "VAN") ? formData.modelYear || undefined : undefined,

      // Performance fields
      mileage,
      engineCapacity,

      // Type-specific enum fields - cast to proper types
      fuelType: formData.fuelType ? formData.fuelType as "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "GAS" : undefined,
      transmission: formData.transmission ? formData.transmission as "MANUAL" | "AUTOMATIC" | "CVT" : undefined,
      bodyType: formData.bodyType ? formData.bodyType as "SALOON" | "HATCHBACK" | "STATION_WAGON" : undefined,
      bikeType: formData.bikeType ? formData.bikeType as "SCOOTER" | "E_BIKE" | "MOTORBIKES" | "QUADRICYCLES" : undefined,
      vehicleType: formData.vehicleType ? formData.vehicleType as "BED_TRAILER" | "BOWSER" | "BULLDOZER" | "CRANE" | "DUMP_TRUCK" | "EXCAVATOR" | "LOADER" | "OTHER" : undefined,

      // Service & parts fields
      serviceType: formData.serviceType || undefined,
      partType: formData.partType || undefined,
      maintenanceType: formData.maintenanceType || undefined,

      // Contact info
      name: formData.name || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      whatsappNumber: formData.whatsappNumber || undefined,

      // Location info
      province: formData.province || undefined,
      district: formData.district || undefined,
      city: formData.city || undefined,
      location: formData.location || undefined,

      // Settings
      termsAndConditions: formData.termsAndConditions || undefined,
      published: formData.published,
      isDraft: formData.isDraft,
      boosted: boosted,
      featured: featured,
      boostExpiry: boostExpiry,
      featureExpiry: featureExpiry,
      metadata: { isNegotiable: formData.isNegotiable },
    };

    createAd(
      { values: adData },
      {
        onSuccess: (data) => {
          // Check if user is admin
          const isAdmin = (session?.user as any)?.role === "admin";
          const isPublished = !adData.isDraft && adData.published;

          // Show success modal first if ad is published (not admin)
          if (!isAdmin && isPublished) {
            setShowSuccessModal(true);
          } else {
            // Admin or draft - redirect normally
            if (isAdmin) {
              router.push(`/dashboard/ads/${data.id}`);
            } else {
              router.push('/profile#my-ads');
            }
          }
        }
      }
    );
  };

  // Check if required fields are filled based on step and vehicle type
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Basic vehicle info required - but relaxed for non-SELL types
        if (formData.listingType !== "SELL") {
          // For WANT, RENT, HIRE - only require listing type and vehicle type
          return formData.listingType && formData.type;
        }

        // For SELL - require detailed information as before
        if (["AUTO_SERVICE", "RENTAL", "MAINTENANCE"].includes(formData.type)) {
          return formData.type;
        }

        if (formData.type === "BICYCLE") {
          return formData.type && formData.brand;
        }

        if (formData.type === "AUTO_PARTS") {
          return formData.type && formData.brand && formData.model;
        }

        // For all vehicle types that need year
        const basicRequired = formData.type && formData.brand && formData.model;
        const yearRequired = (formData.type === "VAN") ? formData.modelYear : formData.manufacturedYear;

        return basicRequired && yearRequired;

      case 2:
        // Vehicle details required - but relaxed for non-SELL types
        if (formData.listingType !== "SELL") {
          // For WANT, RENT, HIRE - only require description
          return formData.description;
        }

        // For SELL - require detailed information as before
        // Price is only required if NOT negotiable
        let priceRequired = formData.isNegotiable || formData.price;
        let detailsRequired = priceRequired && formData.condition && formData.description;

        // Type-specific required fields for SELL
        if (formData.type === "CAR") {
          detailsRequired = detailsRequired && formData.fuelType && formData.transmission;
        } else if (formData.type === "MOTORCYCLE") {
          detailsRequired = detailsRequired && formData.bikeType && formData.engineCapacity;
        } else if (formData.type === "AUTO_SERVICE" || formData.type === "RENTAL") {
          detailsRequired = detailsRequired && formData.serviceType;
        } else if (formData.type === "AUTO_PARTS") {
          detailsRequired = detailsRequired && formData.partType;
        } else if (formData.type === "MAINTENANCE") {
          detailsRequired = detailsRequired && formData.maintenanceType;
        } else if (formData.type === "HEAVY_DUTY") {
          detailsRequired = detailsRequired && formData.vehicleType;
        } else if (["THREE_WHEEL", "BUS", "LORRY", "TRACTOR"].includes(formData.type)) {
          detailsRequired = detailsRequired && formData.fuelType;
        }

        return detailsRequired;

      case 3:
        // Contact info required for all listing types + at least 1 image
        return formData.name && formData.phoneNumber && formData.province && formData.district && formData.city && formData.location && formData.termsAndConditions
          //  && selectedImages.length > 0
          ;

      default:
        return false;
    }
  };

  // Render dynamic vehicle fields based on type
  const renderVehicleFields = () => {
    // For non-SELL types, show minimal fields
    if (formData.listingType !== "SELL") {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Brand (optional)</label>
            <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {vehicleMakes.map((make) => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Model (optional)</label>
            <Input
              placeholder="Enter model"
              value={formData.model}
              onChange={(e) => handleInputChange("model", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Manufacture Year (optional)</label>
            <Select value={formData.manufacturedYear || formData.modelYear} onValueChange={(value) => handleInputChange(formData.type === "VAN" ? "modelYear" : "manufacturedYear", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }

    // For SELL type, show full form based on vehicle type
    switch (formData.type) {
      case "CAR":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {vehicleMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Camry"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>

            {/* Trim/Edition */}
            <div>
              <label className="block text-sm font-medium mb-1">Trim / Edition</label>
              <Input
                placeholder="e.g., Sport"
                value={formData.trimEdition}
                onChange={(e) => handleInputChange("trimEdition", e.target.value)}
              />
            </div>

            {/* Year of Manufacture */}
            <div>
              <label className="block text-sm font-medium mb-1">Year of Manufacture<span className="text-red-500">*</span></label>
              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "VAN":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {vehicleMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Hiace"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>

            {/* Trim/Edition */}
            <div>
              <label className="block text-sm font-medium mb-1">Trim / Edition</label>
              <Input
                placeholder="e.g., GL"
                value={formData.trimEdition}
                onChange={(e) => handleInputChange("trimEdition", e.target.value)}
              />
            </div>

            {/* Model Year */}
            <div>
              <label className="block text-sm font-medium mb-1">Model Year<span className="text-red-500">*</span></label>
              <Select value={formData.modelYear} onValueChange={(value) => handleInputChange("modelYear", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "MOTORCYCLE":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bike Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Bike Type<span className="text-red-500">*</span></label>
              <Select value={formData.bikeType} onValueChange={(value) => handleInputChange("bikeType", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select bike type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCOOTER">Scooter</SelectItem>
                  <SelectItem value="E_BIKE">E-Bike</SelectItem>
                  <SelectItem value="MOTORBIKES">Motorbikes</SelectItem>
                  <SelectItem value="QUADRICYCLES">Quadricycles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {motorbikeBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., CBR 250R"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>

            {/* Year of Manufacture */}
            <div>
              <label className="block text-sm font-medium mb-1">Year of Manufacture<span className="text-red-500">*</span></label>
              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "BICYCLE":
        return (
          <>
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Giant"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "THREE_WHEEL":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {vehicleMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Bajaj RE"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>

            {/* Year of Manufacture */}
            <div>
              <label className="block text-sm font-medium mb-1">Year of Manufacture<span className="text-red-500">*</span></label>
              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "BUS":
      case "LORRY":
      case "TRACTOR":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {vehicleMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model<span className="text-red-500">*</span></label>
              <Input
                placeholder={formData.type === "BUS" ? "e.g., Rosa" : formData.type === "LORRY" ? "e.g., Canter" : "e.g., MF240"}
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>

            {/* Year of Manufacture */}
            <div>
              <label className="block text-sm font-medium mb-1">Year of Manufacture<span className="text-red-500">*</span></label>
              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "HEAVY_DUTY":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle Type<span className="text-red-500">*</span></label>
              <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange("vehicleType", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
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
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {vehicleMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., PC200"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>

            {/* Year of Manufacture */}
            <div>
              <label className="block text-sm font-medium mb-1">Year of Manufacture<span className="text-red-500">*</span></label>
              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "AUTO_SERVICE":
      case "RENTAL":
        return (
          <>
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Service Type<span className="text-red-500">*</span></label>
              <Input
                placeholder={formData.type === "AUTO_SERVICE" ? "e.g., Car Wash, Repair" : "e.g., Car Rental, Van Rental"}
                value={formData.serviceType}
                onChange={(e) => handleInputChange("serviceType", e.target.value)}
              />
            </div>
          </>
        );

      case "AUTO_PARTS":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Part Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Part or Accessory Type<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Engine Parts, Tires"
                value={formData.partType}
                onChange={(e) => handleInputChange("partType", e.target.value)}
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium mb-1">Brand<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Bosch"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium mb-1">Model<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Compatible model"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
              />
            </div>
          </>
        );

      case "MAINTENANCE":
        return (
          <>
            {/* Maintenance Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Maintenance and Repair Type<span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Engine Repair, Body Work"
                value={formData.maintenanceType}
                onChange={(e) => handleInputChange("maintenanceType", e.target.value)}
              />
            </div>
          </>
        );

      case "BOAT":
        return (
          <>
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Render step 2 dynamic fields based on vehicle type
  const renderStep2Fields = () => {
    // For non-SELL types, show minimal fields
    if (formData.listingType !== "SELL") {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Budget/Price Range (optional)</label>
            <Input
              type="number"
              placeholder="e.g., 2500000"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.listingType === "WANT" ? "Your budget range" :
                formData.listingType === "RENT" ? "Monthly rent amount" :
                  "Expected price range"}
            </p>
          </div>

          {(formData.listingType === "WANT" || formData.listingType === "RENT") && (
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Condition (optional)</label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange("condition", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any condition</SelectItem>
                  <SelectItem value="New">Brand New</SelectItem>
                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      );
    }

    // For SELL type, show full detailed form
    switch (formData.type) {
      case "CAR":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Transmission<span className="text-red-500">*</span></label>
                <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type<span className="text-red-500">*</span></label>
                <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PETROL">Petrol</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="ELECTRIC">Electric</SelectItem>
                    <SelectItem value="GAS">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                <Input
                  type="number"
                  placeholder="e.g., 45000"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)</label>
                <Input
                  type="number"
                  placeholder="e.g., 1500"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Body Type</label>
              <Select value={formData.bodyType} onValueChange={(value) => handleInputChange("bodyType", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALOON">Saloon</SelectItem>
                  <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                  <SelectItem value="STATION_WAGON">Station Wagon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "VAN":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)</label>
                <Input
                  type="number"
                  placeholder="e.g., 2000"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
            </div>
          </>
        );

      case "MOTORCYCLE":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                <Input
                  type="number"
                  placeholder="e.g., 15000"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)<span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
            </div>
          </>
        );

      case "THREE_WHEEL":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                <Input
                  type="number"
                  placeholder="e.g., 25000"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)</label>
                <Input
                  type="number"
                  placeholder="e.g., 200"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fuel Type<span className="text-red-500">*</span></label>
              <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PETROL">Petrol</SelectItem>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="GAS">Gas (CNG/LPG)</SelectItem>
                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "BUS":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                <Input
                  type="number"
                  placeholder="e.g., 150000"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)</label>
                <Input
                  type="number"
                  placeholder="e.g., 4000"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type<span className="text-red-500">*</span></label>
                <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="PETROL">Petrol</SelectItem>
                    <SelectItem value="GAS">Gas (CNG/LPG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transmission</label>
                <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case "LORRY":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                <Input
                  type="number"
                  placeholder="e.g., 200000"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange("mileage", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)</label>
                <Input
                  type="number"
                  placeholder="e.g., 3000"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type<span className="text-red-500">*</span></label>
                <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="PETROL">Petrol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transmission</label>
                <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case "HEAVY_DUTY":
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Operating Hours</label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={formData.mileage}
                onChange={(e) => handleInputChange("mileage", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total operating hours for the machinery
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)</label>
                <Input
                  type="number"
                  placeholder="e.g., 6000"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type</label>
                <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="ELECTRIC">Electric</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case "TRACTOR":
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Operating Hours</label>
              <Input
                type="number"
                placeholder="e.g., 2000"
                value={formData.mileage}
                onChange={(e) => handleInputChange("mileage", e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total operating hours for the tractor
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Engine (cc)</label>
                <Input
                  type="number"
                  placeholder="e.g., 2500"
                  value={formData.engineCapacity}
                  onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuel Type<span className="text-red-500">*</span></label>
                <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="PETROL">Petrol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Transmission</label>
              <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <div className="max-w-md mx-auto">
        <Card className="p-5 shadow-sm bg-white">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center mb-1">Post Your Vehicle</h1>
            <p className="text-center text-slate-500">Quick and easy</p>
          </div>

          {/* Progress steps */}
          <div className="flex mb-6 relative">
            <div className="w-1/3 text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>1</div>
              <div className="text-xs mt-1">Vehicle</div>
            </div>
            <div className="w-1/3 text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
              <div className="text-xs mt-1">Details</div>
            </div>
            <div className="w-1/3 text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>3</div>
              <div className="text-xs mt-1">Contact</div>
            </div>
            <div className="absolute top-4 left-[16.6%] w-[66.6%] h-[2px] bg-slate-200 -z-10"></div>
          </div>

          {/* Step 1: Basic Vehicle Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">What do you want to do?<span className="text-red-500">*</span></label>
                <Select
                  value={formData.listingType}
                  onValueChange={(value) => handleInputChange("listingType", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select listing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELL">Sell</SelectItem>
                    <SelectItem value="WANT">Want to Buy</SelectItem>
                    <SelectItem value="RENT">Rent Out</SelectItem>
                    <SelectItem value="HIRE">Hire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Type<span className="text-red-500">*</span></label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
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
                    <SelectItem value="AUTO_PARTS">Auto Parts and Accessories</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance and Repair</SelectItem>
                    <SelectItem value="BOAT">Boats & Water Transports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic vehicle fields based on type */}
              {renderVehicleFields()}

              {/* <div className="pt-2">
                <div className="flex items-center bg-blue-50 p-2 rounded-md text-xs text-blue-700">
                  <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Title will be auto-generated from these details</span>
                </div>
              </div> */}

              <Button
                className="w-full bg-teal-700 hover:bg-teal-800"
                onClick={() => setCurrentStep(2)}
                disabled={!canProceed()}
              >
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Vehicle Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (Rs)</label>
                <Input
                  type="number"
                  placeholder="e.g., 2500000"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="negotiable"
                  checked={formData.isNegotiable}
                  onCheckedChange={(checked) => {
                    handleInputChange("isNegotiable", checked);
                  }}
                />
                <Label htmlFor="negotiable" className="text-sm cursor-pointer font-medium">
                  Price is Negotiable
                </Label>
              </div>

              {/* <div>
                <label className="block text-sm font-medium mb-1">Condition<span className="text-red-500">*</span></label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => handleInputChange("condition", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">Brand New</SelectItem>
                    <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                    <SelectItem value="Used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              {/* Dynamic fields based on vehicle type */}
              {renderStep2Fields()}

              <div>
                <label className="block text-sm font-medium mb-1">Description<span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="Tell potential buyers about your vehicle..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="w-1/2"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="w-1/2 bg-teal-700 hover:bg-teal-800"
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceed()}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Name<span className="text-red-500">*</span></label>
                <Input
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number<span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g., 0777123456"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Number (optional)</label>
                <Input
                  placeholder="e.g., 0777123456"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Province<span className="text-red-500">*</span></label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => handleInputChange("province", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(locationData).map(province => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">District<span className="text-red-500">*</span></label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => handleInputChange("district", value)}
                  disabled={!formData.province}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={formData.province ? "Select district" : "Select province first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableDistricts().map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">City<span className="text-red-500">*</span></label>
                <CitySearchDropdown
                  cities={getAvailableCities()}
                  value={formData.city}
                  onChange={(value) => handleInputChange("city", value)}
                  disabled={!formData.district}
                  placeholder="Select city"
                  disabledPlaceholder="Select district first"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location/Area<span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g., Nugegoda"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="terms"
                  checked={formData.termsAndConditions}
                  onCheckedChange={(checked) => handleInputChange("termsAndConditions", checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Terms & Conditions<span className="text-red-500">*</span>
                </Label>
              </div>

              {/* Boost Ad Selection */}
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium mb-3">Promote Your Ad (Optional)</label>
                <Card className="border-amber-200">
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Promotion Type</Label>
                        <RadioGroup value={promotionType} onValueChange={(value) => setPromotionType(value as any)}>
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="none" id="sell-promo-none" />
                            <Label htmlFor="sell-promo-none" className="font-normal cursor-pointer text-sm">
                              No Promotion
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <RadioGroupItem value="boost" id="sell-promo-boost" />
                            <Label htmlFor="sell-promo-boost" className="font-normal cursor-pointer flex items-center gap-2 text-sm">
                              <Zap className="w-4 h-4 text-orange-600" />
                              <span>Boost Ad</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="featured" id="sell-promo-featured" />
                            <Label htmlFor="sell-promo-featured" className="font-normal cursor-pointer flex items-center gap-2 text-sm">
                              <Star className="w-4 h-4 text-yellow-600" />
                              <span>Featured Ad</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {promotionType !== "none" && (
                        <div>
                          <Label className="text-sm font-semibold mb-2 block">Duration & Pricing</Label>
                          <Select value={promotionDuration} onValueChange={(value) => setPromotionDuration(value as any)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1week">
                                1 Week - Rs {promotionType === "boost" ? "1,500" : "2,000"}
                              </SelectItem>
                              <SelectItem value="2weeks">
                                2 Weeks - Rs {promotionType === "boost" ? "2,500" : "3,000"}
                              </SelectItem>
                              <SelectItem value="1month">
                                1 Month - Rs {promotionType === "boost" ? "3,500" : "4,000"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
                <p className="text-xs text-slate-500 mt-2">
                  Boost or feature your ad for better visibility
                </p>
              </div>

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

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="w-1/2"
                  onClick={() => setCurrentStep(2)}
                >
                  Back
                </Button>
                <Button
                  className="w-1/2 bg-teal-700 hover:bg-teal-800"
                  onClick={handleSubmit}
                  disabled={isPending || !canProceed()}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : "Post Ad"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <AdSubmissionSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        onClose={() => {
          // After closing success modal, show pending modal
          setShowPendingModal(true);
        }}
      />
      <PendingAdModal
        open={showPendingModal}
        onOpenChange={(open) => {
          setShowPendingModal(open);
          if (!open) {
            if (pendingModalActionRef.current !== "createAnother") {
              // Redirect to My Ads for Go Back / X / backdrop close
              router.push("/profile#my-ads");
            }
            pendingModalActionRef.current = "none";
          }
        }}
        onGoBack={() => {
          // onOpenChange will handle the redirect — nothing extra needed here
        }}
        onCreateAnother={() => {
          pendingModalActionRef.current = "createAnother";
          // Reset form and go to step 1
          setCurrentStep(1);
          setFormData({
            listingType: "SELL",
            type: "CAR",
            brand: "",
            model: "",
            manufacturedYear: "",
            modelYear: "",
            price: "",
            isNegotiable: false,
            condition: "",
            description: "",
            transmission: "",
            fuelType: "",
            mileage: "",
            engineCapacity: "",
            trimEdition: "",
            bikeType: "",
            bodyType: "",
            serviceType: "",
            partType: "",
            maintenanceType: "",
            vehicleType: "",
            name: "",
            phoneNumber: "",
            whatsappNumber: "",
            province: "",
            district: "",
            city: "",
            location: "",
            termsAndConditions: false,
            published: true,
            isDraft: false,
          });
          setSelectedImages([]);
          setPromotionType("none");
          setPromotionDuration("1week");
        }}
      />
    </div>
  );
}
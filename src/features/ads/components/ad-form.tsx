/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Car,
  ImageIcon,
  DollarSign,
  Phone,
  MapPin,
  Settings,
  ArrowRight,
  ArrowLeft,
  // X,       // used by tag badges (commented out)
  PlusCircle,
  XCircle,
  Loader2,
  Check,
  // TagIcon, // used by tags section (commented out)
  ChevronsUpDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
// import { Badge } from "@/components/ui/badge"; // kept for tags (commented out)
// import { Separator } from "@/components/ui/separator"; // kept for settings tab (commented out)
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

import { MediaGallery } from "@/modules/media/components/media-gallery";
import type { MediaFile } from "@/modules/media/types";
import { CreateAdSchema } from "@/server/routes/ad/ad.schemas";
import { authClient } from "@/lib/auth-client";
import { useLocations } from "@/hooks/use-locations";
import { useManufactureYears } from "@/hooks/use-manufacture-years";
import { CitySearchDropdown } from "@/components/ui/city-search-dropdown";
import { ModelSearchDropdown } from "@/components/ui/model-search-dropdown";
import { GradeSearchDropdown } from "@/components/ui/grade-search-dropdown";
import { useGetAutoPartCategories } from "@/features/ads/api/use-get-auto-part-categories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type AdFormProps = {
  initialData?: any;
  onSubmit: (data: CreateAdSchema) => void;
  isSubmitting: boolean;
  title: string;
  description: string;
  submitButtonText: string;
};

const FormField = ({
  label,
  children,
  required = false
}: {
  label: string,
  children: React.ReactNode,
  required?: boolean
}) => {
  return (
    <div className="flex items-center mb-4">
      <div className="w-48 text-right pr-4 text-gray-600">
        {label}{required && <span className="text-red-500">*</span>}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export function AdForm({
  initialData,
  onSubmit,
  isSubmitting,
  title,
  description,
  submitButtonText
}: AdFormProps) {
  const router = useRouter();

  // Check if user is admin
  const { data: session } = authClient.useSession();
  // const user = session?.user; // reserved for future use
  void session; // suppress unused warning
  // const isAdmin = (user as any)?.role === "admin"; // reserved for future use

  // Fetch location data from DB
  const { locationData } = useLocations();
  const { years: manufactureYears } = useManufactureYears();

  // Fetch auto part categories at top level
  const { data: autoPartCategories = [] } = useGetAutoPartCategories(true);

  // Searchable dropdown states for AUTO_PARTS fields
  const [partCategoryOpen, setPartCategoryOpen] = useState(false);
  // compatibleBrandOpen state reserved for future use
  // const [compatibleBrandOpen, setCompatibleBrandOpen] = useState(false);

  // Set "vehicle" as the default active tab
  const [activeTab, setActiveTab] = useState("vehicle");


  // Define tab order for navigation
  const tabOrder = [
    "vehicle",
    "images",
    "pricing",
    "contact",
    "location",
    "basic"
  ];

  // State for controlling the media gallery dialog
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Replace the uploadedImages state with media files
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);

  // Image editor state
  const [editingImage, setEditingImage] = useState<{
    index: number;
    image: any;
  } | null>(null);
  const [imageTitle, setImageTitle] = useState("");
  const [imageAlt, setImageAlt] = useState("");



  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    published: false,
    isDraft: true,
    seoTitle: "",
    seoDescription: "",
    categoryId: "",
    tags: [] as string[],
    options: [] as string[],
    price: "",
    discountPrice: "",
    isNegotiable: false,

    // Common vehicle fields
    condition: "",
    brand: "",
    model: "",
    grade: "",
    trimEdition: "",

    // Year fields
    manufacturedYear: "",
    modelYear: "",

    // Performance fields
    mileage: "",
    engineCapacity: "",

    // Type-specific fields
    fuelType: "",
    transmission: "",
    bodyType: "",
    bikeType: "",
    vehicleType: "",
    serviceType: "",
    partType: "",
    maintenanceType: "",
    partName: "",
    partCategoryId: "",
    compatibleVehicleType: "",

    // Contact & location fields (keep existing)
    name: "",
    phoneNumber: "",
    whatsappNumber: "",
    termsAndConditions: true,
    location: "",
    address: "",
    province: "",
    district: "",
    city: "",
    specialNote: "",
    listingType: "SELL" as "SELL" | "WANT" | "RENT" | "HIRE",
    metadata: {}
  });

  // Update form data if initialData changes (for edit form)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        type: initialData.type || "CAR",   
        published: initialData.published || false,
        isDraft: initialData.isDraft ?? true,
        seoTitle: initialData.seoTitle || "",
        seoDescription: initialData.seoDescription || "",
        categoryId: initialData.categoryId || "",
        tags: initialData.tags || [],
        options: initialData.options || [],
        price: initialData.price ? String(initialData.price) : "",
        discountPrice: initialData.discountPrice
          ? String(initialData.discountPrice)
          : "",

        // Common vehicle fields
        condition: initialData.condition || "",
        brand: initialData.brand || "",
        model: initialData.model || "",
        grade: initialData.grade || "",
        trimEdition: initialData.trimEdition || "",

        // Year fields
        manufacturedYear: initialData.manufacturedYear || "",
        modelYear: initialData.modelYear || "",

        // Performance fields
        mileage: initialData.mileage ? String(initialData.mileage) : "",
        engineCapacity: initialData.engineCapacity
          ? String(initialData.engineCapacity)
          : "",

        // Type-specific fields - ADD THESE NEW FIELDS
        fuelType: initialData.fuelType || "",
        transmission: initialData.transmission || "",
        bodyType: initialData.bodyType || "",
        bikeType: initialData.bikeType || "",
        vehicleType: initialData.vehicleType || "",
        serviceType: initialData.serviceType || "",
        partType: initialData.partType || "",
        maintenanceType: initialData.maintenanceType || "",
        partName: (initialData as any).partName || "",
        partCategoryId: (initialData as any).partCategoryId || "",
        compatibleVehicleType: (initialData as any).compatibleVehicleType || "",

        // Contact & location fields
        name: initialData.name || "",
        phoneNumber: initialData.phoneNumber || "",
        whatsappNumber: initialData.whatsappNumber || "",
        termsAndConditions: initialData.termsAndConditions ?? true,
        location: initialData.location || "",
        address: initialData.address || "",
        province: initialData.province || "",
        district: initialData.district || "",
        city: initialData.city || "",
        specialNote: initialData.specialNote || "",
        listingType: initialData.listingType || "SELL",
        metadata: initialData.metadata || {},
        isNegotiable: (initialData.metadata as any)?.isNegotiable ?? false,
      });

      // Load images from initialData if available
      // Each item in initialData.media is an AdMedia record with a nested .media property (the actual Media object)
      if (initialData.media && Array.isArray(initialData.media)) {
        setSelectedMedia(
          initialData.media
            .filter((adMedia: any) => adMedia.media?.url || adMedia.url)
            .map((adMedia: any) => ({
              id: adMedia.media?.id || adMedia.mediaId || adMedia.id,
              url: adMedia.media?.url || adMedia.url || "",
              type: "IMAGE",
              filename: adMedia.media?.title || adMedia.title || "image",
              size: 0,
              createdAt: new Date(),
              title: adMedia.media?.title || adMedia.title || "",
              alt: adMedia.media?.alt || adMedia.alt || ""
            }))
        );
      }
    }
  }, [initialData]);

  // const [newTag, setNewTag] = useState(""); // used by Tags section (commented out)
  // const [newOption, setNewOption] = useState(""); // used by Tags section (commented out)

  // Handle tab navigation
  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentIndex + 1];
      setActiveTab(nextTab);
    }
  };

  const goToPrevTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      const prevTab = tabOrder[currentIndex - 1];
      setActiveTab(prevTab);
    }
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // addTag/removeTag/addOption/removeOption — used by Tags section (commented out)
  // const addTag = () => { ... };
  // const removeTag = (tagToRemove: string) => { ... };
  // const addOption = () => { ... };
  // const removeOption = (optionToRemove: string) => { ... };

  // Handle media selection from gallery
  const handleMediaSelect = (media: MediaFile[]) => {
    // Check if we exceed the maximum allowed (6 images)
    if (media.length > 6) {
      // Take only the first 6
      setSelectedMedia(media.slice(0, 6));
    } else {
      setSelectedMedia(media);
    }
  };

  // Handle removing a media item
  const removeMedia = (idToRemove: string) => {
    setSelectedMedia((prev) => prev.filter((media) => media.id !== idToRemove));
  };

  // Handle reordering media
  const reorderMedia = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedMedia = [...selectedMedia];
    const [movedMedia] = updatedMedia.splice(fromIndex, 1);
    updatedMedia.splice(toIndex, 0, movedMedia);

    setSelectedMedia(updatedMedia);
  };

  // Drag and drop functionality for reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null) return;
    if (draggedIndex === dropIndex) return;

    reorderMedia(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Image editor functions
  const openImageEditor = (index: number) => {
    const image = selectedMedia[index];
    setEditingImage({ index, image });
    // setImageTitle(image.title || "");
    // setImageAlt(image.alt || "");
  };

  const saveImageEdits = () => {
    if (!editingImage) return;

    setSelectedMedia((prev) =>
      prev.map((img, idx) =>
        idx === editingImage.index
          ? { ...img, title: imageTitle, alt: imageAlt }
          : img
      )
    );

    setEditingImage(null);
    setImageTitle("");
    setImageAlt("");
  };

  const cancelImageEdit = () => {
    setEditingImage(null);
    setImageTitle("");
    setImageAlt("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    let autoTitle = "Vehicle Ad";
    if (formData.type === "AUTO_PARTS") {
      // Auto parts title: {partName} for {brand} {model} {vehicleType}
      const partName = (formData as any).partName || "Auto Part";
      const compatVehicleLabel = vehicleTypeLabels[(formData as any).compatibleVehicleType || ""] || "";
      const forParts = [formData.brand, formData.model, compatVehicleLabel].filter(Boolean).join(" ");
      autoTitle = forParts ? `${partName} for ${forParts}` : partName;
    } else if (formData.listingType === "WANT") {
      autoTitle = `Want ${vehicleInfo}`;
    } else if (formData.listingType === "RENT") {
      autoTitle = `${vehicleInfo} for Rent`;
    } else if (formData.listingType === "HIRE") {
      autoTitle = `${vehicleInfo} for Hire`;
    } else {
      // SELL format: Condition Brand Model Year Type
      const sellParts = [
        formData.condition,
        ...baseInfoParts,
        formData.trimEdition
      ].filter(Boolean);
      autoTitle = sellParts.length > 0 ? sellParts.join(" ") : "Vehicle Ad";
    }

    // Normalize critical fields and build the ad data object
    const resolvedType = formData.type && formData.type !== "" ? formData.type : (initialData?.type ?? "CAR");

    const adData = {
      title: autoTitle,
      description: formData.description,
      type: resolvedType as any,
      listingType: formData.listingType,
      price: formData.price ? parseFloat(formData.price) : undefined,

      // Include all the dynamic fields
      condition: formData.condition || undefined,
      brand: formData.brand || undefined,
      model: formData.model || undefined,
      grade: formData.grade || undefined,
      trimEdition: formData.trimEdition || undefined,
      manufacturedYear: formData.manufacturedYear || undefined,
      modelYear: formData.modelYear || undefined,
      mileage: formData.mileage ? parseFloat(formData.mileage) : undefined,
      engineCapacity: formData.engineCapacity ? parseFloat(formData.engineCapacity) : undefined,
      fuelType: (formData.fuelType as "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "GAS") || undefined,
      transmission: (formData.transmission as "MANUAL" | "AUTOMATIC" | "CVT") || undefined,
      bodyType: (formData.bodyType as "SALOON" | "HATCHBACK" | "STATION_WAGON" | "SUV") || undefined,
      bikeType: (formData.bikeType as "SCOOTER" | "E_BIKE" | "MOTORBIKES" | "QUADRICYCLES") || undefined,
      vehicleType: (formData.vehicleType as "BED_TRAILER" | "BOWSER" | "BULLDOZER" | "CRANE" | "DUMP_TRUCK" | "EXCAVATOR" | "LOADER" | "OTHER" | undefined) || undefined,
      serviceType: formData.serviceType || undefined,
      partType: formData.partType || undefined,
      partName: (formData as any).partName || undefined,
      partCategoryId: (formData as any).partCategoryId || undefined,
      compatibleVehicleType: (formData as any).compatibleVehicleType || undefined,
      maintenanceType: formData.maintenanceType || undefined,

      // Keep all your existing fields
      published: formData.published,
      isDraft: formData.isDraft,
      name: formData.name || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      whatsappNumber: formData.whatsappNumber || undefined,
      termsAndConditions: formData.termsAndConditions || undefined,
      location: formData.location || undefined,
      address: formData.address || undefined,
      province: formData.province || undefined,
      district: formData.district || undefined,
      city: formData.city || undefined,
      specialNote: formData.specialNote || undefined,
      mediaIds: selectedMedia.length > 0 ? selectedMedia.map((media) => media.id) : undefined,
      metadata: { ...((formData.metadata as any) || {}), isNegotiable: formData.isNegotiable },
    };

    onSubmit(adData);
  };

  const vehicleMakes = [
    "Acura", "Alfa-Romeo", "Aprilia", "Ashok-Leyland", "Aston", "Atco", "ATHER",
    "Audi", "Austin", "Baic", "Bajaj", "Bentley", "BMW", "Borgward", "BYD",
    "Cadillac", "Cal", "CAT", "Ceygra", "Changan", "Chery", "Chevrolet",
    "Chrysler", "Citroen", "Corvette", "Daewoo", "Daido", "Daihatsu", "Datsun",
    "Demak", "Dfac", "DFSK", "Ducati", "Dyno", "Eicher", "FAW", "Ferrari", "Fiat",
    "Force", "Ford", "Foton", "Hero", "Hero-Honda", "Higer", "Hillman", "HINO",
    "Hitachi", "Holden", "Honda", "Hummer", "Hyundai", "IHI", "Isuzu", "Iveco",
    "JAC", "Jaguar", "JCB", "Jeep", "JiaLing", "JMC", "John-Deere", "Jonway",
    "KAPLA", "Kawasaki", "Kia", "Kinetic", "KMC", "Kobelco", "Komatsu", "KTM",
    "Kubota", "Lamborghini", "Land-Rover", "Lexus", "Loncin", "Longjia", "Lotus",
    "Lti", "Mahindra", "Maserati", "Massey-Ferguson", "Mazda", "Mercedes-Benz",
    "Metrocab", "MG", "Mg-Rover", "Micro", "Mini", "Minnelli", "Mitsubishi",
    "Morgan", "Morris", "New-Holland", "Nissan", "NWOW", "Opel", "Other",
    "Perodua", "Peugeot", "Piaggio", "Porsche", "Powertrac", "Proton",
    "Range-Rover", "Ranomoto", "Renault", "Reva", "REVOLT", "Rolls-Royce", "Saab",
    "Sakai", "Seat", "Senaro", "Singer", "Skoda", "Smart", "Sonalika", "Subaru",
    "Suzuki", "Swaraj", "Syuk", "TAFE", "TAILG", "Tata", "Tesla", "Toyota",
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="vehicle" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Vehicle
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </TabsTrigger>
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Vehicle Details */}
          <TabsContent value="vehicle">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
                <CardDescription>Specific information about your vehicle/service</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Listing Type Selection */}
                  <FormField label="Listing Type" required>
                    <Select
                      value={formData.listingType}
                      onValueChange={(value) => handleInputChange("listingType", value)}
                    >
                      <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SELL">Sell</SelectItem>
                        <SelectItem value="WANT">Want to Buy</SelectItem>
                        <SelectItem value="RENT">Rent Out</SelectItem>
                        <SelectItem value="HIRE">Hire</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Ad Type" required>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange("type", value)}
                    >
                      <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                        <SelectValue placeholder="Select Type" />
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
                  </FormField>

                  {/* Dynamic Fields Based on Selected Type */}
                  {(() => {
                    switch (formData.type) {
                      case "CAR":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Make" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {vehicleMakes.map((make) => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Trim / Edition">
                              <Input
                                placeholder="e.g., Sport"
                                value={formData.trimEdition || ""}
                                onChange={(e) => handleInputChange("trimEdition", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Year of Manufacture" required={formData.listingType === "SELL"}>
                              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Mileage (km)">
                              <Input
                                type="number"
                                placeholder="50000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="2000"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Fuel Type" required>
                              <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Fuel Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PETROL">Petrol</SelectItem>
                                  <SelectItem value="DIESEL">Diesel</SelectItem>
                                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                                  <SelectItem value="GAS">Gas</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Transmission" required>
                              <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Transmission" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MANUAL">Manual</SelectItem>
                                  <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                                  <SelectItem value="CVT">CVT</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Body Type">
                              <Select value={formData.bodyType} onValueChange={(value) => handleInputChange("bodyType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Body Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SALOON">Saloon</SelectItem>
                                  <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                                  <SelectItem value="STATION_WAGON">Station Wagon</SelectItem>
                                  <SelectItem value="SUV">SUV</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </>
                        );

                      case "VAN":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {vehicleMakes.map((make) => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Trim / Edition">
                              <Input
                                placeholder="e.g., GL"
                                value={formData.trimEdition || ""}
                                onChange={(e) => handleInputChange("trimEdition", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Model Year" required={formData.listingType === "SELL"}>
                              <Select value={formData.modelYear} onValueChange={(value) => handleInputChange("modelYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Mileage (km)">
                              <Input
                                type="number"
                                placeholder="50000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="2000"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>
                          </>
                        );

                      case "MOTORCYCLE":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Bike Type" required>
                              <Select value={formData.bikeType} onValueChange={(value) => handleInputChange("bikeType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Bike Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SCOOTER">Scooter</SelectItem>
                                  <SelectItem value="E_BIKE">E-Bike</SelectItem>
                                  <SelectItem value="MOTORBIKES">Motorbikes</SelectItem>
                                  <SelectItem value="QUADRICYCLES">Quadricycles</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand || ""} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[280px]">
                                  {motorbikeBrands.map((brand) => (
                                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Trim / Edition">
                              <Input
                                placeholder="e.g., Special Edition"
                                value={formData.trimEdition || ""}
                                onChange={(e) => handleInputChange("trimEdition", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Year of Manufacture" required={formData.listingType === "SELL"}>
                              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Mileage (km)">
                              <Input
                                type="number"
                                placeholder="50000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="150"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>
                          </>
                        );

                      case "BICYCLE":
                        return (
                          <>
                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Input
                                placeholder="e.g., Giant"
                                value={formData.brand || ""}
                                onChange={(e) => handleInputChange("brand", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}
                          </>
                        );

                      case "AUTO_SERVICE":
                        return (
                          <>
                            <FormField label="Service Type" required>
                              <Input
                                placeholder="e.g., Car Wash, Repair"
                                value={formData.serviceType || ""}
                                onChange={(e) => handleInputChange("serviceType", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>
                          </>
                        );

                      case "RENTAL":
                        return (
                          <>
                            <FormField label="Service Type" required>
                              <Input
                                placeholder="e.g., Car Rental, Van Rental"
                                value={formData.serviceType || ""}
                                onChange={(e) => handleInputChange("serviceType", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>
                          </>
                        );

                      case "AUTO_PARTS":
                        return (
                          <>
                            <FormField label="Part Category" required>
                              <Popover open={partCategoryOpen} onOpenChange={setPartCategoryOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={partCategoryOpen}
                                    className="w-full justify-between font-normal h-10 border border-gray-300 bg-white rounded-md shadow-none text-sm"
                                    disabled={autoPartCategories.length === 0}
                                    type="button"
                                  >
                                    <span className="truncate">
                                      {(formData as any).partCategoryId
                                        ? autoPartCategories.find((cat) => cat.id === (formData as any).partCategoryId)?.name || "Select category"
                                        : (autoPartCategories.length === 0 ? "No categories available" : "Select category")}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                                  <Command>
                                    <CommandInput placeholder="Search category..." />
                                    <CommandEmpty>No category found.</CommandEmpty>
                                    <CommandGroup className="max-h-60 overflow-y-auto">
                                      {autoPartCategories.map((cat) => (
                                        <CommandItem
                                          key={cat.id}
                                          value={cat.name}
                                          onSelect={() => {
                                            handleInputChange("partCategoryId", cat.id);
                                            setPartCategoryOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              (formData as any).partCategoryId === cat.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {cat.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </FormField>

                            <FormField label="Part Name" required>
                              <Input
                                placeholder="e.g., Wind Shield, Brake Pad"
                                value={(formData as any).partName || ""}
                                onChange={(e) => handleInputChange("partName", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            {formData.listingType !== "HIRE" && (
                              <FormField label="Condition" required>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Compatible Vehicle Type">
                              <Select value={(formData as any).compatibleVehicleType || ""} onValueChange={(value) => handleInputChange("compatibleVehicleType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select compatible vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">All Vehicles</SelectItem>
                                  <SelectItem value="CAR">Car</SelectItem>
                                  <SelectItem value="VAN">Van</SelectItem>
                                  <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                                  <SelectItem value="BICYCLE">Bicycle</SelectItem>
                                  <SelectItem value="THREE_WHEEL">Three Wheeler</SelectItem>
                                  <SelectItem value="BUS">Bus</SelectItem>
                                  <SelectItem value="LORRY">Lorry</SelectItem>
                                  <SelectItem value="HEAVY_DUTY">Heavy Duty</SelectItem>
                                  <SelectItem value="TRACTOR">Tractor</SelectItem>
                                  <SelectItem value="BOAT">Boat</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Compatible Brand">
                              <CitySearchDropdown
                                cities={["Any", ...vehicleMakes]}
                                value={formData.brand || ""}
                                onChange={(value) => handleInputChange("brand", value)}
                                placeholder="Select compatible brand"
                                triggerClassName="border border-gray-300 bg-white shadow-none"
                              />
                            </FormField>

                            <FormField label="Compatible Model">
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>
                          </>
                        );

                      case "MAINTENANCE":
                        return (
                          <>
                            <FormField label="Maintenance and Repair Type" required>
                              <Input
                                placeholder="e.g., Engine Repair, Body Work"
                                value={formData.maintenanceType || ""}
                                onChange={(e) => handleInputChange("maintenanceType", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>
                          </>
                        );

                      case "BOAT":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}
                          </>
                        );

                      case "THREE_WHEEL":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {vehicleMakes.map((make) => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Year of Manufacture" required={formData.listingType === "SELL"}>
                              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Mileage (km)">
                              <Input
                                type="number"
                                placeholder="25000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="200"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Fuel Type" required>
                              <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Fuel Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PETROL">Petrol</SelectItem>
                                  <SelectItem value="DIESEL">Diesel</SelectItem>
                                  <SelectItem value="GAS">Gas (CNG/LPG)</SelectItem>
                                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </>
                        );

                      case "BUS":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {vehicleMakes.map((make) => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Year of Manufacture" required={formData.listingType === "SELL"}>
                              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Mileage (km)">
                              <Input
                                type="number"
                                placeholder="150000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="4000"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Fuel Type" required>
                              <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Fuel Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DIESEL">Diesel</SelectItem>
                                  <SelectItem value="PETROL">Petrol</SelectItem>
                                  <SelectItem value="GAS">Gas (CNG/LPG)</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Transmission" required>
                              <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Transmission" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MANUAL">Manual</SelectItem>
                                  <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </>
                        );

                      case "LORRY":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {vehicleMakes.map((make) => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Year of Manufacture" required={formData.listingType === "SELL"}>
                              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Mileage (km)">
                              <Input
                                type="number"
                                placeholder="200000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="3000"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Fuel Type" required>
                              <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Fuel Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DIESEL">Diesel</SelectItem>
                                  <SelectItem value="PETROL">Petrol</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Transmission" required>
                              <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Transmission" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MANUAL">Manual</SelectItem>
                                  <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </>
                        );

                      case "HEAVY_DUTY":
                        return (
                          <>
                            {formData.listingType !== "HIRE" && (
                              <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                  <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                    <SelectValue placeholder="Select Condition" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="New">Brand New</SelectItem>
                                    <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                                    <SelectItem value="Used">Used</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>
                            )}

                            <FormField label="Vehicle Type" required>
                              <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange("vehicleType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Vehicle Type" />
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
                            </FormField>

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {vehicleMakes.map((make) => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Year of Manufacture" required={formData.listingType === "SELL"}>
                              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Operating Hours">
                              <Input
                                type="number"
                                placeholder="5000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Total operating hours for the machinery
                              </p>
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="6000"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Fuel Type" required>
                              <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Fuel Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DIESEL">Diesel</SelectItem>
                                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </>
                        );

                      case "TRACTOR":
                        return (
                          <>
                            <FormField label={formData.listingType === "SELL" ? "Condition" : "Preferred Condition"} required={formData.listingType === "SELL"}>
                              <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Condition" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="New">Brand New</SelectItem>
                                  <SelectItem value="Reconditioned">Reconditioned</SelectItem>
                                  <SelectItem value="Used">Used</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Brand" required={formData.listingType === "SELL"}>
                              <Select value={formData.brand} onValueChange={(value) => handleInputChange("brand", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {vehicleMakes.map((make) => (
                                    <SelectItem key={make} value={make}>{make}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Model" required={formData.listingType === "SELL"}>
                              <ModelSearchDropdown
                                value={formData.model || ""}
                                onChange={(v) => handleInputChange("model", v)}
                                brand={formData.brand}
                                placeholder="Select or type model"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Grade">
                              <GradeSearchDropdown
                                value={formData.grade || ""}
                                onChange={(v) => handleInputChange("grade", v)}
                                model={formData.model}
                                brand={formData.brand}
                                placeholder="Select or type grade (optional)"
                                className="border border-gray-300 bg-white rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Year of Manufacture" required={formData.listingType === "SELL"}>
                              <Select value={formData.manufacturedYear} onValueChange={(value) => handleInputChange("manufacturedYear", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  {manufactureYears.map(y => (
                                    <SelectItem key={y.id} value={y.year}>{y.year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Operating Hours">
                              <Input
                                type="number"
                                placeholder="2000"
                                value={formData.mileage || ""}
                                onChange={(e) => handleInputChange("mileage", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Total operating hours for the tractor
                              </p>
                            </FormField>

                            <FormField label="Engine Capacity (cc)">
                              <Input
                                type="number"
                                placeholder="2500"
                                value={formData.engineCapacity || ""}
                                onChange={(e) => handleInputChange("engineCapacity", e.target.value)}
                                className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                              />
                            </FormField>

                            <FormField label="Fuel Type" required>
                              <Select value={formData.fuelType} onValueChange={(value) => handleInputChange("fuelType", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Fuel Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DIESEL">Diesel</SelectItem>
                                  <SelectItem value="PETROL">Petrol</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>

                            <FormField label="Transmission" required>
                              <Select value={formData.transmission} onValueChange={(value) => handleInputChange("transmission", value)}>
                                <SelectTrigger className="border border-gray-300 bg-white h-10 rounded-md shadow-none">
                                  <SelectValue placeholder="Select Transmission" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MANUAL">Manual</SelectItem>
                                  <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormField>
                          </>
                        );

                      default:
                        return (
                          <div className="flex items-center justify-center p-4 mt-4 mb-2">
                            <p className="text-amber-600">Please select an ad type above to see relevant fields</p>
                          </div>
                        );
                    }
                  })()}

                  {/* Common Description Field */}
                  {/* <FormField label="Description" required>
                    <Textarea 
                      placeholder="Provide detailed information..." 
                      value={formData.description || ""} 
                      onChange={handleDescriptionChange}
                      rows={5}
                      className="border border-gray-300 bg-white rounded-md shadow-none resize-y"
                    />
                  </FormField> */}

                  {/* Common Price Field */}
                  {/* <FormField label="Price" required>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={formData.price || ""} 
                      onChange={handlePriceChange}
                      className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                    />
                  </FormField> */}

                  {/* Navigation buttons */}
                  <div className="flex justify-end mt-6 pt-4">
                    <Button
                      type="button"
                      onClick={goToNextTab}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Section */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Images</CardTitle>
                <CardDescription>
                  Upload up to 6 images of your vehicle (First image will be the
                  main image). Images will be automatically optimized to 1000×1000px and compressed to ~500KB for faster loading.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Media Gallery Button */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>

                    <div className="space-y-1 text-center">
                      <p className="text-sm font-medium">
                        {selectedMedia.length === 0
                          ? "No images selected yet"
                          : selectedMedia.length >= 6
                            ? "Maximum number of images selected (6/6)"
                            : `${selectedMedia.length
                            } image(s) selected, you can add ${6 - selectedMedia.length
                            } more`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Select up to 6 images from your media gallery
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
                        disabled={selectedMedia.length >= 6}
                      >
                        <PlusCircle className="w-4 h-4" />
                        {selectedMedia.length === 0
                          ? "Select Images"
                          : "Select More Images"}
                      </Button>
                    </MediaGallery>
                  </div>
                </div>

                {/* Selected Media Preview */}
                {selectedMedia.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          Selected Images ({selectedMedia.length}/6)
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          Drag images to reorder • First image is main
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedMedia.map((media, index) => (
                          <div
                            key={media.id}
                            className={`
                              relative group aspect-video border rounded-md overflow-hidden cursor-move
                              ${index === 0
                                ? "border-[#024950] border-2"
                                : "border-gray-200"
                              }
                              ${draggedIndex === index
                                ? "opacity-50"
                                : "opacity-100"
                              }
                            `}
                            // draggable
                            // onDragStart={() => handleDragStart(index)}
                            // onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 z-10">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="w-3/4"
                                onClick={() => removeMedia(media.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Remove
                              </Button>

                              {index !== 0 && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="w-3/4"
                                  onClick={() => openImageEditor(index)}
                                >
                                  Edit Details
                                </Button>
                              )}
                            </div>

                            {/* Badge for main image */}
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-[#024950] text-white text-xs px-2 py-1 rounded z-20">
                                Main Image
                              </div>
                            )}

                            {/* Image order badge */}
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full z-20">
                              {index + 1}
                            </div>

                            {/* SEO info badge - if title or alt text is set */}
                            {/* {(media.title || media.alt) && (
                              <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-sm z-20">
                                SEO
                              </div>
                            )} */}

                            <Image
                              src={media.url}
                              alt={`Vehicle image ${index + 1}`}
                              width={300}
                              height={200}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Tip:</span> High-quality
                        images from multiple angles will increase interest in
                        your vehicle
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-between mt-4">
                  <Button
                    type="button"
                    onClick={goToPrevTab}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={goToNextTab}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Information</CardTitle>
                <CardDescription>Set your asking price and any discounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Description<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        id="description"
                        placeholder="Provide detailed information about your vehicle..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={4}
                        className="border border-gray-300 bg-white rounded-md shadow-none resize-y"
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Price
                    </div>
                    <div className="flex-1">
                      <Input
                        id="price"
                        type="number"
                        placeholder="25000"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                      />
                    </div>
                  </div>

                  {/* Price is Negotiable */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      &nbsp;
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isNegotiable"
                        checked={formData.isNegotiable}
                        onCheckedChange={(checked) => handleInputChange("isNegotiable", !!checked)}
                      />
                      <Label htmlFor="isNegotiable" className="text-sm cursor-pointer font-medium text-gray-600">
                        Price is Negotiable
                      </Label>
                    </div>
                  </div>

                  {/* Original Price */}
                  {/* <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Original Price
                    </div>
                    <div className="flex-1">
                      <Input
                        id="discountPrice"
                        type="number"
                        placeholder="28000"
                        value={formData.discountPrice}
                        onChange={(e) => handleInputChange("discountPrice", e.target.value)}
                        className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        If there&apos;s a discount, enter the original price here
                      </p>
                    </div>
                  </div> */}

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      onClick={goToPrevTab}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={goToNextTab}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How buyers can reach you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Contact Name */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Contact Name<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Phone Number<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        id="phoneNumber"
                        placeholder="+1234567890"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      WhatsApp Number
                    </div>
                    <div className="flex-1">
                      <Input
                        id="whatsappNumber"
                        placeholder="+1234567890"
                        value={formData.whatsappNumber}
                        onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                        className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                      />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Terms
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="termsAndConditions"
                          checked={formData.termsAndConditions}
                          onCheckedChange={(checked) =>
                            handleInputChange("termsAndConditions", checked)
                          }
                        />
                        <Label htmlFor="termsAndConditions">
                          I agree to the terms and conditions
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      onClick={goToPrevTab}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={goToNextTab}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Where the vehicle is located</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Province - Required */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Province<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
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
                  </div>

                  {/* District - Required */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      District<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={formData.district}
                        onValueChange={(value) => handleInputChange("district", value)}
                        disabled={!formData.province}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={formData.province ? "Select district" : "Select province first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.province && Object.keys(locationData[formData.province] || {}).map(district => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* City - Required */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      City<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                      <CitySearchDropdown
                        cities={formData.province && formData.district ? (locationData[formData.province]?.[formData.district] || []) : []}
                        value={formData.city}
                        onChange={(value) => handleInputChange("city", value)}
                        disabled={!formData.district}
                        placeholder="Select city"
                        disabledPlaceholder="Select district first"
                      />
                    </div>
                  </div>

                  {/* Location/Area - Required */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Location/Area<span className="text-red-500">*</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        id="location"
                        placeholder="e.g., Nugegoda"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        required
                        className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                      />
                    </div>
                  </div>

                  {/* Full Address */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600 pt-2">
                      Full Address
                    </div>
                    <div className="flex-1">
                      <Textarea
                        id="address"
                        placeholder="Complete address where the vehicle can be viewed in Sri Lanka..."
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        rows={3}
                        className="border border-gray-300 bg-white rounded-md shadow-none resize-y"
                      />
                    </div>
                  </div>

                  {/* Special Notes */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600 pt-2">
                      Special Notes
                    </div>
                    <div className="flex-1">
                      <Textarea
                        id="specialNote"
                        placeholder="Any additional information or special instructions about the location..."
                        value={formData.specialNote}
                        onChange={(e) => handleInputChange("specialNote", e.target.value)}
                        rows={3}
                        className="border border-gray-300 bg-white rounded-md shadow-none resize-y"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      onClick={goToPrevTab}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={goToNextTab}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Additional settings about your ad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tags - hidden (commented out) */}
                  {/* <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Tags
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          <TagIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Separator />
                  </div> */}

                  {/* Publish Status */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Publish Status
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="published"
                          checked={formData.published}
                          onCheckedChange={(checked) => handleInputChange("published", checked)}
                        />
                        <Label htmlFor="published">Publish immediately</Label>
                      </div>
                    </div>
                  </div>


                  {/* Separator before SEO sections - hidden (commented out) */}
                  {/* <div className="mt-4">
                    <Separator />
                  </div> */}

                  {/* Auto Generate SEO Button - hidden (commented out) */}
                  {/* <div className="flex items-center mb-4">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Generate SEO
                    </div>
                    <div className="flex-1">
                      <Button
                        type="button"
                        onClick={() => {
                          const location = formData.district || "Your Area";
                          const autoTitle = [
                            formData.brand,
                            formData.model,
                            formData.manufacturedYear,
                            formData.vehicleType,
                            "Sale in",
                            location
                          ].filter(Boolean).join(' ');

                          const autoDescription = `Buy ${formData.brand} ${formData.model} ${formData.manufacturedYear} ${formData.vehicleType} at best price on Rathagala.lk - the largest Vehicle Marketplace in Sri Lanka. Discover more ${formData.brand} ${formData.model} ${formData.vehicleType}s for sale.`;

                          handleInputChange("seoTitle", autoTitle);
                          handleInputChange("seoDescription", autoDescription);
                        }}
                        variant="default"
                        size="sm"
                        className="text-xs bg-teal-600 hover:bg-teal-700"
                      >
                        Auto Generate SEO
                      </Button>
                    </div>
                  </div> */}

                  {/* SEO Title - hidden (commented out) */}
                  {/* <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Auto Generated SEO Title
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        <Input
                          id="seoTitle"
                          placeholder="e.g., Nissan NV200 2011 Van Sale in Kandy"
                          value={formData.seoTitle}
                          onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                          className="border border-gray-300 bg-white h-10 rounded-md shadow-none"
                        />
                        <p className="text-xs text-gray-500">
                          Format: Make + Model + Year + Type + "Sale in" + Location
                        </p>
                      </div>
                    </div>
                  </div> */}

                  {/* SEO Description - hidden (commented out) */}
                  {/* <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600 pt-2">
                      Auto Generated SEO Description
                    </div>
                    <div className="flex-1">
                      <Textarea
                        id="seoDescription"
                        placeholder="e.g., Buy Nissan NV200 2011 Van at best price on Rathagala.lk - the largest Vehicle Marketplace in Sri Lanka. Discover more Nissan NV200 Vans for sale."
                        value={formData.seoDescription}
                        onChange={(e) => handleInputChange("seoDescription", e.target.value)}
                        rows={3}
                        className="border border-gray-300 bg-white rounded-md shadow-none resize-y"
                      />
                    </div>
                  </div> */}

                  {/* Draft status */}
                  <div className="flex items-center">
                    <div className="w-48 text-right pr-4 text-gray-600">
                      Save as Draft
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isDraft"
                          checked={formData.isDraft}
                          onCheckedChange={(checked) => handleInputChange("isDraft", checked)}
                        />
                        <Label htmlFor="isDraft">Save as draft (not visible to public)</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start mt-6">
                    <Button
                      type="button"
                      onClick={goToPrevTab}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Image Editor Dialog */}
        <Dialog
          open={!!editingImage}
          onOpenChange={(open) => !open && cancelImageEdit()}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Image</DialogTitle>
              <DialogDescription>
                Add SEO metadata and crop your image if needed.
              </DialogDescription>
            </DialogHeader>

            {editingImage && (
              <div className="space-y-4">
                {/* Image preview */}
                <div className="relative aspect-video rounded-md overflow-hidden border border-gray-200">
                  <Image
                    src={editingImage.image.url}
                    alt="Image preview"
                    className="object-contain w-full h-full"
                    width={600}
                    height={300}
                  />
                </div>

                {/* Image metadata fields */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="imageTitle">Image Title (for SEO)</Label>
                    <Input
                      id="imageTitle"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      placeholder="Descriptive title of the image"
                    />
                    <p className="text-xs text-muted-foreground">
                      A descriptive title helps with search engine visibility
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="imageAlt">
                      Alt Text (for accessibility)
                    </Label>
                    <Input
                      id="imageAlt"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Description for screen readers"
                    />
                    <p className="text-xs text-muted-foreground">
                      Alt text helps people using screen readers understand the
                      image
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" onClick={cancelImageEdit}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={saveImageEdits}
                className="flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Form submission buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <div className="space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                  {submitButtonText}...
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

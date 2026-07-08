"use client";

import { useState, useEffect, useRef } from "react";
import { useSetupAd } from "@/features/ads/api/use-setup-ad";
import { useRouter } from "next/navigation";
import { CreateAdSchema, createAdSchema } from "@/server/routes/ad/ad.schemas";
import { authClient } from "@/lib/auth-client";
import { client } from "@/lib/rpc";
import { Card } from "@/components/ui/card";
import { BoostSelector, type BoostSelection } from "@/features/boost/components/boost-selector";
import { useRequestBoost } from "@/features/boost/api/use-request-boost";
import type { MediaFile } from "@/modules/media/types";
import { PendingAdModal } from "@/features/ads/components/pending-ad-modal";
import { AdSubmissionSuccessModal } from "@/features/ads/components/ad-submission-success-modal";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Zap } from "lucide-react";

import { Step1VehicleInfo } from "./_components/step-1-vehicle-info";
import { Step2VehicleDetails } from "./_components/step-2-vehicle-details";
import { Step3ContactDetails } from "./_components/step-3-contact-details";

export default function QuickAdCreatePage() {
  const router = useRouter();
  const { mutate: createAd, isPending } = useSetupAd();
  const { mutate: requestBoost } = useRequestBoost();
  const [showBoostDialog, setShowBoostDialog] = useState(false);
  const [boostSelection, setBoostSelection] = useState<BoostSelection | null>(null);
  const [createdAdId, setCreatedAdId] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<MediaFile[]>([]);
  const [adMode, setAdMode] = useState<"vehicle" | "auto_part">("vehicle");

  const pendingModalActionRef = useRef<"createAnother" | "none">("none");
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  const form = useForm<CreateAdSchema>({
    resolver: zodResolver(createAdSchema) as any,
    defaultValues: {
      listingType: "SELL",
      type: "CAR",
      brand: "",
      model: "",
      grade: "",
      manufacturedYear: "",
      modelYear: "",
      price: undefined,
      condition: "",
      description: "",
      transmission: undefined,
      fuelType: undefined,
      mileage: undefined,
      engineCapacity: undefined,
      trimEdition: "",
      bikeType: undefined,
      bodyType: undefined,
      serviceType: "",
      partType: "",
      maintenanceType: "",
      vehicleType: undefined,
      partName: "",
      partCategoryId: "",
      compatibleVehicleType: "",
      name: "",
      phoneNumber: "",
      whatsappNumber: "",
      province: "",
      district: "",
      city: "",
      location: "",
      termsAndConditions: true,
      published: true,
      isDraft: false,
      metadata: { isNegotiable: false },
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await client.api.users.me.$get();
        if (response.ok) {
          const userData = await response.json();
          const currentValues = form.getValues();
          
          if (!currentValues.name && userData.name) form.setValue("name", userData.name);
          if (!currentValues.phoneNumber && userData.phone) form.setValue("phoneNumber", userData.phone);
          if (!currentValues.whatsappNumber && userData.whatsappNumber) form.setValue("whatsappNumber", userData.whatsappNumber);
          if (!currentValues.province && userData.province) form.setValue("province", userData.province);
          if (!currentValues.district && userData.district) form.setValue("district", userData.district);
          if (!currentValues.city && userData.city) form.setValue("city", userData.city);
          if (!currentValues.location && userData.location) form.setValue("location", userData.location);
          
          setHasAutoFilled(true);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    if (session?.user && !hasAutoFilled) {
      fetchUserProfile();
    }
  }, [session, hasAutoFilled, form]);

  const watchAll = form.watch();

  const canProceed = () => {
    const { 
      listingType, type, brand, model, manufacturedYear, modelYear, condition, 
      partCategoryId, compatibleVehicleType, price, description, metadata,
      fuelType, transmission, bikeType, serviceType, partName, maintenanceType,
      vehicleType, name, phoneNumber, province, district, city, location, termsAndConditions
    } = watchAll;

    switch (currentStep) {
      case 1:
        if (listingType !== "SELL") {
          return !!(listingType && type);
        }
        if (["AUTO_SERVICE", "RENTAL", "MAINTENANCE"].includes(type)) {
          return !!type;
        }
        if (type === "BICYCLE") {
          return !!(type && brand);
        }
        if (type === "AUTO_PARTS") {
          return !!(type && compatibleVehicleType && condition && partCategoryId);
        }
        const basicRequired = type && brand && model;
        const yearRequired = (type === "VAN") ? modelYear : manufacturedYear;
        return !!(basicRequired && yearRequired);

      case 2:
        if (listingType !== "SELL") {
          return !!description;
        }
        let priceRequired = metadata?.isNegotiable || price;
        let detailsRequired = priceRequired && condition && description;

        if (type === "CAR") {
          detailsRequired = detailsRequired && fuelType && transmission;
        } else if (type === "MOTORCYCLE") {
          detailsRequired = detailsRequired && bikeType && watchAll.engineCapacity;
        } else if (type === "AUTO_SERVICE" || type === "RENTAL") {
          detailsRequired = detailsRequired && serviceType;
        } else if (type === "AUTO_PARTS") {
          const partPrice = metadata?.isNegotiable || price;
          detailsRequired = partPrice && partName && brand && description;
        } else if (type === "MAINTENANCE") {
          detailsRequired = detailsRequired && maintenanceType;
        } else if (type === "HEAVY_DUTY") {
          detailsRequired = detailsRequired && vehicleType;
        } else if (["THREE_WHEEL", "BUS", "LORRY", "TRACTOR"].includes(type)) {
          detailsRequired = detailsRequired && fuelType;
        }
        return !!detailsRequired;

      case 3:
        return !!(name && phoneNumber && province && district && city && location && termsAndConditions);

      default:
        return false;
    }
  };

  const onSubmit = (data: CreateAdSchema) => {
    // Generate Title
    const vehicleTypeLabels: Record<string, string> = {
      CAR: "Car", VAN: "Van", SUV_JEEP: "SUV / Jeep", MOTORCYCLE: "Motorbike",
      CREW_CAB: "Crew Cab", PICKUP_DOUBLE_CAB: "Pickup / Double Cab", BUS: "Bus",
      LORRY: "Lorry", THREE_WHEEL: "Three Wheeler", OTHER: "Other", TRACTOR: "Tractor",
      HEAVY_DUTY: "Heavy-Duty", BICYCLE: "Bicycle", AUTO_SERVICE: "Auto Service",
      RENTAL: "Rental", AUTO_PARTS: "Auto Parts", MAINTENANCE: "Maintenance", BOAT: "Boat"
    };

    const typeLabel = vehicleTypeLabels[data.type] || data.type;
    const baseInfoParts = [data.brand, data.model, data.manufacturedYear || data.modelYear, typeLabel].filter(Boolean);
    const vehicleInfo = baseInfoParts.join(" ");

    let title = "Vehicle Ad";
    if (adMode === "auto_part" || data.type === "AUTO_PARTS") {
      const compatibleTypeLabel: Record<string, string> = {
        ALL: "All Vehicles", CAR: "Car", VAN: "Van", MOTORCYCLE: "Motorcycle",
        BICYCLE: "Bicycle", THREE_WHEEL: "Three Wheeler", BUS: "Bus", LORRY: "Lorry",
        HEAVY_DUTY: "Heavy Duty", TRACTOR: "Tractor", BOAT: "Boat",
      };
      const vehicleTypeLabel = compatibleTypeLabel[data.compatibleVehicleType || ""] || data.compatibleVehicleType;
      const forPart = [data.brand, data.model, vehicleTypeLabel].filter(Boolean).join(" ");
      title = forPart ? `${data.partName} for ${forPart}` : data.partName || "Auto Part";
    } else if (data.listingType === "WANT") {
      title = `Want ${vehicleInfo}`;
    } else if (data.listingType === "RENT") {
      title = `${vehicleInfo} for Rent`;
    } else if (data.listingType === "HIRE") {
      title = `${vehicleInfo} for Hire`;
    } else {
      const sellParts = [data.condition, ...baseInfoParts, data.trimEdition].filter(Boolean);
      title = sellParts.join(" ");
    }

    const adData: CreateAdSchema = {
      ...data,
      title,
      mediaIds: selectedImages.map(img => img.id),
      published: true,
      isDraft: false,
    };

    createAd(
      { values: adData },
      {
        onSuccess: (responseData) => {
          setCreatedAdId(responseData.id);
          if (showBoostDialog && boostSelection && boostSelection.boostTypes.length > 0) {
            requestBoost({
              adId: responseData.id,
              boostTypes: boostSelection.boostTypes,
              bumpDays: boostSelection.bumpDays,
              topAdDays: boostSelection.topAdDays,
              urgentDays: boostSelection.urgentDays,
              featuredDays: boostSelection.featuredDays,
            });
          }
          const isAdmin = (session?.user as any)?.role === "admin";
          const isPublished = !adData.isDraft && adData.published;

          if (!isAdmin && isPublished) {
            setShowSuccessModal(true);
          } else {
            if (isAdmin) {
              router.push(`/dashboard/ads/${responseData.id}`);
            } else {
              router.push('/profile#my-ads');
            }
          }
        },
        onError: (error) => {
          console.error("Failed to create ad", error);
        }
      }
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <div className="max-w-md mx-auto">
        <Card className="p-5 shadow-sm bg-white">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center mb-1">
              {adMode === "auto_part" ? "Post Your Auto Part" : "Post Your Vehicle"}
            </h1>
            <p className="text-center text-slate-500">Quick and easy</p>
          </div>

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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
              {currentStep === 1 && (
                <Step1VehicleInfo 
                  onNext={() => setCurrentStep(2)} 
                  canProceed={canProceed()} 
                  adMode={adMode}
                  setAdMode={setAdMode}
                />
              )}

              {currentStep === 2 && (
                <Step2VehicleDetails 
                  onBack={() => setCurrentStep(1)} 
                  onNext={() => setCurrentStep(3)} 
                  canProceed={canProceed()} 
                />
              )}

              {currentStep === 3 && (
                <>
                  <Step3ContactDetails 
                    onBack={() => setCurrentStep(2)} 
                    onSubmit={form.handleSubmit(onSubmit as any)}
                    isPending={isPending}
                    showBoostDialog={showBoostDialog}
                    setShowBoostDialog={setShowBoostDialog}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    canProceed={canProceed()}
                  />
                  {showBoostDialog && (
                    <div className="mb-4 border rounded-lg p-4 bg-slate-50 mt-4">
                      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-teal-600" />
                        Select Boost Options
                      </h3>
                      <BoostSelector
                        onChange={setBoostSelection}
                        showPaymentDetails={true}
                      />
                    </div>
                  )}
                </>
              )}
            </form>
          </Form>
        </Card>
      </div>
      <AdSubmissionSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        onClose={() => {
          setShowPendingModal(true);
        }}
      />
      <PendingAdModal
        open={showPendingModal}
        onOpenChange={(open) => {
          setShowPendingModal(open);
          if (!open) {
            if (pendingModalActionRef.current !== "createAnother") {
              router.push("/profile#my-ads");
            }
            pendingModalActionRef.current = "none";
          }
        }}
        onGoBack={() => {}}
        onCreateAnother={() => {
          pendingModalActionRef.current = "createAnother";
          setCurrentStep(1);
          setAdMode("vehicle");
          form.reset();
          setSelectedImages([]);
        }}
      />
    </div>
  );
}
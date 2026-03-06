"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/rpc";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  SlidersHorizontal,
  ImageIcon,
  GripVertical,
} from "lucide-react";
import { allBrands } from "@/constants/brands";

interface BrandCarouselItem {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function CarouselAdminPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<BrandCarouselItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [draggedItem, setDraggedItem] = useState<BrandCarouselItem | null>(null);
  const [localBrands, setLocalBrands] = useState<BrandCarouselItem[]>([]);

  // Fetch all carousel items
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brand-carousel"],
    queryFn: async () => {
      const response = await client.api["brand-carousel"].$get();
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      return data.brands as BrandCarouselItem[];
    },
  });

  // Sync local brands with fetched data
  useEffect(() => {
    if (brands) {
      setLocalBrands(brands);
    }
  }, [brands]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; imageUrl: string }) => {
      const response = await client.api["brand-carousel"].$post({
        json: data,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(errorText || "Failed to create");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-carousel"] });
      setIsCreateOpen(false);
      setSelectedBrand("");
      setImageFile(null);
      setImagePreview("");
      toast.success("Brand added to carousel");
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast.error(`Failed to add brand: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; imageUrl?: string } }) => {
      const response = await client.api["brand-carousel"][":id"].$put({
        param: { id },
        json: data,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(errorText || "Failed to update");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-carousel"] });
      setIsEditOpen(false);
      setEditItem(null);
      setEditImageFile(null);
      setEditImagePreview("");
      toast.success("Brand updated");
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(`Failed to update brand: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await client.api["brand-carousel"][":id"].$delete({
        param: { id },
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-carousel"] });
      setDeleteId(null);
      toast.success("Brand removed from carousel");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to remove brand");
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (items: BrandCarouselItem[]) => {
      // Update order for all items
      const updatePromises = items.map((item, index) =>
        client.api["brand-carousel"][":id"].$put({
          param: { id: item.id },
          json: { order: index },
        })
      );
      const responses = await Promise.all(updatePromises);
      if (responses.some((r) => !r.ok)) throw new Error("Failed to reorder");
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-carousel"] });
      toast.success("Carousel order updated");
    },
    onError: () => {
      toast.error("Failed to update order");
      // Revert to original order
      if (brands) setLocalBrands(brands);
    },
  });

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  // Compress image before converting to base64
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          // Resize to max 400x400 while keeping aspect ratio
          let width = img.width;
          let height = img.height;
          const maxSize = 400;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(resolve, "image/png", 0.8);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
    });
  };

  // Handle image file selection for create
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name.split(".")[0] + ".png", { type: "image/png" });
        setImageFile(compressedFile);
        const preview = await fileToBase64(compressedFile);
        setImagePreview(preview);
        console.log("Image selected and compressed:", {
          originalSize: file.size,
          compressedSize: compressedFile.size,
          base64Size: preview.length,
        });
      } catch (error) {
        console.error("Image compression error:", error);
        toast.error("Failed to process image");
      }
    }
  };

  // Handle image file selection for edit
  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name.split(".")[0] + ".png", { type: "image/png" });
        setEditImageFile(compressedFile);
        const preview = await fileToBase64(compressedFile);
        setEditImagePreview(preview);
        console.log("Image selected and compressed:", {
          originalSize: file.size,
          compressedSize: compressedFile.size,
          base64Size: preview.length,
        });
      } catch (error) {
        console.error("Image compression error:", error);
        toast.error("Failed to process image");
      }
    }
  };

  const handleCreate = async () => {
    if (!selectedBrand || !imageFile) {
      toast.error("Please select a brand and upload an image");
      return;
    }
    const imageUrl = await fileToBase64(imageFile);
    console.log("Creating carousel item:", { brand: selectedBrand, imageSize: imageUrl.length });
    createMutation.mutate({ name: selectedBrand, imageUrl });
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    const updateData: { name?: string; imageUrl?: string } = {};
    if (selectedBrand !== editItem.name) {
      updateData.name = selectedBrand;
    }
    if (editImageFile) {
      updateData.imageUrl = await fileToBase64(editImageFile);
    }
    if (Object.keys(updateData).length > 0) {
      updateMutation.mutate({
        id: editItem.id,
        data: updateData,
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (item: BrandCarouselItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, targetItem: BrandCarouselItem) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!draggedItem || draggedItem.id === targetItem.id) return;

    // Reorder items optimistically
    const draggedIndex = localBrands.findIndex((b) => b.id === draggedItem.id);
    const targetIndex = localBrands.findIndex((b) => b.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newBrands = [...localBrands];
    newBrands.splice(draggedIndex, 1);
    newBrands.splice(targetIndex, 0, draggedItem);

    setLocalBrands(newBrands);
    setDraggedItem(draggedItem); // Keep dragged item reference
  };

  const handleDrop = () => {
    setDraggedItem(null);
    // Save the new order to the backend
    if (localBrands !== brands) {
      reorderMutation.mutate(localBrands);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6" />
            Brand Carousel
          </h1>
          <p className="text-muted-foreground">
            Manage brands displayed in the landing page carousel
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedBrand("");
            setImageFile(null);
            setImagePreview("");
            setIsCreateOpen(true);
          }}
          className="bg-[#024950] hover:bg-[#036b75]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Brand List */}
      <Card>
        <CardHeader>
          <CardTitle>Carousel Items</CardTitle>
          <CardDescription>
            Drag rows to reorder brands on the landing page carousel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : !brands || brands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No brands in the carousel yet.</p>
              <p className="text-sm">Click &quot;Add Brand&quot; to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Brand Name</TableHead>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localBrands.map((brand) => (
                  <TableRow
                    key={brand.id}
                    draggable
                    onDragStart={() => handleDragStart(brand)}
                    onDragOver={(e) => handleDragOver(e, brand)}
                    onDrop={handleDrop}
                    onDragLeave={() => {}}
                    className={`cursor-move ${draggedItem?.id === brand.id ? "opacity-50" : ""}`}
                  >
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    </TableCell>
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brand.imageUrl}
                          alt={brand.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>{localBrands.indexOf(brand)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditItem(brand);
                            setSelectedBrand(brand.name);
                            setEditImageFile(null);
                            setEditImagePreview("");
                            setIsEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-white"
                          onClick={() => setDeleteId(brand.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Brand to Carousel</DialogTitle>
            <DialogDescription>
              Select a brand and upload an image for the carousel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Select
                value={selectedBrand}
                onValueChange={setSelectedBrand}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {allBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-upload">Brand Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
              />
              {imagePreview && (
                <div className="mt-2 border rounded-lg p-2 bg-slate-50">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
            <Button
              onClick={handleCreate}
              className="w-full bg-[#024950] hover:bg-[#036b75]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Brand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Carousel Brand</DialogTitle>
            <DialogDescription>
              Update brand details for the carousel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Select
                value={selectedBrand}
                onValueChange={setSelectedBrand}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {allBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand Image (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleEditImageSelect}
              />
              {(editImagePreview || editItem?.imageUrl) && (
                <div className="mt-2 border rounded-lg p-2 bg-slate-50">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editImagePreview || editItem?.imageUrl || ""}
                    alt="Preview"
                    className="h-16 object-contain mx-auto"
                  />
                </div>
              )}
            </div>
            <Button
              onClick={handleUpdate}
              className="w-full bg-[#024950] hover:bg-[#036b75]"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              Update Brand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Brand from Carousel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the brand from the landing page carousel. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

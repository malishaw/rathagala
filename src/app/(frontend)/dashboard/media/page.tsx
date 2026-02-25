"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import JSZip from "jszip";
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, isBefore, startOfYear, endOfYear } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowUpAZ,
  Calendar,
  Check,
  ChevronDown,
  Download,
  FileImage,
  FileVideo,
  Filter,
  Grid3X3,
  ImageIcon,
  LayoutList,
  Loader2,
  Pencil,
  Replace,
  Search,
  SortDesc,
  Trash2,
  Upload,
  X,
  Crop,
  AlertTriangle,
  DownloadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---- Types ----
interface MediaItem {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "PDF" | "OTHER";
  filename: string | null;
  size: number | null;
  createdAt: string;
  uploaderId: string;
  uploader?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// ---- Helpers ----
function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getMediaIcon(type: string) {
  switch (type) {
    case "IMAGE":
      return <FileImage className="w-4 h-4" />;
    case "VIDEO":
      return <FileVideo className="w-4 h-4" />;
    default:
      return <ImageIcon className="w-4 h-4" />;
  }
}

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 10; y--) years.push(y);
  return years;
}

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ITEMS_PER_PAGE = 48;

// ======== MAIN PAGE COMPONENT ========
export default function AdminGalleryPage() {
  // ---- Fetch all media ----
  const { data, isLoading, error, refetch } = useQuery<{ media: MediaItem[] }>({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const res = await fetch("/api/admin/media", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json();
    },
  });

  const allMedia = useMemo(() => data?.media ?? [], [data?.media]);

  // ---- State ----
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"ALL" | "IMAGE" | "VIDEO">("ALL");
  const [dateFilter, setDateFilter] = useState<"all" | "year" | "month" | "date" | "custom">("all");
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [show6MonthOldOnly, setShow6MonthOldOnly] = useState(false);
  const [downloadAllLoading, setDownloadAllLoading] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    open: boolean;
    stage: "fetching" | "compressing" | "saving";
    current: number;
    total: number;
    filename: string;
  }>({
    open: false,
    stage: "fetching",
    current: 0,
    total: 0,
    filename: "",
  });

  // Dialogs
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [renameMedia, setRenameMedia] = useState<MediaItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameExt, setRenameExt] = useState("");
  const [renameError, setRenameError] = useState("");

  // Extract base name (no ext) and extension from a filename
  const extractRenameparts = (filename: string) => {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot > 0) {
      return { base: filename.slice(0, lastDot), ext: filename.slice(lastDot) };
    }
    return { base: filename, ext: "" };
  };

  const openRenameDialog = (media: MediaItem) => {
    const raw = media.filename || "unnamed";
    const { base, ext } = extractRenameparts(raw);
    setRenameMedia(media);
    setRenameValue(base);
    setRenameExt(ext);
    setRenameError("");
  };

  // Valid base filename: letters, digits, spaces, hyphens, underscores only
  const VALID_NAME_RE = /^[a-zA-Z0-9 _\-]+$/;
  const [deleteMedia, setDeleteMedia] = useState<MediaItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [replaceMedia, setReplaceMedia] = useState<MediaItem | null>(null);
  const [cropMedia, setCropMedia] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Crop state
  const [cropSettings, setCropSettings] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---- Filtering + Sorting ----
  const filteredMedia = useMemo(() => {
    let items = [...allMedia];

    // Search by filename
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          (m.filename && m.filename.toLowerCase().includes(q)) ||
          m.url.toLowerCase().includes(q)
      );
    }

    // Media type filter
    if (mediaTypeFilter !== "ALL") {
      items = items.filter((m) => m.type === mediaTypeFilter);
    }

    // Date filter
    if (dateFilter === "year") {
      items = items.filter((m) => {
        const d = new Date(m.createdAt);
        return d >= startOfYear(new Date(filterYear, 0)) && d <= endOfYear(new Date(filterYear, 0));
      });
    } else if (dateFilter === "month") {
      items = items.filter((m) => {
        const d = new Date(m.createdAt);
        const target = new Date(filterYear, filterMonth);
        return d >= startOfMonth(target) && d <= endOfMonth(target);
      });
    } else if (dateFilter === "date") {
      items = items.filter((m) => {
        const d = new Date(m.createdAt);
        const target = new Date(filterDate);
        return d >= startOfDay(target) && d <= endOfDay(target);
      });
    } else if (dateFilter === "custom" && customDateFrom && customDateTo) {
      items = items.filter((m) => {
        const d = new Date(m.createdAt);
        return d >= startOfDay(new Date(customDateFrom)) && d <= endOfDay(new Date(customDateTo));
      });
    }

    // 6+ month old filter
    if (show6MonthOldOnly) {
      const cutoff = subMonths(new Date(), 6);
      items = items.filter((m) => isBefore(new Date(m.createdAt), cutoff));
    }

    // Sort
    items.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });

    return items;
  }, [allMedia, search, mediaTypeFilter, dateFilter, filterYear, filterMonth, filterDate, customDateFrom, customDateTo, sortOrder, show6MonthOldOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE);
  const pagedMedia = filteredMedia.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, mediaTypeFilter, dateFilter, filterYear, filterMonth, filterDate, customDateFrom, customDateTo, sortOrder, show6MonthOldOnly]);

  // ---- Selection helpers ----
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
    }
  }, [filteredMedia, selectedIds]);

  const toggleOlderThan6Months = useCallback(() => {
    const cutoff = subMonths(new Date(), 6);
    const next = !show6MonthOldOnly;
    setShow6MonthOldOnly(next);
    if (next) {
      const oldIds = allMedia
        .filter((m) => isBefore(new Date(m.createdAt), cutoff))
        .map((m) => m.id);
      setSelectedIds(new Set(oldIds));
      if (oldIds.length > 0) {
        toast.info(`Showing ${oldIds.length} media files older than 6 months`);
      } else {
        toast.info("No media files older than 6 months found");
      }
    } else {
      setSelectedIds(new Set());
    }
  }, [allMedia, show6MonthOldOnly]);

  // ---- Actions ----
  const handleRename = async () => {
    if (!renameMedia || !renameValue.trim()) return;
    if (!VALID_NAME_RE.test(renameValue.trim())) {
      setRenameError("Only letters, numbers, spaces, hyphens (-) and underscores (_) are allowed.");
      return;
    }
    const finalName = renameValue.trim() + renameExt;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/media/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: renameMedia.id, filename: finalName }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Rename failed");
      toast.success("Media renamed successfully");
      setRenameMedia(null);
      refetch();
    } catch {
      toast.error("Failed to rename media");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/media/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Media deleted successfully");
      setDeleteMedia(null);
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      refetch();
    } catch {
      toast.error("Failed to delete media");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/media/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      const data = await res.json();
      toast.success(`Deleted ${data.deleted} media files`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      refetch();
    } catch {
      toast.error("Failed to delete selected media");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replaceMedia || !e.target.files?.[0]) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("mediaId", replaceMedia.id);

      const res = await fetch("/api/admin/media/replace", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Replace failed");
      toast.success("Media replaced successfully");
      setReplaceMedia(null);
      refetch();
    } catch {
      toast.error("Failed to replace media");
    } finally {
      setActionLoading(false);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  const handleDownloadAll = async () => {
    if (filteredMedia.length === 0) return;
    setDownloadAllLoading(true);
    setZipProgress({ open: true, stage: "fetching", current: 0, total: filteredMedia.length, filename: "" });
    try {
      const zip = new JSZip();
      const folder = zip.folder("media-gallery") as JSZip;
      const usedNames = new Map<string, number>();

      // Stage 1: fetch all files
      for (let i = 0; i < filteredMedia.length; i++) {
        const item = filteredMedia[i];
        const rawName = item.filename || `media-${item.id}`;
        // ensure unique filenames
        const count = (usedNames.get(rawName) ?? 0) + 1;
        usedNames.set(rawName, count);
        const uniqueName = count > 1 ? `${rawName.replace(/(\.[^.]+)?$/, `_${count}$1`)}` : rawName;

        setZipProgress((p) => ({ ...p, stage: "fetching", current: i, filename: rawName }));
        try {
          const resp = await fetch(item.url);
          const blob = await resp.blob();
          folder.file(uniqueName, blob);
        } catch {
          // skip failed files
        }
      }

      // Stage 2: compress
      setZipProgress((p) => ({ ...p, stage: "compressing", current: filteredMedia.length, filename: "" }));
      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
        (metadata) => {
          setZipProgress((p) => ({
            ...p,
            stage: "compressing",
            current: Math.round((metadata.percent / 100) * filteredMedia.length),
          }));
        }
      );

      // Stage 3: trigger download
      setZipProgress((p) => ({ ...p, stage: "saving" }));
      await new Promise((r) => setTimeout(r, 400));
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `media-gallery-${format(new Date(), "yyyy-MM-dd")}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`ZIP downloaded with ${filteredMedia.length} files`);
    } catch {
      toast.error("Failed to create ZIP archive");
    } finally {
      setDownloadAllLoading(false);
      setZipProgress((p) => ({ ...p, open: false }));
    }
  };

  const handleDownload = async (media: MediaItem) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = media.filename || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploadProgress(true);
    let successCount = 0;
    try {
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", "gallery");

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (res.ok) successCount++;
      }
      toast.success(`Uploaded ${successCount}/${uploadFiles.length} files`);
      setUploadFiles([]);
      setUploadOpen(false);
      refetch();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadProgress(false);
    }
  };

  // Crop handler
  const handleCrop = async () => {
    if (!cropMedia || !canvasRef.current) return;
    setActionLoading(true);
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = cropMedia.url;
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const sx = (cropSettings.x / 100) * img.naturalWidth;
      const sy = (cropSettings.y / 100) * img.naturalHeight;
      const sw = (cropSettings.width / 100) * img.naturalWidth;
      const sh = (cropSettings.height / 100) * img.naturalHeight;

      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (!blob) throw new Error("Failed to create cropped image");

      const file = new File([blob], cropMedia.filename || "cropped.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mediaId", cropMedia.id);

      const res = await fetch("/api/admin/media/replace", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Crop save failed");
      toast.success("Image cropped and saved successfully");
      setCropMedia(null);
      refetch();
    } catch {
      toast.error("Failed to crop image");
    } finally {
      setActionLoading(false);
    }
  };

  // Stats
  const totalSize = allMedia.reduce((sum, m) => sum + (m.size || 0), 0);
  const imageCount = allMedia.filter((m) => m.type === "IMAGE").length;
  const videoCount = allMedia.filter((m) => m.type === "VIDEO").length;
  const oldMediaCount = allMedia.filter((m) => isBefore(new Date(m.createdAt), subMonths(new Date(), 6))).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <div className="max-w-[1600px] mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">
              Media Gallery
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Manage all uploaded media files across the platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              disabled={downloadAllLoading || filteredMedia.length === 0}
              className="gap-2"
            >
              {downloadAllLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DownloadCloud className="w-4 h-4" />
              )}
              {downloadAllLoading ? "Downloading..." : `Download All${filteredMedia.length > 0 ? ` (${filteredMedia.length})` : ""}`}
            </Button>
            <Button onClick={() => setUploadOpen(true)} className="gap-2 bg-teal-600 hover:bg-teal-700">
              <Upload className="w-4 h-4" />
              Upload Media
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-slate-200 duration-500 text-black bg-gradient-to-br from-blue-50 to-yellow-50   hover:to-yellow-100">
            <CardContent className="p-4">
              <div className="text-sm rounded  py-1">Total Files</div>
              <div className="text-2xl font-bold text-slate-800">{allMedia.length}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 duration-500 text-black bg-gradient-to-br from-blue-50 to-teal-50   hover:to-teal-100">
            <CardContent className="p-4">
              <div className="text-sm text-slate-500">Total Size</div>
              <div className="text-2xl font-bold text-slate-800">{formatFileSize(totalSize)}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 duration-500 text-black bg-gradient-to-br from-blue-50 to-purple-50   hover:to-purple-100">
            <CardContent className="p-4">
              <div className="text-sm text-slate-500">Images / Videos</div>
              <div className="text-2xl font-bold text-slate-800">{imageCount} / {videoCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 duration-500 text-black bg-gradient-to-br from-blue-50 to-orange-50   hover:to-orange-100">
            <CardContent className="p-4">
              <div className="text-sm text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Older than 6 months
              </div>
              <div className="text-2xl font-bold text-orange-700">{oldMediaCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Media Type Filter */}
            <Select value={mediaTypeFilter} onValueChange={(v) => setMediaTypeFilter(v as "ALL" | "IMAGE" | "VIDEO")}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2 hover:text-white text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="IMAGE">Images Only</SelectItem>
                <SelectItem value="VIDEO">Videos Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="default" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {dateFilter === "all" ? "All Dates" :
                    dateFilter === "year" ? `Year: ${filterYear}` :
                    dateFilter === "month" ? `${MONTH_OPTIONS[filterMonth]} ${filterYear}` :
                    dateFilter === "date" ? format(new Date(filterDate), "MMM d, yyyy") :
                    dateFilter === "custom" ? "Custom Range" : "Filter Date"
                  }
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="start">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Date Filter Type</Label>
                  <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as "all" | "year" | "month" | "date" | "custom")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="year">By Year</SelectItem>
                      <SelectItem value="month">By Month</SelectItem>
                      <SelectItem value="date">By Date</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateFilter === "year" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Year</Label>
                    <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {getYearOptions().map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {dateFilter === "month" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Year</Label>
                    <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {getYearOptions().map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label className="text-xs font-semibold text-slate-500 uppercase mt-2">Month</Label>
                    <Select value={String(filterMonth)} onValueChange={(v) => setFilterMonth(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MONTH_OPTIONS.map((m, i) => (
                          <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {dateFilter === "date" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Date</Label>
                    <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                  </div>
                )}

                {dateFilter === "custom" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 ">FROM<span>(Month/Date/Year)</span></Label>
                    <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} />
                    <Label className="text-xs font-semibold text-slate-500 ">TO<span>(Month/Date/Year)</span></Label>
                    <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} />
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Sort */}
            <Button
              variant="outline"
              size="default"
              onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
              className="gap-2"
            >
              {sortOrder === "desc" ? <SortDesc className="w-4 h-4" /> : <ArrowUpAZ className="w-4 h-4" />}
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
            </Button>

            {/* View Mode */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-lg p-3">
              <Check className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">{selectedIds.size} selected</span>
              <Separator orientation="vertical" className="h-5" />
              <Button
                size="sm"
                className="gap-1 bg-red-600 hover:bg-red-700"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
                Delete Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} className="text-xs gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 ? "Deselect All" : "Select All"}
            </Button>
            <Button
              className={show6MonthOldOnly ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-orange-50 text-black hover:bg-orange-100"}
              size="sm"
              onClick={toggleOlderThan6Months}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {show6MonthOldOnly ? "Clear 6+ Month Filter" : "Show 6+ Month Old"}
            </Button>
            <div className="ml-auto text-xs text-slate-500">
              Showing {pagedMedia.length} of {filteredMedia.length} files
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium">Failed to load media</p>
            <Button variant="outline" className="mt-3" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No media files found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or upload new media</p>
          </div>
        ) : viewMode === "grid" ? (
          /* ---- GRID VIEW ---- */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {pagedMedia.map((media) => (
              <div
                key={media.id}
                className={cn(
                  "group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer",
                  selectedIds.has(media.id) ? "ring-2 ring-teal-500 border-teal-300" : "border-slate-200 hover:border-teal-200"
                )}
              >
                {/* Checkbox */}
                <div
                  className="absolute top-2 left-2 z-10"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(media.id); }}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    selectedIds.has(media.id) ? "bg-teal-500 border-teal-500" : "border-white/80 bg-black/20 group-hover:border-white"
                  )}>
                    {selectedIds.has(media.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="w-7 h-7 bg-white/90 backdrop-blur-sm shadow-sm">
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openRenameDialog(media)}>
                        <Pencil className="w-4 h-4 mr-2 hover:text-white" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(media)}>
                        <Download className="w-4 h-4 mr-2 hover:text-white" /> Download
                      </DropdownMenuItem>
                      {media.type === "IMAGE" && (
                        <DropdownMenuItem onClick={() => { setCropMedia(media); setCropSettings({ x: 0, y: 0, width: 100, height: 100 }); }}>
                          <Crop className="w-4 h-4 mr-2 hover:text-white" /> Crop
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => { setReplaceMedia(media); }}>
                        <Replace className="w-4 h-4 mr-2 hover:text-white" /> Replace
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteMedia(media)}>
                        <Trash2 className="w-4 h-4 mr-2 hover:text-white" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Thumbnail */}
                <div className="aspect-square bg-slate-100" onClick={() => setPreviewMedia(media)}>
                  {media.type === "IMAGE" ? (
                    <Image
                      src={media.url}
                      alt={media.filename || "Media"}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : media.type === "VIDEO" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50">
                      <FileVideo className="w-8 h-8" />
                      <span className="text-xs">Video</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs">{media.type}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-700 truncate" title={media.filename || "Unnamed"}>
                    {media.filename || "Unnamed"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{formatFileSize(media.size)}</span>
                    <span className="text-[10px] text-slate-400">{format(new Date(media.createdAt), "MMM d, yy")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ---- LIST VIEW ---- */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="w-10 p-3">
                      <Checkbox
                        checked={selectedIds.size === filteredMedia.length && filteredMedia.length > 0}
                        onCheckedChange={() => selectAll()}
                      />
                    </th>
                    <th className="w-16 p-3"></th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Filename</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Size</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Uploader</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Uploaded</th>
                    <th className="w-16 p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedMedia.map((media) => (
                    <tr key={media.id} className={cn("hover:bg-slate-50 transition-colors", selectedIds.has(media.id) && "bg-teal-50")}>
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(media.id)}
                          onCheckedChange={() => toggleSelect(media.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div
                          className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                          onClick={() => setPreviewMedia(media)}
                        >
                          {media.type === "IMAGE" ? (
                            <Image src={media.url} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              {getMediaIcon(media.type)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-slate-700 truncate block max-w-[200px]" title={media.filename || "Unnamed"}>
                          {media.filename || "Unnamed"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{media.type}</Badge>
                      </td>
                      <td className="p-3 text-sm text-slate-600">{formatFileSize(media.size)}</td>
                      <td className="p-3 text-sm text-slate-600">{media.uploader?.name || media.uploader?.email || "Unknown"}</td>
                      <td className="p-3 text-sm text-slate-500">{format(new Date(media.createdAt), "MMM d, yyyy HH:mm")}</td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openRenameDialog(media)}>
                              <Pencil className="w-4 h-4 mr-2 hover:text-white" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(media)}>
                              <Download className="w-4 h-4 mr-2 hover:text-white" /> Download
                            </DropdownMenuItem>
                            {media.type === "IMAGE" && (
                              <DropdownMenuItem onClick={() => { setCropMedia(media); setCropSettings({ x: 0, y: 0, width: 100, height: 100 }); }}>
                                <Crop className="w-4 h-4 mr-2 hover:text-white" /> Crop
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setReplaceMedia(media)}>
                              <Replace className="w-4 h-4 mr-2 hover:text-white" /> Replace
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteMedia(media)}>
                              <Trash2 className="w-4 h-4 mr-2 hover:text-white" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage((p) => p - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (totalPages > 7 && page !== 1 && page !== totalPages && (page < currentPage - 1 || page > currentPage + 1)) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                    }
                    return null;
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage((p) => p + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* ======== DIALOGS ======== */}

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="overflow-hidden">{previewMedia?.filename || "Media Preview"}</DialogTitle>
            <DialogDescription>
              {previewMedia && (
                <span className="flex items-center gap-3 text-xs">
                  <Badge variant="outline">{previewMedia.type}</Badge>
                  <span>{formatFileSize(previewMedia.size)}</span>
                  <span>{format(new Date(previewMedia.createdAt), "PPpp")}</span>
                  {previewMedia.uploader && (
                    <span>by {previewMedia.uploader.name || previewMedia.uploader.email}</span>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center max-h-[60vh] overflow-auto">
            {previewMedia?.type === "IMAGE" ? (
              <Image
                src={previewMedia.url}
                alt={previewMedia.filename || "Preview"}
                width={800}
                height={600}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
                unoptimized
              />
            ) : previewMedia?.type === "VIDEO" ? (
              <video src={previewMedia.url} controls className="max-w-full max-h-[60vh] rounded-lg" />
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                <p>Preview not available for this file type</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => previewMedia && handleDownload(previewMedia)} className="gap-2">
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => { if (previewMedia) { openRenameDialog(previewMedia); } setPreviewMedia(null); }} className="gap-2">
              <Pencil className="w-4 h-4" /> Rename
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { if (previewMedia) setDeleteMedia(previewMedia); setPreviewMedia(null); }} className="gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameMedia} onOpenChange={(open) => { if (!open) { setRenameMedia(null); setRenameError(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Media</DialogTitle>
            <DialogDescription>
              Enter a new name. Only letters, numbers, spaces, hyphens and underscores are allowed.
              The file extension is locked and cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase">File Name</Label>
            <div className="flex items-center gap-0">
              <Input
                value={renameValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setRenameValue(val);
                  if (!val.trim()) {
                    setRenameError("Filename cannot be empty.");
                  } else if (!VALID_NAME_RE.test(val.trim())) {
                    setRenameError("Only letters, numbers, spaces, - and _ are allowed. No dots, @, #, or other special characters.");
                  } else {
                    setRenameError("");
                  }
                }}
                placeholder="Enter new name"
                onKeyDown={(e) => e.key === "Enter" && !renameError && handleRename()}
                className={`rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                  renameError ? "border-red-400 focus-visible:border-red-400" : ""
                }`}
              />
              {renameExt && (
                <div className="flex items-center px-3 h-10 bg-slate-100 border border-slate-300 rounded-r-md text-sm font-mono text-slate-600 select-none whitespace-nowrap">
                  {renameExt}
                </div>
              )}
            </div>
            {renameError ? (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />{renameError}
              </p>
            ) : renameValue.trim() ? (
              <p className="text-xs text-slate-400">
                Final name: <span className="font-mono text-slate-600">{renameValue.trim()}{renameExt}</span>
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRenameMedia(null); setRenameError(""); }}>Cancel</Button>
            <Button
              onClick={handleRename}
              disabled={actionLoading || !renameValue.trim() || !!renameError}
              className="gap-2"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Dialog */}
      <AlertDialog open={!!deleteMedia} onOpenChange={(open) => !open && setDeleteMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteMedia?.filename || "this file"}&quot; from both storage and database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMedia && handleDelete(deleteMedia.id)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Media Files?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected files from both storage and database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleBulkDelete}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete {selectedIds.size} Files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace Dialog */}
      <Dialog open={!!replaceMedia} onOpenChange={(open) => !open && setReplaceMedia(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Replace Media</DialogTitle>
            <DialogDescription>
              Upload a new file to replace &quot;{replaceMedia?.filename || "this file"}&quot;. The old file will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <input
            ref={replaceFileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleReplace}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
          {actionLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Replacing file...
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={!!cropMedia} onOpenChange={(open) => !open && setCropMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area using the controls below. Values are in percentages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cropMedia && (
              <div className="relative bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: 300 }}>
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cropMedia.url}
                    alt="Crop preview"
                    className="max-w-full max-h-[400px] object-contain"
                    crossOrigin="anonymous"
                  />
                  {/* Crop overlay */}
                  <div
                    className="absolute border-2 border-teal-500 bg-teal-500/10"
                    style={{
                      left: `${cropSettings.x}%`,
                      top: `${cropSettings.y}%`,
                      width: `${cropSettings.width}%`,
                      height: `${cropSettings.height}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">X (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cropSettings.x}
                  onChange={(e) => setCropSettings((s) => ({ ...s, x: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Y (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cropSettings.y}
                  onChange={(e) => setCropSettings((s) => ({ ...s, y: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Width (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={cropSettings.width}
                  onChange={(e) => setCropSettings((s) => ({ ...s, width: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-xs">Height (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={cropSettings.height}
                  onChange={(e) => setCropSettings((s) => ({ ...s, height: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropMedia(null)}>Cancel</Button>
            <Button onClick={handleCrop} disabled={actionLoading} className="gap-2">
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Select files to upload to the media gallery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">Click to select files</p>
              <p className="text-xs text-slate-400 mt-1">Images and videos supported</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setUploadFiles(Array.from(e.target.files));
                }
              }}
            />
            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-2 text-sm">
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-slate-400 text-xs ml-2">{formatFileSize(f.size)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 ml-2"
                      onClick={() => setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadFiles([]); setUploadOpen(false); }}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploadFiles.length === 0 || uploadProgress} className="gap-2">
              {uploadProgress && <Loader2 className="w-4 h-4 animate-spin" />}
              Upload {uploadFiles.length} {uploadFiles.length === 1 ? "File" : "Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======== ZIP PROGRESS OVERLAY ======== */}
      {zipProgress.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 flex flex-col items-center gap-6">
            {/* Animated archive icon */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-teal-100 animate-ping opacity-60" />
              <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                {zipProgress.stage === "saving" ? (
                  <Download className="w-9 h-9 text-teal-600 animate-bounce" />
                ) : (
                  <DownloadCloud className="w-9 h-9 text-teal-600 animate-pulse" />
                )}
              </div>
            </div>

            {/* Stage label */}
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-800">
                {zipProgress.stage === "fetching" && "Collecting Files…"}
                {zipProgress.stage === "compressing" && "Creating ZIP Archive…"}
                {zipProgress.stage === "saving" && "Starting Download…"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {zipProgress.stage === "fetching" && (
                  <>
                    {zipProgress.current < zipProgress.total
                      ? `Fetching file ${zipProgress.current + 1} of ${zipProgress.total}`
                      : `All ${zipProgress.total} files collected`}
                    {zipProgress.filename && (
                      <span className="block truncate text-xs text-slate-400 max-w-[280px] mx-auto mt-1">
                        {zipProgress.filename}
                      </span>
                    )}
                  </>
                )}
                {zipProgress.stage === "compressing" && `Compressing ${zipProgress.total} files…`}
                {zipProgress.stage === "saving" && "Your ZIP file is ready. Download starting…"}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>
                  {zipProgress.stage === "fetching"
                    ? `${zipProgress.current} / ${zipProgress.total} files`
                    : zipProgress.stage === "compressing"
                    ? `Compressing…`
                    : "Done"}
                </span>
                <span>
                  {zipProgress.total > 0
                    ? `${Math.round((zipProgress.current / zipProgress.total) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-teal-400 to-emerald-500"
                  style={{
                    width: zipProgress.stage === "saving"
                      ? "100%"
                      : `${zipProgress.total > 0 ? Math.round((zipProgress.current / zipProgress.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-3 text-xs">
              {(["fetching", "compressing", "saving"] as const).map((s, idx) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-1.5 font-medium ${
                    zipProgress.stage === s
                      ? "text-teal-600"
                      : ["fetching", "compressing", "saving"].indexOf(zipProgress.stage) > idx
                      ? "text-emerald-500"
                      : "text-slate-300"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      zipProgress.stage === s
                        ? "border-teal-500 bg-teal-50"
                        : ["fetching", "compressing", "saving"].indexOf(zipProgress.stage) > idx
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    }`}>
                      {["fetching", "compressing", "saving"].indexOf(zipProgress.stage) > idx ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : zipProgress.stage === s ? (
                        <Loader2 className="w-3 h-3 animate-spin text-teal-500" />
                      ) : (
                        <span className="text-slate-300">{idx + 1}</span>
                      )}
                    </div>
                    {s === "fetching" ? "Fetch" : s === "compressing" ? "Zip" : "Save"}
                  </div>
                  {idx < 2 && <div className={`flex-1 h-px w-8 ${["fetching", "compressing", "saving"].indexOf(zipProgress.stage) > idx ? "bg-emerald-300" : "bg-slate-200"}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
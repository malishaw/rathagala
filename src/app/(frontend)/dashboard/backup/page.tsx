"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Download, Upload, Trash2, Loader2, HardDrive, LayoutGrid, Clock, FileSpreadsheet } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatBackupDate(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "Never", time: "" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
  };
}

type PendingAction = "restore" | "clear";

export default function BackupPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  useEffect(() => {
    setLastBackup(localStorage.getItem("lastManualBackup"));
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-backup-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/backup/stats");
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json() as Promise<{ dataSize: number; collections: number }>;
    },
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/admin/backup/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const now = new Date().toISOString();
      localStorage.setItem("lastManualBackup", now);
      setLastBackup(now);
      toast.success("Backup downloaded successfully");
    } catch {
      toast.error("Failed to download backup");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      // Reuse the JSON backup endpoint, then convert to Excel client-side
      const res = await fetch("/api/admin/backup/export");
      if (!res.ok) throw new Error("Export failed");
      const backup = await res.json();

      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();

      for (const [name, records] of Object.entries(backup.collections as Record<string, unknown[]>)) {
        const flat = records.map((row) =>
          Object.fromEntries(
            Object.entries(row as Record<string, unknown>).map(([k, v]) => {
              let cell: unknown = typeof v === "object" && v !== null ? JSON.stringify(v) : v;
              if (typeof cell === "string" && cell.length > 32000) cell = cell.slice(0, 32000) + "…";
              return [k, cell];
            })
          )
        );
        const worksheet = XLSX.utils.json_to_sheet(flat.length ? flat : [{}]);
        XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
      }

      XLSX.writeFile(workbook, `database-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel file downloaded successfully");
    } catch (e) {
      console.error("Excel export error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to download Excel file");
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const openPasswordDialog = (action: PendingAction) => {
    setPendingAction(action);
    setPassword("");
    setPasswordError("");
    setPasswordDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = "";
    openPasswordDialog("restore");
  };

  const handleVerifyPassword = async () => {
    if (!password) return;
    setIsVerifying(true);
    setPasswordError("");
    try {
      const res = await fetch("/api/admin/backup/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.valid) {
        setPasswordDialogOpen(false);
        setPassword("");
        setConfirmDialogOpen(true);
      } else {
        setPasswordError("Incorrect password. Please try again.");
      }
    } catch {
      setPasswordError("Failed to verify password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirm = async () => {
    setConfirmDialogOpen(false);
    setIsProcessing(true);
    try {
      if (pendingAction === "clear") {
        const res = await fetch("/api/admin/backup/clear", { method: "POST" });
        if (!res.ok) throw new Error("Failed to clear database");
        toast.success("Database cleared successfully");
      } else if (pendingAction === "restore" && pendingFile) {
        const formData = new FormData();
        formData.append("file", pendingFile);
        const res = await fetch("/api/admin/backup/import", { method: "POST", body: formData });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.error || "Failed to restore database");
        }
        toast.success("Database restored successfully");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
      setPendingFile(null);
    }
  };

  const handleCancelPasswordDialog = () => {
    if (isVerifying) return;
    setPasswordDialogOpen(false);
    setPendingAction(null);
    setPendingFile(null);
    setPassword("");
    setPasswordError("");
  };

  const handleCancelConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setPendingAction(null);
    setPendingFile(null);
  };

  const backupDate = formatBackupDate(lastBackup);
  const busy = isDownloading || isDownloadingExcel || isProcessing;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Database Backup
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Export, restore, or clear the application database. S3 files are not affected.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-zinc-900 text-white p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <HardDrive className="h-4 w-4" />
            Total DB Size
          </div>
          {statsLoading ? (
            <Skeleton className="h-8 w-24 bg-zinc-700" />
          ) : (
            <p className="text-3xl font-bold">{stats ? formatBytes(stats.dataSize) : "—"}</p>
          )}
        </div>

        <div className="rounded-xl bg-zinc-900 text-white p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <LayoutGrid className="h-4 w-4" />
            Total Collections
          </div>
          {statsLoading ? (
            <Skeleton className="h-8 w-16 bg-zinc-700" />
          ) : (
            <p className="text-3xl font-bold">{stats?.collections ?? "—"}</p>
          )}
        </div>

        <div className="rounded-xl bg-zinc-900 text-white p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <Clock className="h-4 w-4" />
            Last Manual Backup
          </div>
          {backupDate.date === "Never" ? (
            <p className="text-2xl font-bold text-zinc-500">Never</p>
          ) : (
            <div>
              <p className="text-xl font-bold leading-tight">{backupDate.date}</p>
              <p className="text-sm text-zinc-400 mt-1">{backupDate.time}</p>
            </div>
          )}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="rounded-xl  text-black p-5 space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Backup & Restore</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-lg  text-zinc-900 font-semibold py-8 px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-amber-500 hover:bg-amber-400 "
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Backup
          </button>
          <button
            onClick={handleDownloadExcel}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 text-white font-semibold py-3 px-4 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDownloadingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Download as Excel
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 text-white font-semibold py-3 px-4 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing && pendingAction === "restore" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload & Restore
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-800 bg-zinc-900 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-red-500 mb-4">Danger Zone</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Delete All Data</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Permanently removes all records except authentication accounts. S3 files are not affected.
            </p>
          </div>
          <button
            onClick={() => openPasswordDialog("clear")}
            disabled={isProcessing || isDownloading}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-700 bg-transparent text-red-500 text-xs font-medium px-3 py-2 hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing && pendingAction === "clear" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Delete All Data
          </button>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => !open && handleCancelPasswordDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Enter your admin password to{" "}
              {pendingAction === "clear" ? "delete all database records" : "restore the database from backup"}.
            </p>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password && !isVerifying) handleVerifyPassword();
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelPasswordDialog} disabled={isVerifying}>
              Cancel
            </Button>
            <Button onClick={handleVerifyPassword} disabled={!password || isVerifying}>
              {isVerifying && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Verify
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={(open) => !open && handleCancelConfirmDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "clear" ? "Delete All Data?" : "Restore Database?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "clear"
                ? "This will permanently delete all database records including ads, users, organizations, reports, and all other content. Authentication accounts will be preserved. This action cannot be undone."
                : `This will clear the current database and restore all records from "${pendingFile?.name}". Existing data will be lost. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirm}
            >
              {pendingAction === "clear" ? "Yes, Delete All" : "Yes, Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

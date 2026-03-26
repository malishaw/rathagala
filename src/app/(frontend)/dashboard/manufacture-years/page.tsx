"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CalendarDays, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface ManufactureYear {
  id: string;
  year: string;
}

async function fetchYears(): Promise<{ years: ManufactureYear[] }> {
  const res = await fetch("/api/admin/manufacture-years");
  if (!res.ok) throw new Error("Failed to fetch manufacture years");
  return res.json();
}

export default function ManufactureYearsPage() {
  const queryClient = useQueryClient();

  const [yearDialog, setYearDialog] = useState<{ open: boolean; edit?: ManufactureYear }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; year: string } | null>(null);
  const [yearInput, setYearInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-manufacture-years"],
    queryFn: fetchYears,
  });

  const years = data?.years ?? [];

  const createYear = useMutation({
    mutationFn: async (year: string) => {
      const res = await fetch("/api/admin/manufacture-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Year added");
      queryClient.invalidateQueries({ queryKey: ["admin-manufacture-years"] });
      queryClient.invalidateQueries({ queryKey: ["manufacture-years"] });
      setYearDialog({ open: false });
      setYearInput("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateYear = useMutation({
    mutationFn: async ({ id, year }: { id: string; year: string }) => {
      const res = await fetch(`/api/admin/manufacture-years/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Year updated");
      queryClient.invalidateQueries({ queryKey: ["admin-manufacture-years"] });
      queryClient.invalidateQueries({ queryKey: ["manufacture-years"] });
      setYearDialog({ open: false });
      setYearInput("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteYear = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/manufacture-years/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Year deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-manufacture-years"] });
      queryClient.invalidateQueries({ queryKey: ["manufacture-years"] });
      setDeleteDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Manufacture Years
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage manufacture years used in vehicle listings
          </p>
        </div>
        <Button onClick={() => { setYearInput(""); setYearDialog({ open: true }); }}>
          <Plus className="h-4 w-4 mr-1" />
          Add Year
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Years</CardTitle>
            <span className="text-sm text-muted-foreground font-normal">({years.length})</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-8 w-16" />)}
            </div>
          ) : years.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No years yet.{" "}
              <button onClick={() => { setYearInput(""); setYearDialog({ open: true }); }} className="text-primary underline">
                Add one
              </button>.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <div key={y.id} className="flex items-center gap-1 border rounded-md px-2 py-1 text-sm bg-muted/40">
                  <span>{y.year}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => { setYearInput(y.year); setYearDialog({ open: true, edit: y }); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive"
                    onClick={() => setDeleteDialog({ id: y.id, year: y.year })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={yearDialog.open} onOpenChange={(o) => !o && setYearDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{yearDialog.edit ? "Edit Year" : "Add Year"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="year-input">Year</Label>
              <Input
                id="year-input"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                placeholder="e.g. 2024"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && yearInput.trim()) {
                    if (yearDialog.edit) updateYear.mutate({ id: yearDialog.edit.id, year: yearInput });
                    else createYear.mutate(yearInput);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setYearDialog({ open: false })}>Cancel</Button>
            <Button
              disabled={!yearInput.trim() || createYear.isPending || updateYear.isPending}
              onClick={() => {
                if (yearDialog.edit) updateYear.mutate({ id: yearDialog.edit.id, year: yearInput });
                else createYear.mutate(yearInput);
              }}
            >
              {(createYear.isPending || updateYear.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {yearDialog.edit ? "Save Changes" : "Add Year"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Year</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog?.year}</strong>? This year will be removed from all listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteDialog) deleteYear.mutate(deleteDialog.id); }}
            >
              {deleteYear.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useGetReports } from "@/features/report/api/use-get-reports";
import { useUpdateReport } from "@/features/report/api/use-update-report";
import { usePublishAd } from "@/features/ads/api/use-publish-ad";
import { useUnpublishAd } from "@/features/ads/api/use-unpublish-ad";
import { useDeleteAd } from "@/features/ads/api/use-delete-ad";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Trash2,
  CheckCheck,
  XCircle,
} from "lucide-react";

interface Report {
  id: string;
  userId: string;
  adId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  ad?: {
    id: string;
    title: string;
    status: string;
  };
}

export default function ReportsManagementPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateDetails, setUpdateDetails] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState<string>("");

  const { data, isLoading, refetch } = useGetReports({
    page,
    limit: 10,
    status: statusFilter === "all" ? null : statusFilter,
  });

  const { mutate: updateReport, isPending } = useUpdateReport();
  const { mutate: publishAd, isPending: isPublishing } = usePublishAd();
  const { mutate: unpublishAd, isPending: isUnpublishing } = useUnpublishAd();
  const { mutate: deleteAd, isPending: isDeleting } = useDeleteAd();

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setUpdateStatus(report.status);
    setUpdateDetails(report.details || "");
    setIsDetailsOpen(true);
  };

  const handleUpdateReport = () => {
    if (!selectedReport) return;

    updateReport(
      {
        id: selectedReport.id,
        values: {
          status: updateStatus as "PENDING" | "REVIEWED" | "RESOLVED",
          details: updateDetails || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsDetailsOpen(false);
          refetch();
        },
      }
    );
  };

  const handlePublishAd = () => {
    if (!selectedReport?.adId) return;

    publishAd(selectedReport.adId, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleUnpublishAd = () => {
    if (!selectedReport?.adId) return;

    unpublishAd(
      { id: selectedReport.adId, reason: unpublishReason },
      {
        onSuccess: () => {
          setUnpublishReason("");
          refetch();
        },
      }
    );
  };

  const handleDeleteAd = () => {
    if (!selectedReport?.adId) return;

    deleteAd(selectedReport.adId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setIsDetailsOpen(false);
        refetch();
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "REVIEWED":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            <Eye className="w-3 h-3 mr-1" />
            Reviewed
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 p-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Report Management</h1>
        <p className="text-gray-500 mt-2">
          Review and manage user-submitted ad reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Reports</CardDescription>
            <CardTitle className="text-2xl">
              {data?.pagination.total || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {data?.reports.filter((r) => r.status === "PENDING").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Reviewed</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {data?.reports.filter((r) => r.status === "REVIEWED").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {data?.reports.filter((r) => r.status === "RESOLVED").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Reports List</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data || data.reports.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Ad Title</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {report.reporter?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {report.reporter?.email || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {report.ad?.title || "Deleted Ad"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">{report.reason}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/${report.adId}`, '_blank')}
                              disabled={!report.ad}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(report)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Actions
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review and update the report status
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Reporter Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Reporter Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    {selectedReport.reporter?.name || "Unknown"}
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{" "}
                    {selectedReport.reporter?.email || "N/A"}
                  </div>
                </div>
              </div>

              {/* Ad Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Reported Ad</h3>
                <div className="text-sm">
                  <div className="mb-1">
                    <span className="text-gray-500">Title:</span>{" "}
                    {selectedReport.ad?.title || "Deleted Ad"}
                  </div>
                  <div>
                    <span className="text-gray-500">Ad Status:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {selectedReport.ad?.status || "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Report Information</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-gray-500">Reason</Label>
                    <p className="text-sm mt-1">{selectedReport.reason}</p>
                  </div>
                  {selectedReport.details && (
                    <div>
                      <Label className="text-gray-500">Details</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">
                        {selectedReport.details}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-gray-500">Submitted</Label>
                    <p className="text-sm mt-1">{formatDate(selectedReport.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Ad Actions */}
              {selectedReport.ad && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Ad Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.ad.status !== "ACTIVE" && (
                      <Button
                        onClick={handlePublishAd}
                        disabled={isPublishing || !selectedReport.adId}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        {isPublishing ? "Publishing..." : "Publish Ad"}
                      </Button>
                    )}
                    {selectedReport.ad.status === "ACTIVE" && (
                      <div className="w-full space-y-2">
                        <Button
                          onClick={handleUnpublishAd}
                          disabled={isUnpublishing || !selectedReport.adId}
                          size="sm"
                          variant="outline"
                          className="border-orange-500 text-orange-700 hover:bg-orange-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {isUnpublishing ? "Unpublishing..." : "Unpublish Ad"}
                        </Button>
                        <Textarea
                          placeholder="Reason for unpublishing (optional)..."
                          value={unpublishReason}
                          onChange={(e) => setUnpublishReason(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={!selectedReport.adId}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Ad
                    </Button>
                  </div>
                </div>
              )}

              {/* Update Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Update Report Status</Label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REVIEWED">Reviewed</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="details">Admin Notes (Optional)</Label>
                  <Textarea
                    id="details"
                    placeholder="Add notes about this report..."
                    value={updateDetails}
                    onChange={(e) => setUpdateDetails(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateReport}
                  disabled={isPending}
                  className="bg-[#024950] hover:bg-[#036b75]"
                >
                  {isPending ? "Updating..." : "Update Report"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Ad</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this ad? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAd}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Ad"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

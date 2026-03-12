"use client";

import { useState } from "react";
import { getRelativeTime } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Send,
  Mail,
  Users,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCheck,
  X,
} from "lucide-react";
import TipTapEditor from "@/components/ui/tiptap-editor";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Newsletter {
  id: string;
  subject: string;
  htmlContent: string;
  plainContent: string | null;
  recipientCount: number;
  recipientEmails: string[];
  sentBy: string;
  sentAt: string;
  createdAt: string;
}

export default function NewsletterPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <p className="text-muted-foreground">
          Send emails to individual or all users with rich content
        </p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Mail className="h-4 w-4" />
            Sent Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <ComposeTab />
        </TabsContent>

        <TabsContent value="sent">
          <SentEmailsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== COMPOSE TAB ====================

function ComposeTab() {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const queryClient = useQueryClient();

  // Fetch all users for recipient selection
  const {
    data: recipientData,
    isLoading: recipientsLoading,
  } = useQuery({
    queryKey: ["newsletter-recipients", userSearch],
    queryFn: async () => {
      const response = await client.api.newsletter.recipients.$get({
        query: { search: userSearch || undefined },
      });
      if (!response.ok) throw new Error("Failed to fetch recipients");
      return response.json();
    },
  });

  const users = recipientData?.users ?? [];

  // Send newsletter mutation
  const sendMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      htmlContent: string;
      recipientEmails: string[];
    }) => {
      const response = await client.api.newsletter.send.$post({
        json: {
          subject: data.subject,
          htmlContent: data.htmlContent,
          recipientEmails: data.recipientEmails,
        },
      });
      if (!response.ok) {
        const err = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((err as any).message || "Failed to send newsletter");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.success((data as any).message || "Newsletter sent successfully!");
      setSubject("");
      setHtmlContent("");
      setSelectedUsers([]);
      setSelectAll(false);
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers([...users]);
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle individual user toggle
  const toggleUser = (user: User) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        const newSelection = prev.filter((u) => u.id !== user.id);
        if (selectAll) setSelectAll(false);
        return newSelection;
      } else {
        const newSelection = [...prev, user];
        if (newSelection.length === users.length) setSelectAll(true);
        return newSelection;
      }
    });
  };

  // Remove user from selection
  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    if (selectAll) setSelectAll(false);
  };

  // Handle send
  const handleSend = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!htmlContent.trim() || htmlContent === "<p></p>") {
      toast.error("Please enter email content");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    sendMutation.mutate({
      subject,
      htmlContent,
      recipientEmails: selectedUsers.map((u) => u.email),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Compose area */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compose Email</CardTitle>
            <CardDescription>
              Create beautiful emails with rich formatting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <Label>Email Content</Label>
              <TipTapEditor
                content={htmlContent}
                onChange={setHtmlContent}
              />
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {selectedUsers.length} recipient{selectedUsers.length !== 1 ? "s" : ""} selected
              </div>
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || selectedUsers.length === 0}
                className="gap-2"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sendMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Recipient selection */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipients
            </CardTitle>
            <CardDescription>
              Select individual users or all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 py-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Select All ({users.length} users)
              </label>
            </div>

            {/* Selected Users Tags */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {selectedUsers.slice(0, 10).map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    {user.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeUser(user.id)}
                    />
                  </Badge>
                ))}
                {selectedUsers.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedUsers.length - 10} more
                  </Badge>
                )}
              </div>
            )}

            {/* User List */}
            <ScrollArea className="h-100">
              {recipientsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No users found
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map((user) => {
                    const isSelected = selectedUsers.some(
                      (u) => u.id === user.id
                    );
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors ${
                          isSelected ? "bg-muted/50" : ""
                        }`}
                        onClick={() => toggleUser(user)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleUser(user)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== SENT EMAILS TAB ====================

function SentEmailsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedNewsletter, setSelectedNewsletter] =
    useState<Newsletter | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const limit = 10;

  // Fetch sent newsletters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["newsletters", { page, limit, search }],
    queryFn: async () => {
      const response = await client.api.newsletter.$get({
        query: {
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch newsletters");
      return response.json();
    },
  });

  const newsletters = data?.newsletters ?? [];
  const pagination = data?.pagination;

  // View newsletter detail
  const handleView = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setViewDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sent Emails</CardTitle>
              <CardDescription>
                View all previously sent newsletter emails
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No newsletters sent yet</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right w-40">
                      Recipients
                    </TableHead>
                    <TableHead className="w-44">Sent At</TableHead>
                    <TableHead className="w-20 text-center">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsletters.map((nl, idx) => (
                    <TableRow
                      key={nl.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(nl)}
                    >
                      <TableCell className="text-muted-foreground text-sm">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{nl.subject}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="gap-1">
                          <CheckCheck className="h-3 w-3" />
                          {nl.recipientCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getRelativeTime(nl.sentAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(nl);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Newsletter Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedNewsletter?.subject}</DialogTitle>
            <DialogDescription>
              Sent to {selectedNewsletter?.recipientCount} recipient
              {selectedNewsletter?.recipientCount !== 1 ? "s" : ""} on{" "}
              {selectedNewsletter &&
                getRelativeTime(selectedNewsletter.sentAt)}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          {/* Recipients */}
          {selectedNewsletter && selectedNewsletter.recipientEmails.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recipients</Label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selectedNewsletter.recipientEmails.map((email, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Email Content Preview */}
          <ScrollArea className="max-h-100">
            <style>{`
              .email-preview-content {
                padding: 1rem;
              }
              .email-preview-content h1 {
                font-size: 2em;
                font-weight: bold;
                margin: 0.67em 0;
              }
              .email-preview-content h2 {
                font-size: 1.5em;
                font-weight: bold;
                margin: 0.75em 0;
              }
              .email-preview-content h3 {
                font-size: 1.17em;
                font-weight: bold;
                margin: 0.83em 0;
              }
              .email-preview-content p {
                margin: 1em 0;
              }
              .email-preview-content ul {
                list-style-type: disc;
                padding-left: 2em;
                margin: 1em 0;
              }
              .email-preview-content ul li {
                margin: 0.5em 0;
              }
              .email-preview-content ol {
                list-style-type: decimal;
                padding-left: 2em;
                margin: 1em 0;
              }
              .email-preview-content ol li {
                margin: 0.5em 0;
              }
              .email-preview-content hr {
                margin: 1em 0;
                border: none;
                border-top: 1px solid #ccc;
              }
              .email-preview-content strong {
                font-weight: bold;
              }
              .email-preview-content em {
                font-style: italic;
              }
              .email-preview-content u {
                text-decoration: underline;
              }
              .email-preview-content s {
                text-decoration: line-through;
              }
              .email-preview-content a {
                color: #3b82f6;
                text-decoration: underline;
              }
            `}</style>
            <div
              className="email-preview-content max-w-none"
              dangerouslySetInnerHTML={{
                __html: selectedNewsletter?.htmlContent || "",
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

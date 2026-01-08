"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, TrendingUp, Users, Building2, FileText, BarChart3, Search, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useGetAdSummary,
  useGetAdCreationReport,
  useGetAdDeletionReport,
  useGetAdCreationByEntity,
  useGetAdAdvancedSummary,
  useGetUserSummary,
  useSearchAnalyticsUsers,
  useGetEntityHistory,
} from "@/features/report/api/use-get-analytics";
import { cn } from "@/lib/utils";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d0"];

export default function ReportPage() {
  const [period, setPeriod] = useState<"daily" | "monthly" | "range">("monthly");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Use Analytics State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; type: "user" | "organization" } | null>(null);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("ALL");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(userSearchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Fetch data
  const { data: adSummary, isLoading: loadingSummary } = useGetAdSummary();
  const { data: adCreation, isLoading: loadingCreation } = useGetAdCreationReport({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    period,
  });
  const { data: adDeletion, isLoading: loadingDeletion } = useGetAdDeletionReport({
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    period,
  });
  const { data: adByEntity, isLoading: loadingEntity } = useGetAdCreationByEntity();
  const { data: advancedSummary, isLoading: loadingAdvanced, error: advancedError } = useGetAdAdvancedSummary(vehicleTypeFilter === "ALL" ? undefined : vehicleTypeFilter);
  const { data: userSummary, isLoading: loadingUsers } = useGetUserSummary();
  const { data: searchResults, isLoading: loadingSearch } = useSearchAnalyticsUsers(debouncedSearchQuery);

  const { data: entityHistory, isLoading: loadingHistory } = useGetEntityHistory({
    id: selectedEntity?.id,
    type: selectedEntity?.type,
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    period,
  });

  // Handle PDF Download
  const handleDownloadReport = async () => {
    try {
      toast.info("Generating PDF report...", { description: "Capturing charts and data..." });

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // -- PAGE 1: Summary --
      doc.setFontSize(22);
      doc.setTextColor(13, 92, 99); // Teal
      doc.text("Analytics & Reports", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Overview Summary", 14, 40);

      const summaryData = [
        ["Metric", "Value"],
        ["Total Ads", `${adSummary?.totalAds?.toLocaleString() || 0}`],
        ["Approved Ads", `${adSummary?.approvedAds?.toLocaleString() || 0}`],
        ["Pending Ads", `${adSummary?.pendingAds?.toLocaleString() || 0}`],
        ["Draft Ads", `${adSummary?.draftAds?.toLocaleString() || 0}`],
        ["Total Users", `${userSummary?.totalUsers?.toLocaleString() || 0}`],
        ["Total Agents", `${userSummary?.totalAgents?.toLocaleString() || 0}`],
        ["Total Organizations", `${userSummary?.totalOrganizations?.toLocaleString() || 0}`],
      ];

      autoTable(doc, {
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: 45,
        theme: "grid",
        headStyles: { fillColor: [13, 92, 99] },
        styles: { fontSize: 10 },
      });

      let finalY = (doc as any).lastAutoTable.finalY + 15;

      // Helper to add image to PDF
      const addImageToPdf = async (elementId: string, title: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Check space for title
        if (finalY > pageHeight - 60) { // Ensure space for title and at least some image
          doc.addPage();
          finalY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(title, 14, finalY);
        finalY += 7;

        try {
          // Use html-to-image
          const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: '#ffffff', // Force white background
            style: {
              background: 'white', // Ensure background is white
            }
          });

          const imgProps = doc.getImageProperties(dataUrl);
          const pdfWidth = pageWidth - 28;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          // Check if image fits on current page
          if (finalY + pdfHeight > pageHeight - 10) {
            if (finalY < 40) {
              // If we just started a page and it still doesn't fit, just place it (it will scale or cut, but usually fine)
            } else {
              doc.addPage();
              finalY = 20;
            }
          }

          doc.addImage(dataUrl, "PNG", 14, finalY, pdfWidth, pdfHeight);
          finalY += pdfHeight + 10;
        } catch (err) {
          console.error(`Failed to capture ${title}:`, err);
        }
      };

      // -- Capture Charts --
      await addImageToPdf("report-creation-chart", "Ad Creation Trends");
      await addImageToPdf("report-entity-split", "Creation by User / Org");

      // Advanced charts on new page if space is tight, or just continue
      await addImageToPdf("report-advanced-charts", "Advanced Ad Details");

      doc.save("analytics-report.pdf");
      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("PDF Gen Error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Derived data for split charts
  const userAdsData = adByEntity?.data.filter(item => item.type === "user").slice(0, 10) || [];
  const orgAdsData = adByEntity?.data.filter(item => item.type === "organization").slice(0, 10) || [];

  return (
    <div className="container mx-auto py-6 space-y-6 p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            View comprehensive reports and analytics for your platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Download Report
          </Button>
          {/* <DateRangePicker date={dateRange} setDate={setDateRange} /> */}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ads">Ad Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingSummary ? "..." : adSummary?.totalAds.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Lifetime total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Ads</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {loadingSummary ? "..." : adSummary?.approvedAds.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Published & Active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Ads</CardTitle>
                <BarChart3 className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {loadingSummary ? "..." : adSummary?.pendingAds.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft Ads</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {loadingSummary ? "..." : adSummary?.draftAds.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Not yet submitted</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingUsers ? "..." : userSummary?.totalUsers.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {loadingUsers ? "..." : userSummary?.totalAgents.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {loadingUsers ? "..." : userSummary?.totalOrganizations.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ad Analytics Tab */}
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Options</CardTitle>
              <CardDescription>Select period and date range for reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Period</label>
                  <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="range">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {period === "range" && (
                  <>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-2 block">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-2 block">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ad Creation Trends</CardTitle>
              <CardDescription>
                Number of ads created over time ({period})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCreation ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={adCreation?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" name="Ads Created" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Ad Creation Split Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ad Creation by Users</CardTitle>
                <CardDescription>Top users by ad creation volume</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEntity ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userAdsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Ads" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ad Creation by Organizations</CardTitle>
                <CardDescription>Top organizations by ad creation volume</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEntity ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={orgAdsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Ads" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Advanced Ad Summaries Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Advanced Ad Summaries</h3>
                <p className="text-sm text-muted-foreground">Detailed breakdown by attributes</p>
              </div>
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Vehicle Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Vehicle Types</SelectItem>
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
            </div>
          </div>

          {/* Advanced Summaries */}
          {loadingAdvanced ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading advanced data...</p>
            </div>
          ) : !advancedSummary ? (
            <p className="text-muted-foreground">No advanced data available.</p>
          ) : (
            <div className="space-y-6" id="report-advanced-charts">
              {/* Row 1: Vehicle Types & Ad Types */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Types</CardTitle>
                    <CardDescription>Total: {advancedSummary.adTypes.total.reduce((a, b) => a + b.count, 0)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={advancedSummary.adTypes.top10}
                          dataKey="count"
                          nameKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {advancedSummary.adTypes.top10.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Ad Types</CardTitle>
                    <CardDescription>Total: {advancedSummary.listingTypes.total.reduce((a, b) => a + b.count, 0)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={advancedSummary.listingTypes.top10}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Count">
                          {advancedSummary.listingTypes.top10.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Manufacturer & Models */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Manufacturer</CardTitle>
                    <CardDescription>Total: {advancedSummary.brands.total.length}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={advancedSummary.brands.top10} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="value" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Models</CardTitle>
                    <CardDescription>Total: {advancedSummary.models.total.length}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={advancedSummary.models.top10} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="value" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Manufacture Year (NEW) */}
              <div className="grid gap-4 md:grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Manufacture Year</CardTitle>
                    <CardDescription>Total: {advancedSummary.manufacturedYears.total.length}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={advancedSummary.manufacturedYears.top10}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Conditions, Fuel, Transmissions */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {advancedSummary.conditions.top10.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{item.value}</span>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Fuel Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {advancedSummary.fuelTypes.top10.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{item.value}</span>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Transmissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {advancedSummary.transmissions.top10.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{item.value}</span>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 4: Locations */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Provinces</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {advancedSummary.provinces.top10.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{item.value}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Districts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {advancedSummary.districts.top10.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{item.value}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Cities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {advancedSummary.cities.top10.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{item.value}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>


            </div>
          )}
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userSummary?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{userSummary?.totalAgents || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{userSummary?.totalOrganizations || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-4" />

          {!selectedEntity ? (
            <>
              {/* Search Section */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-1/2">
                  <label className="text-sm font-medium mb-2 block">Search User or Organization</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search by name or email..."
                      className="pl-9"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {debouncedSearchQuery.length >= 2 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Search Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingSearch ? (
                      <p>Searching...</p>
                    ) : (
                      <div className="space-y-6">
                        {/* Users Results */}
                        <div>
                          <h3 className="font-semibold mb-2">Users</h3>
                          {searchResults?.users?.length ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Ads</TableHead>
                                  <TableHead>Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {searchResults.users.map((u: any) => (
                                  <TableRow key={u.id}>
                                    <TableCell>{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.adsCount}</TableCell>
                                    <TableCell>
                                      <Button size="sm" variant="outline" onClick={() => setSelectedEntity({ id: u.id, type: "user" })}>
                                        View Stats
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : <p className="text-sm text-muted-foreground">No users found.</p>}
                        </div>

                        {/* Orgs Results */}
                        <div>
                          <h3 className="font-semibold mb-2">Organizations</h3>
                          {searchResults?.organizations?.length ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Members</TableHead>
                                  <TableHead>Ads</TableHead>
                                  <TableHead>Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {searchResults.organizations.map((o: any) => (
                                  <TableRow key={o.id}>
                                    <TableCell>{o.name}</TableCell>
                                    <TableCell>{o.membersCount}</TableCell>
                                    <TableCell>{o.adsCount}</TableCell>
                                    <TableCell>
                                      <Button size="sm" variant="outline" onClick={() => setSelectedEntity({ id: o.id, type: "organization" })}>
                                        View Stats
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : <p className="text-sm text-muted-foreground">No organizations found.</p>}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Default Top 10 Lists (Only show if not searching or if search is empty/short) */}
              {debouncedSearchQuery.length < 2 && (
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 Single Users</CardTitle>
                      <CardDescription>By Ad Creation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userSummary?.top10Users?.map((user, index) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">{index + 1}</Badge>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{user.adsCount} ads</Badge>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedEntity({ id: user.id, type: 'user' })}>
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 Organizations</CardTitle>
                      <CardDescription>By Ad Creation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userSummary?.top10Organizations?.map((org, index) => (
                          <div key={org.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">{index + 1}</Badge>
                              <div>
                                <p className="font-medium">{org.name}</p>
                                <p className="text-sm text-muted-foreground">{org.membersCount} members</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge>{org.adsCount} ads</Badge>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedEntity({ id: org.id, type: 'organization' })}>
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            // Individual Entity View
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setSelectedEntity(null)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
              </Button>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Entity Name</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{entityHistory?.details.name}</div>
                    {entityHistory?.details.email && <p className="text-sm text-muted-foreground">{entityHistory?.details.email}</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{entityHistory?.details.totalAds}</div>
                  </CardContent>
                </Card>
                {selectedEntity.type === 'organization' && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{entityHistory?.details.membersCount}</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Ad Creation History</CardTitle>
                      <CardDescription>Activity {period}</CardDescription>
                    </div>
                    <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="h-[400px] flex items-center justify-center">
                      Loading history...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={entityHistory?.history || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" name="Ads Created" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}

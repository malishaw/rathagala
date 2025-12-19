/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "@/types/server";
import { prisma } from "@/server/prisma/client";

// Helper function to parse dates
const parseDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  return new Date(dateStr);
};

// Helper function to format dates based on period
const formatDate = (date: Date, period: string): string => {
  if (period === "daily") {
    return date.toISOString().split("T")[0];
  } else {
    // monthly
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
};

// Helper function to get date range filter
const getDateRangeFilter = (startDate?: string, endDate?: string) => {
  const filter: any = {};
  if (startDate) {
    filter.gte = parseDate(startDate);
  }
  if (endDate) {
    filter.lte = parseDate(endDate);
  }
  return Object.keys(filter).length > 0 ? filter : undefined;
};

export const getAdSummary: AppRouteHandler = async (c) => {
  try {
    const [totalAds, approvedAds, pendingAds, draftAds] = await Promise.all([
      prisma.ad.count(),
      prisma.ad.count({ where: { published: true, status: "ACTIVE" } }),
      prisma.ad.count({ where: { published: false, isDraft: false } }),
      prisma.ad.count({ where: { isDraft: true } }),
    ]);

    return c.json(
      {
        totalAds,
        approvedAds,
        pendingAds,
        draftAds,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error fetching ad summary:", error);
    return c.json(
      { message: "Failed to fetch ad summary" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAdCreationReport: AppRouteHandler = async (c) => {
  try {
    const { startDate, endDate, period } = c.req.query();
    
    const dateFilter = getDateRangeFilter(startDate, endDate);
    
    const ads = await prisma.ad.findMany({
      where: {
        createdAt: dateFilter,
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by date
    const dataMap = new Map<string, number>();
    ads.forEach((ad) => {
      const dateKey = formatDate(ad.createdAt, period || "monthly");
      dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
    });

    const data = Array.from(dataMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return c.json({ data }, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching ad creation report:", error);
    return c.json(
      { message: "Failed to fetch ad creation report" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAdDeletionReport: AppRouteHandler = async (c) => {
  try {
    const { startDate, endDate, period } = c.req.query();
    
    const dateFilter = getDateRangeFilter(startDate, endDate);
    
    // Get deleted ads (status DELETED or EXPIRED)
    const ads = await prisma.ad.findMany({
      where: {
        OR: [
          { status: "DELETED" },
          { status: "EXPIRED" },
        ],
        updatedAt: dateFilter,
      },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    // Group by date
    const dataMap = new Map<string, number>();
    ads.forEach((ad) => {
      const dateKey = formatDate(ad.updatedAt, period || "monthly");
      dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
    });

    const data = Array.from(dataMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return c.json({ data }, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching ad deletion report:", error);
    return c.json(
      { message: "Failed to fetch ad deletion report" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAdCreationByEntity: AppRouteHandler = async (c) => {
  try {
    // Get ad counts by users
    const userAds = await prisma.ad.groupBy({
      by: ["createdBy"],
      _count: true,
      orderBy: {
        _count: {
          createdBy: "desc",
        },
      },
      take: 20,
    });

    const userIds = userAds.map((ua) => ua.createdBy);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    // Get ad counts by organizations
    const orgAds = await prisma.ad.groupBy({
      by: ["orgId"],
      _count: true,
      orderBy: {
        _count: {
          orgId: "desc",
        },
      },
      take: 20,
    });

    const orgIds = orgAds.map((oa) => oa.orgId);
    const orgs = await prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });

    const orgMap = new Map(orgs.map((o) => [o.id, o.name]));

    const data = [
      ...userAds.map((ua) => ({
        name: userMap.get(ua.createdBy) || "Unknown User",
        count: ua._count,
        type: "user" as const,
      })),
      ...orgAds.map((oa) => ({
        name: orgMap.get(oa.orgId) || "Unknown Organization",
        count: oa._count,
        type: "organization" as const,
      })),
    ].sort((a, b) => b.count - a.count);

    return c.json({ data }, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching ad creation by entity:", error);
    return c.json(
      { message: "Failed to fetch ad creation by entity" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAdAdvancedSummary: AppRouteHandler = async (c) => {
  try {
    // Helper function to get counts and top 10
    const getAttributeCounts = async (field: string) => {
      const groupBy: any = await prisma.ad.groupBy({
        by: [field as any],
        _count: true,
        where: {
          [field]: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            [field]: "desc",
          },
        },
      });

      const total = groupBy.map((item: any) => ({
        value: item[field] || "Unknown",
        count: item._count,
      }));

      const top10 = total.slice(0, 10);

      return { total, top10 };
    };

    const [
      adTypes,
      listingTypes,
      brands,
      models,
      manufacturedYears,
      conditions,
      transmissions,
      fuelTypes,
      provinces,
      districts,
      cities,
    ] = await Promise.all([
      getAttributeCounts("type"),
      getAttributeCounts("listingType"),
      getAttributeCounts("brand"),
      getAttributeCounts("model"),
      getAttributeCounts("manufacturedYear"),
      getAttributeCounts("condition"),
      getAttributeCounts("transmission"),
      getAttributeCounts("fuelType"),
      getAttributeCounts("province"),
      getAttributeCounts("district"),
      getAttributeCounts("city"),
    ]);

    return c.json(
      {
        adTypes,
        listingTypes,
        brands,
        models,
        manufacturedYears,
        conditions,
        transmissions,
        fuelTypes,
        provinces,
        districts,
        cities,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error fetching ad advanced summary:", error);
    return c.json(
      { message: "Failed to fetch ad advanced summary" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getUserSummary: AppRouteHandler = async (c) => {
  try {
    // Get total counts
    const [totalUsers, totalOrganizations] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
    ]);

    // Count users with role 'agent' or those belonging to organizations
    const totalAgents = await prisma.user.count({
      where: {
        OR: [
          { role: "agent" },
          { organizationId: { not: null } },
        ],
      },
    });

    // Get top 10 users by ad count (excluding organization users)
    const usersWithAdCounts = await prisma.user.findMany({
      where: {
        organizationId: null, // Single users only
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { adsCreated: true },
        },
      },
      orderBy: {
        adsCreated: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const top10Users = usersWithAdCounts.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      adsCount: user._count.adsCreated,
    }));

    // Get top 10 organizations by ad count
    const orgsWithCounts = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { 
            ads: true,
            members: true,
          },
        },
      },
      orderBy: {
        ads: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const top10Organizations = orgsWithCounts.map((org) => ({
      id: org.id,
      name: org.name,
      adsCount: org._count.ads,
      membersCount: org._count.members,
    }));

    return c.json(
      {
        totalUsers,
        totalAgents,
        totalOrganizations,
        top10Users,
        top10Organizations,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error fetching user summary:", error);
    return c.json(
      { message: "Failed to fetch user summary" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

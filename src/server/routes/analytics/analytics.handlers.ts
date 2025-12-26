/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";
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

export const getAdSummary = async (c: any) => {
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

export const getAdCreationReport = async (c: any) => {
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

export const getAdDeletionReport = async (c: any) => {
  try {
    const { startDate, endDate, period } = c.req.query();

    const dateFilter = getDateRangeFilter(startDate, endDate);

    // Get expired or rejected ads
    const ads = await prisma.ad.findMany({
      where: {
        OR: [
          { status: "EXPIRED" },
          { status: "REJECTED" },
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

export const getAdCreationByEntity = async (c: any) => {
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

export const getAdAdvancedSummary = async (c: any) => {
  try {
    // Helper function to get counts and top 10
    const getAttributeCounts = async (field: string) => {
      const groupBy: any = await prisma.ad.groupBy({
        by: [field as any],
        _count: {
          id: true,
        },
        where: {
          [field]: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      });

      const total = groupBy.map((item: any) => ({
        value: item[field] || "Unknown",
        count: item._count.id,
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

export const getUserSummary = async (c: any) => {
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

    // Get top 10 users by ad count (showing all users regardless of organization membership)
    // First get ad counts grouped by creator
    const userAdCounts = await prisma.ad.groupBy({
      by: ["createdBy"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 50,
    });

    // Get user details for these users
    const userIds = userAdCounts.map((ua) => ua.createdBy).filter((id) => id != null);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Create a map of user ad counts
    const userAdCountMap = new Map(
      userAdCounts.map((ua) => [ua.createdBy, ua._count.id])
    );

    // Combine user data with ad counts and sort
    const top10Users = users
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        adsCount: userAdCountMap.get(user.id) || 0,
      }))
      .sort((a, b) => b.adsCount - a.adsCount)
      .slice(0, 10);

    // Get top 10 organizations by ad count
    const orgAdCounts = await prisma.ad.groupBy({
      by: ["orgId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Get organization details
    const orgIds = orgAdCounts.map((oa) => oa.orgId);
    const orgs = await prisma.organization.findMany({
      where: {
        id: { in: orgIds },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Create map of org ad counts
    const orgAdCountMap = new Map(
      orgAdCounts.map((oa) => [oa.orgId, oa._count.id])
    );

    const top10Organizations = orgs
      .map((org) => ({
        id: org.id,
        name: org.name,
        adsCount: orgAdCountMap.get(org.id) || 0,
        membersCount: org._count.members,
      }))
      .sort((a, b) => b.adsCount - a.adsCount);

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

export const getDailyActiveUsers = async (c: any) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Get unique user IDs from sessions in last 24 hours
    const activeSessions = await prisma.session.findMany({
      where: {
        updatedAt: { gte: last24Hours }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    const activeUserIds = activeSessions.map(s => s.userId);

    // Get user details for active users
    const activeUsers = await prisma.user.findMany({
      where: {
        id: { in: activeUserIds }
      },
      select: {
        id: true,
        organizationId: true,
        _count: {
          select: {
            adsCreated: true
          }
        }
      }
    });

    // Get yesterday's session count for trend
    const yesterdaySessionCount = await prisma.session.count({
      where: {
        updatedAt: {
          gte: yesterday,
          lt: last24Hours
        }
      }
    });

    // Classify users as sellers or buyers
    const sellers = activeUsers.filter(user =>
      user.organizationId || user._count.adsCreated > 0
    );
    const buyers = activeUsers.filter(user =>
      !user.organizationId && user._count.adsCreated === 0
    );

    const total = activeUsers.length;
    const sellersCount = sellers.length;
    const buyersCount = buyers.length;

    // Calculate trend
    const trend = yesterdaySessionCount > 0
      ? Math.round(((total - yesterdaySessionCount) / yesterdaySessionCount) * 100)
      : 0;

    // Generate hourly data for the last 24 hours
    const hourlyData = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourSessions = await prisma.session.findMany({
        where: {
          updatedAt: {
            gte: hourStart,
            lt: hourEnd
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });

      const hourUserIds = hourSessions.map(s => s.userId);

      const hourUsers = await prisma.user.findMany({
        where: {
          id: { in: hourUserIds }
        },
        select: {
          organizationId: true,
          _count: {
            select: {
              adsCreated: true
            }
          }
        }
      });

      const hourSellers = hourUsers.filter(u =>
        u.organizationId || u._count.adsCreated > 0
      ).length;
      const hourBuyers = hourUsers.filter(u =>
        !u.organizationId && u._count.adsCreated === 0
      ).length;

      hourlyData.push({
        hour: 23 - i,
        sellers: hourSellers,
        buyers: hourBuyers
      });
    }

    // Find peak hour
    const peakHourData = hourlyData.reduce((max, curr) =>
      (curr.sellers + curr.buyers) > (max.sellers + max.buyers) ? curr : max
    );
    const peakHour = `${peakHourData.hour}:00-${peakHourData.hour + 1}:00`;

    return c.json(
      {
        total,
        sellers: sellersCount,
        buyers: buyersCount,
        trend,
        peakHour,
        hourlyData,
        lastUpdated: now.toISOString()
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error fetching daily active users:", error);
    return c.json(
      { message: "Failed to fetch daily active users" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

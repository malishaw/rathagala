/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "@/server/db";
import { adAnalytics, ads, users, organizations } from "@/server/db/schema";
import { eq, and, or, gte, lte, count, desc, asc, isNotNull, ilike, inArray } from "drizzle-orm";

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

export const getAdViewsReport = async (c: any) => {
  try {
    const { period } = c.req.query();
    const now = new Date();
    let startDate: Date;

    if (period === "monthly") {
      // Past 12 months
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "yearly") {
      // All time (or past 10 years)
      startDate = new Date(now.getFullYear() - 9, 0, 1);
    } else {
      // daily – past 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    }

    const analyticsRecords = await db.query.adAnalytics.findMany({
      where: and(gte(adAnalytics.updatedAt, startDate), lte(adAnalytics.updatedAt, now)),
      columns: { updatedAt: true, views: true },
    });

    const dataMap = new Map<string, { count: number; views: number }>();

    // Pre-fill all buckets with zeros
    if (period === "daily") {
      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - (29 - i));
        const key = d.toISOString().split("T")[0];
        dataMap.set(key, { count: 0, views: 0 });
      }
    } else if (period === "monthly") {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        dataMap.set(key, { count: 0, views: 0 });
      }
    }

    analyticsRecords.forEach((r) => {
      let key: string;
      if (period === "monthly") {
        key = `${r.updatedAt.getFullYear()}-${String(r.updatedAt.getMonth() + 1).padStart(2, "0")}`;
      } else if (period === "yearly") {
        key = String(r.updatedAt.getFullYear());
      } else {
        key = r.updatedAt.toISOString().split("T")[0];
      }
      const existing = dataMap.get(key) || { count: 0, views: 0 };
      dataMap.set(key, { count: existing.count + 1, views: existing.views + r.views });
    });

    const data = Array.from(dataMap.entries())
      .map(([date, { count, views }]) => ({ date, adsViewed: count, totalViews: views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return c.json({ data }, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching ad views report:", error);
    return c.json(
      { message: "Failed to fetch ad views report" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getAdSummary = async (c: any) => {
  try {
    const [totalAdsRes, approvedAdsRes, pendingAdsRes, draftAdsRes] = await Promise.all([
      db.select({ value: count() }).from(ads),
      db.select({ value: count() }).from(ads).where(and(eq(ads.published, true), eq(ads.status, "ACTIVE" as any))),
      db.select({ value: count() }).from(ads).where(and(eq(ads.published, false), eq(ads.isDraft, false))),
      db.select({ value: count() }).from(ads).where(eq(ads.isDraft, true)),
    ]);

    return c.json(
      {
        totalAds: totalAdsRes[0].value,
        approvedAds: approvedAdsRes[0].value,
        pendingAds: pendingAdsRes[0].value,
        draftAds: draftAdsRes[0].value,
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

    const conditions = [];
    if (startDate) conditions.push(gte(ads.createdAt, parseDate(startDate)!));
    if (endDate) conditions.push(lte(ads.createdAt, parseDate(endDate)!));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const fetchedAds = await db.query.ads.findMany({
      where: whereClause,
      columns: {
        createdAt: true,
      },
      orderBy: (ads, { asc }) => [asc(ads.createdAt)],
    });

    // Group by date
    const dataMap = new Map<string, number>();
    fetchedAds.forEach((ad) => {
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

    const conditions = [or(eq(ads.status, "EXPIRED" as any), eq(ads.status, "REJECTED" as any))];
    if (startDate) conditions.push(gte(ads.updatedAt, parseDate(startDate)!));
    if (endDate) conditions.push(lte(ads.updatedAt, parseDate(endDate)!));

    const fetchedAds = await db.query.ads.findMany({
      where: and(...conditions),
      columns: {
        updatedAt: true,
      },
      orderBy: (ads, { asc }) => [asc(ads.updatedAt)],
    });

    // Group by date
    const dataMap = new Map<string, number>();
    fetchedAds.forEach((ad) => {
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
    const userAds = await db.select({
      createdBy: ads.createdBy,
      count: count(),
    }).from(ads)
      .where(isNotNull(ads.createdBy))
      .groupBy(ads.createdBy)
      .orderBy(desc(count()))
      .limit(20);

    const userIds = userAds.map((ua) => ua.createdBy!);
    let userMap = new Map<string, string>();
    if (userIds.length > 0) {
      const fetchedUsers = await db.query.users.findMany({
        where: inArray(users.id, userIds),
        columns: { id: true, name: true },
      });
      userMap = new Map(fetchedUsers.map((u) => [u.id, u.name!]));
    }

    // Get ad counts by organizations
    const orgAds = await db.select({
      orgId: ads.orgId,
      count: count(),
    }).from(ads)
      .where(isNotNull(ads.orgId))
      .groupBy(ads.orgId)
      .orderBy(desc(count()))
      .limit(20);

    const orgIds = orgAds.map((oa) => oa.orgId!);
    let orgMap = new Map<string, string>();
    if (orgIds.length > 0) {
      const fetchedOrgs = await db.query.organizations.findMany({
        where: inArray(organizations.id, orgIds),
        columns: { id: true, name: true },
      });
      orgMap = new Map(fetchedOrgs.map((o) => [o.id, o.name]));
    }

    const data = [
      ...userAds.map((ua) => ({
        name: userMap.get(ua.createdBy!) || "Unknown User",
        count: ua.count,
        type: "user" as const,
      })),
      ...orgAds.map((oa) => ({
        name: orgMap.get(oa.orgId!) || "Unknown Organization",
        count: oa.count,
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
    const { type } = c.req.valid("query");

    // Helper function to get counts and top 10
    const getAttributeCounts = async (field: keyof typeof ads._.columns) => {
      try {
        const conditions = [];

        if (type && field !== "type") {
          conditions.push(eq(ads.type, type as any));
        }

        if (field !== "type" && field !== "listingType") {
          conditions.push(isNotNull(ads[field]));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const groupByRes = await db.select({
          value: ads[field],
          count: count(ads.id),
        }).from(ads)
          .where(whereClause)
          .groupBy(ads[field])
          .orderBy(desc(count(ads.id)));

        const total = groupByRes.map((item: any) => ({
          value: item.value || "Unknown",
          count: item.count,
        }));

        const top10 = total.slice(0, 10);

        return { total, top10 };
      } catch (error: any) {
        console.error(`Error getting attribute counts for ${field}:`, error);
        return { total: [], top10: [], error: error.message };
      }
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
    const [totalUsersRes, totalOrganizationsRes] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(organizations),
    ]);
    const totalUsers = totalUsersRes[0].value;
    const totalOrganizations = totalOrganizationsRes[0].value;

    // Count users with role 'agent' or those belonging to organizations
    const totalAgentsRes = await db.select({ value: count() }).from(users)
      .where(or(eq(users.role, "agent"), isNotNull(users.organizationId)));
    const totalAgents = totalAgentsRes[0].value;

    // Get top 10 users by ad count
    const userAdCounts = await db.select({
      createdBy: ads.createdBy,
      count: count(ads.id),
    }).from(ads)
      .where(isNotNull(ads.createdBy))
      .groupBy(ads.createdBy)
      .orderBy(desc(count(ads.id)))
      .limit(50);

    const userIds = userAdCounts.map((ua) => ua.createdBy!).filter(Boolean);
    let fetchedUsers: any[] = [];
    if (userIds.length > 0) {
      fetchedUsers = await db.query.users.findMany({
        where: inArray(users.id, userIds),
        columns: { id: true, name: true, email: true },
      });
    }

    const userAdCountMap = new Map(
      userAdCounts.map((ua) => [ua.createdBy, ua.count])
    );

    const top10Users = fetchedUsers
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        adsCount: userAdCountMap.get(user.id) || 0,
      }))
      .sort((a, b) => b.adsCount - a.adsCount)
      .slice(0, 10);

    // Get top 10 organizations by ad count
    const orgAdCounts = await db.select({
      orgId: ads.orgId,
      count: count(ads.id),
    }).from(ads)
      .where(isNotNull(ads.orgId))
      .groupBy(ads.orgId)
      .orderBy(desc(count(ads.id)))
      .limit(10);

    const orgIds = orgAdCounts.map((oa) => oa.orgId!).filter(Boolean);
    let top10Organizations: any[] = [];
    
    if (orgIds.length > 0) {
      const fetchedOrgs = await db.query.organizations.findMany({
        where: inArray(organizations.id, orgIds),
        columns: { id: true, name: true },
      });
      
      const orgMemberCounts = await db.select({
        orgId: users.organizationId,
        count: count(users.id),
      }).from(users)
        .where(inArray(users.organizationId, orgIds))
        .groupBy(users.organizationId);
        
      const orgMemberCountMap = new Map(orgMemberCounts.map(om => [om.orgId, om.count]));
      const orgAdCountMap = new Map(orgAdCounts.map((oa) => [oa.orgId, oa.count]));

      top10Organizations = fetchedOrgs
        .map((org) => ({
          id: org.id,
          name: org.name,
          adsCount: orgAdCountMap.get(org.id) || 0,
          membersCount: orgMemberCountMap.get(org.id) || 0,
        }))
        .sort((a, b) => b.adsCount - a.adsCount);
    }

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

export const getSearchUsers = async (c: any) => {
  try {
    const { q } = c.req.query();

    if (!q || q.length < 2) {
      return c.json({ users: [], organizations: [] }, HttpStatusCodes.OK);
    }

    // Search users
    const fetchedUsers = await db.query.users.findMany({
      where: or(ilike(users.name, `%\${q}%`), ilike(users.email, `%\${q}%`)),
      limit: 20,
      columns: { id: true, name: true, email: true, role: true },
    });
    
    const userIds = fetchedUsers.map(u => u.id);
    let userAdsCounts: any[] = [];
    if (userIds.length > 0) {
      userAdsCounts = await db.select({
        userId: ads.createdBy,
        count: count(ads.id),
      }).from(ads).where(inArray(ads.createdBy, userIds)).groupBy(ads.createdBy);
    }
    const userAdsCountMap = new Map(userAdsCounts.map(u => [u.userId, u.count]));

    const formattedUsers = fetchedUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      adsCount: userAdsCountMap.get(u.id) || 0,
    }));

    // Search organizations
    const fetchedOrgs = await db.query.organizations.findMany({
      where: ilike(organizations.name, `%\${q}%`),
      limit: 20,
      columns: { id: true, name: true },
    });
    
    const orgIds = fetchedOrgs.map(o => o.id);
    let orgAdsCounts: any[] = [];
    let orgMemberCounts: any[] = [];
    if (orgIds.length > 0) {
      orgAdsCounts = await db.select({
        orgId: ads.orgId,
        count: count(ads.id),
      }).from(ads).where(inArray(ads.orgId, orgIds)).groupBy(ads.orgId);
      
      orgMemberCounts = await db.select({
        orgId: users.organizationId,
        count: count(users.id),
      }).from(users).where(inArray(users.organizationId, orgIds)).groupBy(users.organizationId);
    }
    const orgAdsCountMap = new Map(orgAdsCounts.map(o => [o.orgId, o.count]));
    const orgMemberCountMap = new Map(orgMemberCounts.map(o => [o.orgId, o.count]));

    const formattedOrgs = fetchedOrgs.map((o) => ({
      id: o.id,
      name: o.name,
      membersCount: orgMemberCountMap.get(o.id) || 0,
      adsCount: orgAdsCountMap.get(o.id) || 0,
    }));

    return c.json(
      {
        users: formattedUsers,
        organizations: formattedOrgs,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error searching users:", error);
    return c.json(
      { message: "Failed to search users" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getEntityHistory = async (c: any) => {
  try {
    const { id, type, startDate, endDate, period } = c.req.query();

    let details: any = { id };
    let history: any[] = [];
    let last10Ads: any[] = [];

    const conditions = [];
    if (startDate) conditions.push(gte(ads.createdAt, parseDate(startDate)!));
    if (endDate) conditions.push(lte(ads.createdAt, parseDate(endDate)!));

    if (type === "user") {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: { id: true, name: true, email: true },
      });

      if (!user) return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);

      const totalAdsRes = await db.select({ value: count() }).from(ads).where(eq(ads.createdBy, id));
      
      details = {
        id: user.id,
        name: user.name,
        email: user.email,
        totalAds: totalAdsRes[0].value,
      };

      const dateConditions = [eq(ads.createdBy, id), ...conditions];
      const fetchedAds = await db.query.ads.findMany({
        where: and(...dateConditions),
        columns: { createdAt: true },
        orderBy: (ads, { asc }) => [asc(ads.createdAt)],
      });

      const dataMap = new Map<string, number>();
      fetchedAds.forEach((ad) => {
        const dateKey = formatDate(ad.createdAt, period || "monthly");
        dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
      });

      history = Array.from(dataMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      last10Ads = await db.query.ads.findMany({
        where: eq(ads.createdBy, id),
        columns: {
          id: true, title: true, brand: true, model: true, type: true, 
          status: true, published: true, createdAt: true, 
          phoneNumber: true, whatsappNumber: true,
        },
        orderBy: (ads, { desc }) => [desc(ads.createdAt)],
        limit: 10,
        with: {
          media: {
            with: { media: { columns: { url: true } } },
            orderBy: (adMedia, { asc }) => [asc(adMedia.order)],
            limit: 1,
          },
        },
      });

    } else if (type === "organization") {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
        columns: { id: true, name: true },
      });

      if (!org) return c.json({ message: "Organization not found" }, HttpStatusCodes.NOT_FOUND);

      const [totalAdsRes, membersCountRes] = await Promise.all([
        db.select({ value: count() }).from(ads).where(eq(ads.orgId, id)),
        db.select({ value: count() }).from(users).where(eq(users.organizationId, id)),
      ]);

      details = {
        id: org.id,
        name: org.name,
        membersCount: membersCountRes[0].value,
        totalAds: totalAdsRes[0].value,
      };

      const dateConditions = [eq(ads.orgId, id), ...conditions];
      const fetchedAds = await db.query.ads.findMany({
        where: and(...dateConditions),
        columns: { createdAt: true },
        orderBy: (ads, { asc }) => [asc(ads.createdAt)],
      });

      const dataMap = new Map<string, number>();
      fetchedAds.forEach((ad) => {
        const dateKey = formatDate(ad.createdAt, period || "monthly");
        dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
      });

      history = Array.from(dataMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      last10Ads = await db.query.ads.findMany({
        where: eq(ads.orgId, id),
        columns: {
          id: true, title: true, brand: true, model: true, type: true, 
          status: true, published: true, createdAt: true, 
          phoneNumber: true, whatsappNumber: true,
        },
        orderBy: (ads, { desc }) => [desc(ads.createdAt)],
        limit: 10,
        with: {
          media: {
            with: { media: { columns: { url: true } } },
            orderBy: (adMedia, { asc }) => [asc(adMedia.order)],
            limit: 1,
          },
        },
      });
    }

    return c.json({ history, details, ads: last10Ads }, HttpStatusCodes.OK);
  } catch (error) {
    console.error("Error fetching entity history:", error);
    return c.json(
      { message: "Failed to fetch entity history" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

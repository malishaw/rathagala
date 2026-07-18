/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/types/server";
import { db } from "@/server/db";
import { reports, ads, users } from "@/server/db/schema";
import { eq, and, count } from "drizzle-orm";

import type {
  ListRoute,
  CreateRoute,
  GetOneRoute,
  UpdateRoute,
  RemoveRoute,
  GetByAdIdRoute,
  GetUserReportsRoute,
} from "./report.routes";

// ---- List Reports Handler ----
export const list: AppRouteHandler<ListRoute> = async (c) => {
  try {
    const query = c.req.query();
    const user = c.get("user");

    // Check if user is admin
    const userRole = (user as any)?.role;
    const isAdmin = userRole === "admin";

    if (!isAdmin) {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const page = query.page ?? "1";
    const limit = query.limit ?? "10";
    const status = query.status;
    const adId = query.adId;
    const userId = query.userId;

    // Convert to numbers and validate
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (status && status.trim() !== "") {
      conditions.push(eq(reports.status, status as any));
    }

    if (adId && adId.trim() !== "") {
      conditions.push(eq(reports.adId, adId));
    }

    if (userId && userId.trim() !== "") {
      conditions.push(eq(reports.userId, userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total reports
    const totalRes = await db.select({ value: count() }).from(reports).where(whereClause);
    const totalReports = totalRes[0].value;

    // Fetch reports with pagination
    const fetchedReports = await db.query.reports.findMany({
      where: whereClause,
      offset: offset,
      limit: limitNum,
      orderBy: (reports, { desc }) => [desc(reports.createdAt)],
      with: {
        reporter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          columns: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedReports = fetchedReports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));

    return c.json(
      {
        reports: formattedReports,
        pagination: {
          total: totalReports,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalReports / limitNum),
        },
      },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("[LIST REPORTS] Error:", error);

    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---- Create Report Handler ----
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  try {
    const reportDetails = c.req.valid("json");
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: "Authentication required" },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Verify that the ad exists
    const ad = await db.query.ads.findFirst({
      where: eq(ads.id, reportDetails.adId),
    });

    if (!ad) {
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Check if user has already reported this ad
    const existingReport = await db.query.reports.findFirst({
      where: and(eq(reports.userId, user.id), eq(reports.adId, reportDetails.adId)),
    });

    if (existingReport) {
      return c.json(
        { message: "You have already reported this ad" },
        HttpStatusCodes.UNPROCESSABLE_ENTITY
      );
    }

    // Create the report
    const [createdReport] = await db.insert(reports).values({
      userId: user.id,
      adId: reportDetails.adId,
      reason: reportDetails.reason,
      details: reportDetails.details || null,
      status: "PENDING",
    }).returning();

    // Fetch the inserted report with relations
    const reportWithRelations = await db.query.reports.findFirst({
      where: eq(reports.id, createdReport.id),
      with: {
        reporter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          columns: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!reportWithRelations) {
      throw new Error("Failed to fetch created report relations");
    }

    // Format the response
    const formattedReport = {
      ...reportWithRelations,
      createdAt: reportWithRelations.createdAt.toISOString(),
    };

    return c.json(formattedReport, HttpStatusCodes.CREATED) as any;
  } catch (error: any) {
    console.error("[CREATE REPORT] Error:", error);

    if (error.name === "ZodError") {
      return c.json(
        {
          message: "Validation error",
          errors: error.errors,
        },
        HttpStatusCodes.UNPROCESSABLE_ENTITY
      );
    }

    return c.json(
      { message: error.message || HttpStatusPhrases.UNPROCESSABLE_ENTITY },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    );
  }
};

// ---- Get Single Report Handler ----
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  try {
    const reportId = c.req.valid("param").id;
    const user = c.get("user");

    // Check if user is admin
    const userRole = (user as any)?.role;
    const isAdmin = userRole === "admin";

    if (!isAdmin) {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const report = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
      with: {
        reporter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          columns: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
    });

    if (!report) {
      return c.json(
        { message: "Report not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Format the response
    const formattedReport = {
      ...report,
      createdAt: report.createdAt.toISOString(),
    };

    return c.json(formattedReport as any, HttpStatusCodes.OK) as any; // Type assertion due to 'createdBy' missing from Drizzle output
  } catch (error: any) {
    console.error("[GET REPORT] Error:", error);

    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---- Update Report Handler ----
export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  try {
    const reportId = c.req.valid("param").id;
    const updateDetails = c.req.valid("json");
    const user = c.get("user");

    // Check if user is admin
    const userRole = (user as any)?.role;
    const isAdmin = userRole === "admin";

    if (!isAdmin) {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    // Check if report exists
    const existingReport = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
    });

    if (!existingReport) {
      return c.json(
        { message: "Report not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Update the report
    await db.update(reports).set({
      status: updateDetails.status || existingReport.status,
      details: updateDetails.details !== undefined 
        ? updateDetails.details 
        : existingReport.details,
    }).where(eq(reports.id, reportId));

    const updatedReport = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
      with: {
        reporter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          columns: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!updatedReport) {
      throw new Error("Failed to fetch updated report");
    }

    // Format the response
    const formattedReport = {
      ...updatedReport,
      createdAt: updatedReport.createdAt.toISOString(),
    };

    return c.json(formattedReport as any, HttpStatusCodes.OK) as any;
  } catch (error: any) {
    console.error("[UPDATE REPORT] Error:", error);

    return c.json(
      { message: error.message || HttpStatusPhrases.UNPROCESSABLE_ENTITY },
      HttpStatusCodes.UNPROCESSABLE_ENTITY
    );
  }
};

// ---- Delete Report Handler ----
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  try {
    const reportId = c.req.valid("param").id;
    const user = c.get("user");

    // Check if user is admin
    const userRole = (user as any)?.role;
    const isAdmin = userRole === "admin";

    if (!isAdmin) {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    const deleted = await db.delete(reports).where(eq(reports.id, reportId)).returning();
    
    if (deleted.length === 0) {
      return c.json(
        { message: "Report not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.body(null, HttpStatusCodes.NO_CONTENT) as any;
  } catch (error: any) {
    console.error("[DELETE REPORT] Error:", error);

    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---- Get Reports by Ad ID Handler ----
export const getByAdId: AppRouteHandler<GetByAdIdRoute> = async (c) => {
  try {
    const { adId } = c.req.valid("param");
    const user = c.get("user");

    // Check if user is admin
    const userRole = (user as any)?.role;
    const isAdmin = userRole === "admin";

    if (!isAdmin) {
      return c.json(
        { message: "Admin access required" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    // Verify that the ad exists
    const ad = await db.query.ads.findFirst({
      where: eq(ads.id, adId),
    });

    if (!ad) {
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Fetch reports for this ad
    const fetchedReports = await db.query.reports.findMany({
      where: eq(reports.adId, adId),
      orderBy: (reports, { desc }) => [desc(reports.createdAt)],
      with: {
        reporter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Format the response
    const formattedReports = fetchedReports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));

    return c.json(formattedReports, HttpStatusCodes.OK) as any;
  } catch (error: any) {
    console.error("[GET REPORTS BY AD] Error:", error);

    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---- Get User's Reports Handler ----
export const getUserReports: AppRouteHandler<GetUserReportsRoute> = async (c) => {
  try {
    const user = c.get("user");

    if (!user) {
      return c.json(
        { message: "Authentication required" },
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Fetch user's reports
    const fetchedReports = await db.query.reports.findMany({
      where: eq(reports.userId, user.id),
      orderBy: (reports, { desc }) => [desc(reports.createdAt)],
      with: {
        ad: {
          columns: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedReports = fetchedReports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));

    return c.json(formattedReports, HttpStatusCodes.OK) as any;
  } catch (error: any) {
    console.error("[GET USER REPORTS] Error:", error);

    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

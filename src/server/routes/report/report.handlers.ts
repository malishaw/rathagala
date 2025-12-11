/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/types/server";

import { prisma } from "@/server/prisma/client";

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

    // Build where condition
    const whereCondition: any = {};

    if (status && status.trim() !== "") {
      whereCondition.status = status;
    }

    if (adId && adId.trim() !== "") {
      whereCondition.adId = adId;
    }

    if (userId && userId.trim() !== "") {
      whereCondition.userId = userId;
    }

    // Count total reports
    const totalReports = await prisma.report.count({
      where: whereCondition,
    });

    // Fetch reports with pagination
    const reports = await prisma.report.findMany({
      where: whereCondition,
      skip: offset,
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedReports = reports.map((report) => ({
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
    const ad = await prisma.ad.findUnique({
      where: { id: reportDetails.adId },
    });

    if (!ad) {
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Check if user has already reported this ad
    const existingReport = await prisma.report.findFirst({
      where: {
        userId: user.id,
        adId: reportDetails.adId,
      },
    });

    if (existingReport) {
      return c.json(
        { message: "You have already reported this ad" },
        HttpStatusCodes.UNPROCESSABLE_ENTITY
      );
    }

    // Create the report
    const createdReport = await prisma.report.create({
      data: {
        userId: user.id,
        adId: reportDetails.adId,
        reason: reportDetails.reason,
        details: reportDetails.details || null,
        status: "PENDING",
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedReport = {
      ...createdReport,
      createdAt: createdReport.createdAt.toISOString(),
    };

    return c.json(formattedReport, HttpStatusCodes.CREATED);
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

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdBy: true,
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

    return c.json(formattedReport, HttpStatusCodes.OK);
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
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return c.json(
        { message: "Report not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Update the report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: updateDetails.status || existingReport.status,
        details: updateDetails.details !== undefined 
          ? updateDetails.details 
          : existingReport.details,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ad: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedReport = {
      ...updatedReport,
      createdAt: updatedReport.createdAt.toISOString(),
    };

    return c.json(formattedReport, HttpStatusCodes.OK);
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

    // Check if report exists
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return c.json(
        { message: "Report not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Delete the report
    await prisma.report.delete({
      where: { id: reportId },
    });

    return c.body(null, HttpStatusCodes.NO_CONTENT);
  } catch (error: any) {
    console.error("[DELETE REPORT] Error:", error);

    if (error.code === "P2025") {
      return c.json(
        { message: "Report not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

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
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      return c.json(
        { message: "Ad not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Fetch reports for this ad
    const reports = await prisma.report.findMany({
      where: { adId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Format the response
    const formattedReports = reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));

    return c.json(formattedReports, HttpStatusCodes.OK);
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
    const reports = await prisma.report.findMany({
      where: { userId: user.id },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format the response
    const formattedReports = reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));

    return c.json(formattedReports, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("[GET USER REPORTS] Error:", error);

    return c.json(
      { message: HttpStatusPhrases.INTERNAL_SERVER_ERROR },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

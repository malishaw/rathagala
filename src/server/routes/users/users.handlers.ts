/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";

import { prisma } from "@/server/prisma/client";
import type { ListRoute, UpdateOrganizationIdRoute, GetCurrentUserRoute, UpdateProfileRoute } from "./users.routes";
import { AppRouteHandler } from "@/types/server";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user)
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );

  const isAdmin = user?.role === "admin";

  // Only admins can view users
  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.FORBIDDEN
    );
  }

  const { page = "1", limit = "10", search = "" } = c.req.valid("query");

  // Convert to numbers and validate
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Build the where condition
  let whereCondition: any = {};

  // Add search condition if provided
  if (search && search.trim() !== "") {
    whereCondition = {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    };
  }

  // First, get the total count
  const totalUsers = await prisma.user.count({
    where: whereCondition,
  });

  // Then get the paginated items
  const users = await prisma.user.findMany({
    where: whereCondition,
    skip: offset,
    take: limitNum,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      banned: true,
    },
  });

  return c.json(
    {
      users,
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalUsers / limitNum),
      },
    },
    HttpStatusCodes.OK
  );
};

// ---------- Update User OrganizationId ----------
export const updateOrganizationId: AppRouteHandler<UpdateOrganizationIdRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const { organizationId } = c.req.valid("json");

  // Verify the organization exists
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    return c.json(
      { message: "Organization not found" },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  // Update user's organizationId
  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { organizationId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    console.log(`User ${user.id} organizationId updated to: ${organizationId}`);

    return c.json(
      {
        message: "User organizationId updated successfully",
        user: updatedUser,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error updating user organizationId:", error);
    return c.json(
      {
        message: "Failed to update user organizationId",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Get Current User with OrganizationId ----------
export const getCurrentUser: AppRouteHandler<GetCurrentUserRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  try {
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!userWithOrg) {
      return c.json(
        { message: "User not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    return c.json(
      {
        id: userWithOrg.id,
        name: userWithOrg.name,
        email: userWithOrg.email,
        organizationId: userWithOrg.organizationId,
        organization: userWithOrg.organization,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error fetching current user:", error);
    return c.json(
      {
        message: "Failed to fetch user",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Update User Profile ----------
export const updateProfile: AppRouteHandler<UpdateProfileRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const { name, phone, whatsappNumber, province, district, city, location } = c.req.valid("json");

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        name,
        phone,
        whatsappNumber,
        province,
        district,
        city,
        location
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        province: true,
        district: true,
        city: true,
        location: true,
      },
    });

    return c.json(
      {
        message: "User profile updated successfully",
        user: updatedUser,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return c.json(
      {
        message: "Failed to update user profile",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};


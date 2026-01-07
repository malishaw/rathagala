/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";

import { prisma } from "@/server/prisma/client";
import type { ListRoute, UpdateOrganizationIdRoute, GetCurrentUserRoute, UpdateProfileRoute, BulkCreateRoute } from "./users.routes";
import { AppRouteHandler } from "@/types/server";
import crypto from "crypto";

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
      organizationId: true,
      phone: true,
      phoneVerified: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
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
        phone: true,
        phoneVerified: true,
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
        phone: userWithOrg.phone,
        phoneVerified: userWithOrg.phoneVerified,
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
    // Check if phone number is being updated and if it already exists for another user
    if (phone) {
      const existingUserWithPhone = await prisma.user.findFirst({
        where: {
          phone: phone,
          NOT: {
            id: user.id, // Exclude current user
          },
        },
      });

      if (existingUserWithPhone) {
        return c.json(
          { message: "This phone number is already registered with another account" },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    // Check if WhatsApp number is being updated and if it already exists for another user
    if (whatsappNumber) {
      const existingUserWithWhatsApp = await prisma.user.findFirst({
        where: {
          whatsappNumber: whatsappNumber,
          NOT: {
            id: user.id, // Exclude current user
          },
        },
      });

      if (existingUserWithWhatsApp) {
        return c.json(
          { message: "This WhatsApp number is already registered with another account" },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

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

// ---------- Assign Organization To User (Admin) ----------
import type { UpdateUserByAdminRoute, AssignOrganizationToUserRoute } from "./users.routes";

export const assignOrganizationToUser: AppRouteHandler<AssignOrganizationToUserRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.FORBIDDEN
    );
  }

  const { userId, organizationId } = c.req.valid("json");

  try {
    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return c.json(
        { message: "User not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`User ${userId} organizationId updated to: ${organizationId} by admin ${user.id}`);

    return c.json(
      {
        message: "Organization assigned successfully",
        user: updatedUser,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error assigning organization to user:", error);
    return c.json(
      {
        message: "Failed to assign organization",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Update User By Admin ----------
export const updateUserByAdmin: AppRouteHandler<UpdateUserByAdminRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.FORBIDDEN
    );
  }

  const { userId } = c.req.valid("param");
  const { name, email, role, organizationId, phone, phoneVerified, whatsappNumber, province, district, city, location } = c.req.valid("json");

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return c.json(
        { message: "User not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // If email is being changed, check if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return c.json(
          { message: "Email already in use" },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (organizationId !== undefined) updateData.organizationId = organizationId;
    if (phone !== undefined) updateData.phone = phone;
    if (phoneVerified !== undefined) updateData.phoneVerified = phoneVerified;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (province !== undefined) updateData.province = province;
    if (district !== undefined) updateData.district = district;
    if (city !== undefined) updateData.city = city;
    if (location !== undefined) updateData.location = location;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        phone: true,
        phoneVerified: true,
        whatsappNumber: true,
        province: true,
        district: true,
        city: true,
        location: true,
        emailVerified: true,
        banned: true,
        createdAt: true,
      },
    });

    return c.json(
      {
        message: "User updated successfully",
        user: updatedUser,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json(
      {
        message: "Failed to update user",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Bulk Create Users ----------
export const bulkCreate: AppRouteHandler<BulkCreateRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.FORBIDDEN
    );
  }

  const { users } = c.req.valid("json");
  let createdCount = 0;

  try {
    for (const userData of users) {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        continue; // Skip if exists
      }

      // Resolve organization if provided
      let organizationId = null;
      if (userData.organization) {
        const org = await prisma.organization.findFirst({
          where: { name: userData.organization },
        });
        if (org) {
          organizationId = org.id;
        }
      }

      await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: userData.name,
          email: userData.email,
          role: userData.role || "user",
          phone: userData.phone,
          whatsappNumber: userData.whatsappNumber,
          province: userData.province,
          district: userData.district,
          city: userData.city,
          location: userData.location,
          organizationId: organizationId,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      createdCount++;
    }

    return c.json(
      {
        message: "Users imported successfully",
        count: createdCount,
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error("Error bulk creating users:", error);
    return c.json(
      {
        message: "Failed to bulk create users",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      HttpStatusCodes.BAD_REQUEST // Or specific error code
    );
  }
};



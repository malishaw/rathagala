/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";

import { db } from "@/server/db";
import { users, organizations } from "@/server/db/schema";
import { eq, or, and, ilike, count, ne } from "drizzle-orm";
import type { ListRoute, UpdateOrganizationIdRoute, GetCurrentUserRoute, UpdateProfileRoute, BulkCreateRoute } from "./users.routes";
import { AppRouteHandler } from "@/types/server";
import crypto from "crypto";
import { sendProfileUpdatedEmail } from "@/lib/email";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user)
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );

  const isAdmin = (user as any)?.role === "admin";

  // Only admins can view users
  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.UNAUTHORIZED as any
    );
  }

  const { page = "1", limit = "10", search = "" } = c.req.valid("query");

  // Convert to numbers and validate
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Build the where condition
  let whereClause = undefined;

  // Add search condition if provided
  if (search && search.trim() !== "") {
    whereClause = or(
      ilike(users.name, `%${search}%`),
      ilike(users.email, `%${search}%`)
    );
  }

  const [totalUsersRes, fetchedUsers] = await Promise.all([
    db.select({ value: count() }).from(users).where(whereClause),
    db.query.users.findMany({
      where: whereClause,
      offset,
      limit: limitNum,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
      columns: {
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
        whatsappNumber: true,
        province: true,
        district: true,
        city: true,
        location: true,
      },
    }),
  ]);

  const totalUsers = totalUsersRes[0].value;
  
  const orgIds = Array.from(new Set(fetchedUsers.map(u => u.organizationId).filter(Boolean)));
  let orgsMap: Record<string, any> = {};
  if (orgIds.length > 0) {
    const fetchedOrgs = await db.query.organizations.findMany({
      where: (orgs, { inArray }) => inArray(orgs.id, orgIds as string[]),
      columns: { id: true, name: true }
    });
    orgsMap = Object.fromEntries(fetchedOrgs.map(o => [o.id, o]));
  }
  
  const formattedUsers = fetchedUsers.map(u => ({
    ...u,
    organization: u.organizationId ? orgsMap[u.organizationId] : null
  }));

  return c.json(
    {
      users: formattedUsers as any,
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
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!organization) {
    return c.json(
      { message: "Organization not found" },
      HttpStatusCodes.BAD_REQUEST
    );
  }

  // Update user's organizationId
  try {
    const [updatedUser] = await db.update(users).set({
      organizationId,
    })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        organizationId: users.organizationId,
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
    ) as any;
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
    const userWithOrg = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        phoneVerified: true,
        whatsappNumber: true,
        province: true,
        district: true,
        city: true,
        location: true,
        organizationId: true,
      },
    });
    
    if (userWithOrg && userWithOrg.organizationId) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, userWithOrg.organizationId),
        columns: { id: true, name: true, slug: true }
      });
      (userWithOrg as any).organization = org;
    }

    return c.json(
      userWithOrg as any,
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
    ) as any;
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

  const { name, phone, whatsappNumber, province, district, city, location, image } = c.req.valid("json");

  try {
    // Check if phone number exists in any other user's phone OR whatsappNumber field
    if (phone) {
      const existingUserWithPhone = await db.query.users.findFirst({
        where: and(
          or(eq(users.phone, phone), eq(users.whatsappNumber, phone)),
          ne(users.id, user.id)
        ),
      });

      if (existingUserWithPhone) {
        return c.json(
          { message: "This phone number already in use. Add another" },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    // Check if WhatsApp number exists in any other user's phone OR whatsappNumber field
    if (whatsappNumber) {
      const existingUserWithWhatsApp = await db.query.users.findFirst({
        where: and(
          or(eq(users.phone, whatsappNumber), eq(users.whatsappNumber, whatsappNumber)),
          ne(users.id, user.id)
        ),
      });

      if (existingUserWithWhatsApp) {
        return c.json(
          { message: "This Whatsapp number already in use. Add another" },
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    const [updatedUser] = await db.update(users).set({
      name,
      phone,
      whatsappNumber,
      province,
      district,
      city,
      location,
      image
    })
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        phone: users.phone,
        whatsappNumber: users.whatsappNumber,
        province: users.province,
        district: users.district,
        city: users.city,
        location: users.location,
      });

    // Send profile updated notification (non-blocking)
    sendProfileUpdatedEmail({ email: updatedUser.email, name: updatedUser.name || "User" }).catch((err) => {
      console.error("Failed to send profile updated email:", err);
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
    ) as any;
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

  const isAdmin = (user as any)?.role === "admin";

  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.FORBIDDEN
    );
  }

  const { userId, organizationId } = c.req.valid("json");

  try {
    // Check if user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return c.json(
        { message: "User not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Verify the organization exists
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!organization) {
      return c.json(
        { message: "Organization not found" },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Update user's organizationId
    const [updatedUser] = await db.update(users).set({
      organizationId,
    })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        organizationId: users.organizationId,
      });
      
    const finalUser = {
      ...updatedUser,
      organization: {
        id: organization.id,
        name: organization.name
      }
    };

    console.log(`User ${userId} organizationId updated to: ${organizationId} by admin ${user.id}`);

    return c.json(
      {
        message: "Organization assigned successfully",
        user: finalUser as any,
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
    ) as any;
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

  const isAdmin = (user as any)?.role === "admin";

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
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return c.json(
        { message: "User not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // If email is being changed, check if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email),
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

    const [updatedUserRaw] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        organizationId: users.organizationId,
        phone: users.phone,
        phoneVerified: users.phoneVerified,
        whatsappNumber: users.whatsappNumber,
        province: users.province,
        district: users.district,
        city: users.city,
        location: users.location,
        emailVerified: users.emailVerified,
        banned: users.banned,
        createdAt: users.createdAt,
      });

    let organizationObj = null;
    if (updatedUserRaw.organizationId) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, updatedUserRaw.organizationId),
        columns: { id: true, name: true }
      });
      organizationObj = org;
    }
    
    const finalUser = {
      ...updatedUserRaw,
      organization: organizationObj,
    };

    return c.json(
      {
        message: "User updated successfully",
        user: finalUser as any,
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
    ) as any;
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

  const isAdmin = (user as any)?.role === "admin";

  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.FORBIDDEN
    );
  }

  const { users: newUsers } = c.req.valid("json");
  let createdCount = 0;

  try {
    for (const userData of newUsers) {
      // Check if user exists by email
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email),
      });

      if (existingUser) {
        continue; // Skip if exists
      }

      // Resolve organization if provided
      let organizationId = null;
      if (userData.organization) {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.name, userData.organization),
        });
        if (org) {
          organizationId = org.id;
        }
      }

      await db.insert(users).values({
        id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email,
        role: (userData.role || "user") as any,
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

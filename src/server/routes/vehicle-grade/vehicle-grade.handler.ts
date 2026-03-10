import { prisma } from "@/server/prisma/client";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/types/server";
import type { ListRoute, GetOneRoute, CreateRoute, UpdateRoute, RemoveRoute, ClearUserGradeRoute } from "./vehicle-grade.routes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAdmin(user: any): boolean {
  return user?.role === "admin";
}

function formatGrade(m: {
  id: string;
  name: string;
  model: string | null;
  brand: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...m,
    model: m.model ?? null,
    brand: m.brand ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// ---------- List ----------
export const list: AppRouteHandler<ListRoute> = async (c) => {
  try {
    const query = c.req.query();
    const page = Math.max(1, parseInt(query.page || "1"));
    const limit = Math.max(1, Math.min(500, parseInt(query.limit || "200")));
    const search = query.search || "";
    const model = query.model || "";
    const brand = query.brand || "";
    const isActive = query.isActive;
    const offset = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (model) {
      where.model = model;
    }
    if (brand) {
      where.brand = brand;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [grades, total] = await Promise.all([
      prisma.vehicleGrade.findMany({
        where,
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.vehicleGrade.count({ where }),
    ]);

    // Optionally include user-entered grades (free-text grades stored on Ads)
    const includeUserGrades = query.includeUserGrades === "true";
    let userGradesByBrandModel: Map<string, { name: string; brand: string | null; model: string | null }> = new Map();
    if (includeUserGrades) {
      const adWhere: any = { grade: { not: null } };
      if (model) adWhere.model = model;
      if (brand) adWhere.brand = brand;
      const ads = await prisma.ad.findMany({ 
        where: adWhere, 
        select: { grade: true, brand: true, model: true }, 
        take: 10000 
      });
      
      for (const a of ads) {
        if (a.grade && typeof a.grade === "string") {
          const key = `${a.grade}|${a.brand || ""}|${a.model || ""}`;
          if (!userGradesByBrandModel.has(key)) {
            userGradesByBrandModel.set(key, {
              name: a.grade,
              brand: a.brand || null,
              model: a.model || null,
            });
          }
        }
      }
    }

    return c.json(
      {
        grades: [
          // Canonical grades from vehicleGrade collection
          ...grades.map(formatGrade),
          // Append user grades, excluding any that already exist as canonical DB grades
          ...(() => {
            const dbGradeNames = new Set(grades.map((g) => g.name.toLowerCase()));
            return Array.from(userGradesByBrandModel.values())
              .filter((userGrade) => !dbGradeNames.has(userGrade.name.toLowerCase()))
              .map((userGrade) => ({
                id: `user:${userGrade.name}`,
                name: userGrade.name,
                model: userGrade.model,
                brand: userGrade.brand,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }));
          })(),
        ],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      HttpStatusCodes.OK
    );
  } catch (error: any) {
    console.error("Error listing grades:", error);
    return c.json(
      { message: "Failed to fetch grades" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Get One ----------
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  try {
    const { id } = c.req.param();
    const grade = await prisma.vehicleGrade.findUnique({ where: { id } });
    if (!grade) {
      return c.json({ message: "Vehicle grade not found" }, HttpStatusCodes.NOT_FOUND);
    }
    return c.json(formatGrade(grade), HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("Error fetching grade:", error);
    return c.json(
      { message: "Failed to fetch grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Create ----------
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return c.json(
        { message: "Grade name is required and must be a string" },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const { previousGradeName, isUserAdded } = body as any;

    // Check if prisma.vehicleGrade exists
    if (!prisma.vehicleGrade) {
      console.error("FATAL: prisma.vehicleGrade is undefined. Prisma client may not be properly initialized.");
      return c.json(
        { message: "Database connection error. Please try again." },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    // Check for existing grade with the new name
    const existing = await prisma.vehicleGrade.findFirst({
      where: {
        name: { equals: body.name.trim(), mode: "insensitive" },
        ...(body.model ? { model: body.model } : {}),
        ...(body.brand ? { brand: body.brand } : {}),
      },
    });
    
    let finalGrade = existing;
    
    if (!existing) {
      // Create new grade
      finalGrade = await prisma.vehicleGrade.create({
        data: {
          name: body.name.trim(),
          model: body.model || null,
          brand: body.brand || null,
          isActive: body.isActive ?? true,
        },
      });
    } else if (existing && !isUserAdded) {
      // If it already exists and we're not converting from user-added, just return it
      return c.json(formatGrade(existing), HttpStatusCodes.OK);
    } else if (existing && existing.isActive !== body.isActive) {
      // Update existing grade's status if needed
      finalGrade = await prisma.vehicleGrade.update({
        where: { id: existing.id },
        data: { isActive: body.isActive },
      });
    }

    // If converting from a user-added grade, update all ads that used the old name
    if (isUserAdded && previousGradeName) {
      await prisma.ad.updateMany({
        where: { grade: previousGradeName },
        data: { grade: null },
      });
    }

    const result = finalGrade || existing;
    if (!result) {
      return c.json(
        { message: "Failed to create grade" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    return c.json(formatGrade(result), HttpStatusCodes.CREATED);
  } catch (error: any) {
    console.error("Error creating grade:", error);
    return c.json(
      { message: error?.message || "Failed to create vehicle grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Update ----------
export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  try {
    const user = c.get("user");
    if (!user || !isAdmin(user)) {
      return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
    }

    const { id } = c.req.param();
    const body = await c.req.json();

    // User-added grades should already be handled on the client side by creating a new record
    if (id.startsWith("user:")) {
      return c.json({ message: "Invalid grade ID" }, HttpStatusCodes.BAD_REQUEST);
    }

    const existing = await prisma.vehicleGrade.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ message: "Vehicle grade not found" }, HttpStatusCodes.NOT_FOUND);
    }

    const updated = await prisma.vehicleGrade.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.model !== undefined && { model: body.model }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return c.json(formatGrade(updated), HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("Error updating grade:", error);
    return c.json(
      { message: error?.message || "Failed to update vehicle grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Remove ----------
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  try {
    const user = c.get("user");
    if (!user || !isAdmin(user)) {
      return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
    }

    const { id } = c.req.param();

    // User-added grades are not in the database, just return success
    if (id.startsWith("user:")) {
      return c.body(null, HttpStatusCodes.NO_CONTENT);
    }

    const existing = await prisma.vehicleGrade.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ message: "Vehicle grade not found" }, HttpStatusCodes.NOT_FOUND);
    }

    await prisma.vehicleGrade.delete({ where: { id } });

    return c.body(null, HttpStatusCodes.NO_CONTENT);
  } catch (error: any) {
    console.error("Error deleting grade:", error);
    return c.json(
      { message: error?.message || "Failed to delete vehicle grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ---------- Clear User-Added Grade ----------
export const clearUserGrade: AppRouteHandler<ClearUserGradeRoute> = async (c) => {
  try {
    const user = c.get("user");
    if (!user || !isAdmin(user)) {
      return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
    }

    const body = await c.req.json();
    const { gradeName } = body as { gradeName: string };

    if (!gradeName) {
      return c.json(
        { message: "Grade name is required" },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Clear the grade from all ads
    await prisma.ad.updateMany({
      where: { grade: gradeName },
      data: { grade: null },
    });

    return c.json({ message: "User-added grade cleared from all ads" }, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("Error clearing user grade:", error);
    return c.json(
      { message: error?.message || "Failed to clear user grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

import { db } from "@/server/db";
import { vehicleGrades, ads } from "@/server/db/schema";
import { eq, and, ilike, count, isNotNull } from "drizzle-orm";
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

    const conditions = [];
    if (search) conditions.push(ilike(vehicleGrades.name, `%${search}%`));
    if (model) conditions.push(eq(vehicleGrades.model, model));
    if (brand) conditions.push(eq(vehicleGrades.brand, brand));
    if (isActive !== undefined) conditions.push(eq(vehicleGrades.isActive, isActive === "true"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [grades, totalRes] = await Promise.all([
      db.query.vehicleGrades.findMany({
        where: whereClause,
        orderBy: (vehicleGrades, { asc }) => [asc(vehicleGrades.name)],
        offset: offset,
        limit: limit,
      }),
      db.select({ value: count() }).from(vehicleGrades).where(whereClause),
    ]);

    const total = totalRes[0].value;

    const includeUserGrades = query.includeUserGrades === "true";
    let userGradesByBrandModel: Map<string, { name: string; brand: string | null; model: string | null }> = new Map();
    const userGradeTimestamps = new Map<string, { createdAt: Date; updatedAt: Date }>();
    
    if (includeUserGrades) {
      const adConditions = [isNotNull(ads.grade)];
      if (model) adConditions.push(eq(ads.model, model));
      if (brand) adConditions.push(eq(ads.brand, brand));
      const adWhere = and(...adConditions);

      const dbAds = await db.query.ads.findMany({ 
        where: adWhere, 
        columns: { grade: true, brand: true, model: true, createdAt: true, updatedAt: true }, 
        limit: 10000 
      });
      
      for (const a of dbAds) {
        if (a.grade) {
          const key = `${a.grade}|${a.brand || ""}|${a.model || ""}`;
          if (!userGradesByBrandModel.has(key)) {
            userGradesByBrandModel.set(key, {
              name: a.grade,
              brand: a.brand || null,
              model: a.model || null,
            });
          }
          const existing = userGradeTimestamps.get(key);
          if (!existing) {
            userGradeTimestamps.set(key, { createdAt: a.createdAt, updatedAt: a.updatedAt });
          } else {
            if (a.createdAt < existing.createdAt) existing.createdAt = a.createdAt;
            if (a.updatedAt > existing.updatedAt) existing.updatedAt = a.updatedAt;
          }
        }
      }
    }

    return c.json(
      {
        grades: [
          ...grades.map(formatGrade),
          ...(() => {
            const dbGradeNames = new Set(grades.map((g) => g.name.toLowerCase()));
            return Array.from(userGradesByBrandModel.values())
              .filter((userGrade) => !dbGradeNames.has(userGrade.name.toLowerCase()))
              .map((userGrade) => {
                const key = `${userGrade.name}|${userGrade.brand || ""}|${userGrade.model || ""}`;
                const timestamps = userGradeTimestamps.get(key);
                const createdAt = timestamps?.createdAt || new Date();
                const updatedAt = timestamps?.updatedAt || createdAt;
                return {
                  id: `user:${userGrade.name}`,
                  name: userGrade.name,
                  model: userGrade.model,
                  brand: userGrade.brand,
                  isActive: true,
                  createdAt: createdAt.toISOString(),
                  updatedAt: updatedAt.toISOString(),
                };
              });
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
    ) as any;
  }
};

// ---------- Get One ----------
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  try {
    const { id } = c.req.param();
    const grade = await db.query.vehicleGrades.findFirst({ where: eq(vehicleGrades.id, id) });
    if (!grade) {
      return c.json({ message: "Vehicle grade not found" }, HttpStatusCodes.NOT_FOUND);
    }
    return c.json(formatGrade(grade), HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("Error fetching grade:", error);
    return c.json(
      { message: "Failed to fetch grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
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
    
    if (!body.name || typeof body.name !== "string") {
      return c.json(
        { message: "Grade name is required and must be a string" },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const { previousGradeName, isUserAdded } = body as any;

    const findConditions = [ilike(vehicleGrades.name, body.name.trim())];
    if (body.model) findConditions.push(eq(vehicleGrades.model, body.model));
    if (body.brand) findConditions.push(eq(vehicleGrades.brand, body.brand));

    const existing = await db.query.vehicleGrades.findFirst({
      where: and(...findConditions),
    });
    
    let finalGrade = existing;
    
    if (!existing) {
      const [newGrade] = await db.insert(vehicleGrades).values({
        name: body.name.trim(),
        model: body.model || null,
        brand: body.brand || null,
        isActive: body.isActive ?? true,
      }).returning();
      finalGrade = newGrade;
    } else if (existing && !isUserAdded) {
      return c.json({ message: "Vehicle grade already exists" }, HttpStatusCodes.CONFLICT as any);
    } else if (existing && existing.isActive !== body.isActive) {
      const [updatedGrade] = await db.update(vehicleGrades)
        .set({ isActive: body.isActive })
        .where(eq(vehicleGrades.id, existing.id))
        .returning();
      finalGrade = updatedGrade;
    }

    if (isUserAdded && previousGradeName) {
      await db.update(ads).set({ grade: null }).where(eq(ads.grade, previousGradeName));
    }

    if (!finalGrade) {
      return c.json(
        { message: "Failed to create grade" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    return c.json(formatGrade(finalGrade), HttpStatusCodes.CREATED);
  } catch (error: any) {
    console.error("Error creating grade:", error);
    return c.json(
      { message: error?.message || "Failed to create vehicle grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
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

    if (id.startsWith("user:")) {
      return c.json({ message: "Vehicle grade not found" }, HttpStatusCodes.NOT_FOUND);
    }

    const existing = await db.query.vehicleGrades.findFirst({ where: eq(vehicleGrades.id, id) });
    if (!existing) {
      return c.json({ message: "Vehicle grade not found" }, HttpStatusCodes.NOT_FOUND);
    }

    const [updated] = await db.update(vehicleGrades).set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    }).where(eq(vehicleGrades.id, id)).returning();

    return c.json(formatGrade(updated), HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("Error updating grade:", error);
    return c.json(
      { message: error?.message || "Failed to update vehicle grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
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

    if (id.startsWith("user:")) {
      return c.body(null, HttpStatusCodes.NO_CONTENT);
    }

    const deleted = await db.delete(vehicleGrades).where(eq(vehicleGrades.id, id)).returning();
    if (deleted.length === 0) {
      return c.json({ message: "Vehicle grade not found" }, HttpStatusCodes.NOT_FOUND);
    }

    return c.body(null, HttpStatusCodes.NO_CONTENT);
  } catch (error: any) {
    console.error("Error deleting grade:", error);
    return c.json(
      { message: error?.message || "Failed to delete vehicle grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
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
      ) as any;
    }

    await db.update(ads).set({ grade: null }).where(eq(ads.grade, gradeName));

    return c.json({ message: "User-added grade cleared from all ads" }, HttpStatusCodes.OK);
  } catch (error: any) {
    console.error("Error clearing user grade:", error);
    return c.json(
      { message: error?.message || "Failed to clear user grade" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    ) as any;
  }
};

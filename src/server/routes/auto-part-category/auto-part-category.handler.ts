import { db } from "@/server/db";
import { autoPartCategories } from "@/server/db/schema";
import { and, ilike, eq, count } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/types/server";
import type { ListRoute, GetOneRoute, CreateRoute, UpdateRoute, RemoveRoute } from "./auto-part-category.routes";

// Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAdmin(user: any): boolean {
  return user?.role === "admin";
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function formatCategory(c: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...c,
    description: c.description ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// ---------- List ----------
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const query = c.req.query();
  const page = Math.max(1, parseInt(query.page || "1"));
  const limit = Math.max(1, Math.min(200, parseInt(query.limit || "100")));
  const search = query.search || "";
  const isActive = query.isActive;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(ilike(autoPartCategories.name, `%${search}%`));
  }
  if (isActive !== undefined) {
    conditions.push(eq(autoPartCategories.isActive, isActive === "true"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [categories, totalRes] = await Promise.all([
    db.query.autoPartCategories.findMany({
      where: whereClause,
      orderBy: (autoPartCategories, { asc }) => [asc(autoPartCategories.name)],
      offset: offset,
      limit: limit,
    }),
    db.select({ value: count() }).from(autoPartCategories).where(whereClause),
  ]);

  const total = totalRes[0].value;

  return c.json(
    {
      categories: categories.map(formatCategory),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    HttpStatusCodes.OK
  );
};

// ---------- Get One ----------
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.param();
  const category = await db.query.autoPartCategories.findFirst({ where: eq(autoPartCategories.id, id) });
  
  if (!category) {
    return c.json({ message: "Category not found" }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(formatCategory(category), HttpStatusCodes.OK);
};

// ---------- Create ----------
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const body = await c.req.json();
  const slug = toSlug(body.name);

  // Check unique slug
  const existing = await db.query.autoPartCategories.findFirst({ where: eq(autoPartCategories.slug, slug) });
  if (existing) {
    return c.json({ message: "A category with this name already exists" }, HttpStatusCodes.CONFLICT);
  }

  const [category] = await db.insert(autoPartCategories)
    .values({
      name: body.name,
      slug,
      description: body.description ?? null,
      isActive: body.isActive ?? true,
    })
    .returning();

  return c.json(formatCategory(category), HttpStatusCodes.CREATED);
};

// ---------- Update ----------
export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();
  const existing = await db.query.autoPartCategories.findFirst({ where: eq(autoPartCategories.id, id) });
  if (!existing) {
    return c.json({ message: "Category not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const body = await c.req.json();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (body.name !== undefined) {
    updateData.name = body.name;
    updateData.slug = toSlug(body.name);
  }
  if (body.description !== undefined) updateData.description = body.description;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  const [updated] = await db.update(autoPartCategories)
    .set(updateData)
    .where(eq(autoPartCategories.id, id))
    .returning();

  return c.json(formatCategory(updated), HttpStatusCodes.OK);
};

// ---------- Delete ----------
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();
  const deleted = await db.delete(autoPartCategories).where(eq(autoPartCategories.id, id)).returning();
  
  if (deleted.length === 0) {
    return c.json({ message: "Category not found" }, HttpStatusCodes.NOT_FOUND);
  }

  return c.json({ message: "Category deleted successfully" }, HttpStatusCodes.OK);
};

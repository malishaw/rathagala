import { prisma } from "@/server/prisma/client";
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const [categories, total] = await Promise.all([
    prisma.autoPartCategory.findMany({
      where,
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.autoPartCategory.count({ where }),
  ]);

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
  const category = await prisma.autoPartCategory.findUnique({ where: { id } });
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
  const existing = await prisma.autoPartCategory.findUnique({ where: { slug } });
  if (existing) {
    return c.json({ message: "A category with this name already exists" }, HttpStatusCodes.CONFLICT);
  }

  const category = await prisma.autoPartCategory.create({
    data: {
      name: body.name,
      slug,
      description: body.description ?? null,
      isActive: body.isActive ?? true,
    },
  });

  return c.json(formatCategory(category), HttpStatusCodes.CREATED);
};

// ---------- Update ----------
export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();
  const existing = await prisma.autoPartCategory.findUnique({ where: { id } });
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

  const updated = await prisma.autoPartCategory.update({
    where: { id },
    data: updateData,
  });

  return c.json(formatCategory(updated), HttpStatusCodes.OK);
};

// ---------- Delete ----------
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();
  const existing = await prisma.autoPartCategory.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ message: "Category not found" }, HttpStatusCodes.NOT_FOUND);
  }

  await prisma.autoPartCategory.delete({ where: { id } });
  return c.json({ message: "Category deleted successfully" }, HttpStatusCodes.OK);
};

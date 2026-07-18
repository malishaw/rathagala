import { db } from "@/server/db";
import { brandCarousels } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/types/server";
import type { ListRoute, CreateRoute, UpdateRoute, RemoveRoute } from "./brand-carousel.routes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAdmin(user: any): boolean {
  return user?.role === "admin";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(item: any) {
  return {
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    order: item.order,
    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
    updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
  };
}

// ---------- List ----------
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const brands = await db.query.brandCarousels.findMany({
    orderBy: (brandCarousels, { asc }) => [asc(brandCarousels.order)],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c.json({ brands: brands.map((b: any) => serialize(b)) }, HttpStatusCodes.OK);
};

// ---------- Create ----------
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");
  console.log("Create handler - User:", user);
  
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN) as any;
  }

  const body = c.req.valid("json");
  console.log("Create handler - Body:", { name: body.name, imageSize: body.imageUrl?.length || 0 });

  try {
    const [brand] = await db.insert(brandCarousels)
      .values({
        name: body.name,
        imageUrl: body.imageUrl,
        order: body.order ?? 0,
      })
      .onConflictDoUpdate({
        target: brandCarousels.name,
        set: { imageUrl: body.imageUrl },
      })
      .returning();

    return c.json(serialize(brand), HttpStatusCodes.CREATED) as any;
  } catch (error) {
    console.error("Create error:", error);
    return c.json({ message: (error as Error).message }, HttpStatusCodes.BAD_REQUEST) as any;
  }
};

// ---------- Update ----------
export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();
  const body = c.req.valid("json");

  try {
    const [brand] = await db.update(brandCarousels)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.order !== undefined && { order: body.order }),
      })
      .where(eq(brandCarousels.id, id))
      .returning();

    if (!brand) {
      return c.json({ message: "Brand carousel item not found" }, HttpStatusCodes.NOT_FOUND);
    }

    return c.json(serialize(brand), HttpStatusCodes.OK);
  } catch {
    return c.json({ message: "Brand carousel item not found" }, HttpStatusCodes.NOT_FOUND);
  }
};

// ---------- Delete ----------
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();

  try {
    const deleted = await db.delete(brandCarousels)
      .where(eq(brandCarousels.id, id))
      .returning();

    if (deleted.length === 0) {
      return c.json({ message: "Brand carousel item not found" }, HttpStatusCodes.NOT_FOUND);
    }

    return c.json({ message: "Brand carousel item deleted" }, HttpStatusCodes.OK);
  } catch {
    return c.json({ message: "Brand carousel item not found" }, HttpStatusCodes.NOT_FOUND);
  }
};

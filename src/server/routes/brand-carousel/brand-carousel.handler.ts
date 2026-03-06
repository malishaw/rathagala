import { prisma } from "@/server/prisma/client";
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
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// ---------- List ----------
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const brands = await prisma.brandCarousel.findMany({
    orderBy: { order: "asc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c.json({ brands: brands.map((b: any) => serialize(b)) }, HttpStatusCodes.OK);
};

// ---------- Create ----------
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");
  console.log("Create handler - User:", user);
  
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const body = c.req.valid("json");
  console.log("Create handler - Body:", { name: body.name, imageSize: body.imageUrl?.length || 0 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brand = await (prisma.brandCarousel as any).upsert({
      where: { name: body.name },
      update: {
        imageUrl: body.imageUrl,
      },
      create: {
        name: body.name,
        imageUrl: body.imageUrl,
        order: body.order ?? 0,
      },
    });

    return c.json(serialize(brand), HttpStatusCodes.CREATED);
  } catch (error) {
    console.error("Create error:", error);
    return c.json({ message: (error as Error).message }, HttpStatusCodes.BAD_REQUEST);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brand = await (prisma.brandCarousel as any).update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });

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
    await prisma.brandCarousel.delete({ where: { id } });
    return c.json({ message: "Brand carousel item deleted" }, HttpStatusCodes.OK);
  } catch {
    return c.json({ message: "Brand carousel item not found" }, HttpStatusCodes.NOT_FOUND);
  }
};

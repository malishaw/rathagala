import { prisma } from "@/server/prisma/client";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/types/server";
import type { ListRoute, GetOneRoute, CreateRoute, UpdateRoute, RemoveRoute, ClearUserModelRoute } from "./vehicle-model.routes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAdmin(user: any): boolean {
  return user?.role === "admin";
}

function formatModel(m: {
  id: string;
  name: string;
  brand: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...m,
    brand: m.brand ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// ---------- List ----------
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const query = c.req.query();
  const page = Math.max(1, parseInt(query.page || "1"));
  const limit = Math.max(1, Math.min(500, parseInt(query.limit || "200")));
  const search = query.search || "";
  const brand = query.brand || "";
  const isActive = query.isActive;
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (brand) {
    where.OR = [
      { brand: brand },
      { brand: null },
    ];
  }
  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const [models, total] = await Promise.all([
    prisma.vehicleModel.findMany({
      where,
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.vehicleModel.count({ where }),
  ]);

  // Optionally include user-entered models (free-text models stored on Ads)
  const includeUserModels = query.includeUserModels === "true";
  let userModels: string[] = [];
  if (includeUserModels) {
    const adWhere: any = { model: { not: null } };
    if (brand) adWhere.brand = brand;
    const ads = await prisma.ad.findMany({ where: adWhere, select: { model: true }, take: 10000 });
    const set = new Set<string>();
    for (const a of ads) {
      if (a.model && typeof a.model === "string") set.add(a.model);
    }
    // Exclude names already present in DB models (case-insensitive) to prevent duplicates
    const dbModelNames = new Set(models.map((m) => m.name.toLowerCase()));
    userModels = Array.from(set)
      .filter((name) => !dbModelNames.has(name.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  }

  return c.json(
    {
      models: [
        // Canonical models from vehicleModel collection
        ...models.map(formatModel),
        // Append user models as objects (no id mapped to vehicleModel)
        ...userModels.map((name) => ({ 
          id: `user:${name}`, 
          name, 
          brand: brand || null, 
          isActive: true, 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString() 
        })),
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
};

// ---------- Get One ----------
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.param();
  const model = await prisma.vehicleModel.findUnique({ where: { id } });
  if (!model) {
    return c.json({ message: "Vehicle model not found" }, HttpStatusCodes.NOT_FOUND);
  }
  return c.json(formatModel(model), HttpStatusCodes.OK);
};

// ---------- Create ----------
export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const body = await c.req.json();
  const { previousModelName, isUserAdded } = body as any;

  // Check for existing model with the new name
  const existing = await prisma.vehicleModel.findFirst({
    where: {
      name: { equals: body.name, mode: "insensitive" },
      brand: body.brand || null,
    },
  });
  
  let finalModel = existing;
  
  if (!existing) {
    // Create new model
    finalModel = await prisma.vehicleModel.create({
      data: {
        name: body.name,
        brand: body.brand || null,
        isActive: body.isActive ?? true,
      },
    });
  } else if (existing && !isUserAdded) {
    // If it already exists and we're not converting from user-added, just return it
    return c.json(formatModel(existing), HttpStatusCodes.OK);
  } else if (existing && existing.isActive !== body.isActive) {
    // Update existing model's status if needed
    finalModel = await prisma.vehicleModel.update({
      where: { id: existing.id },
      data: { isActive: body.isActive },
    });
  }

  // If converting from a user-added model, update all ads that used the old name
  // This prevents the user-added model from appearing alongside the new database model
  if (isUserAdded && previousModelName) {
    await prisma.ad.updateMany({
      where: { model: previousModelName },
      data: { model: null },
    });
  }

  return c.json(finalModel ? formatModel(finalModel) : formatModel(existing!), HttpStatusCodes.CREATED);
};

// ---------- Update ----------
export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();
  const body = await c.req.json();

  // User-added models should already be handled on the client side by creating a new record
  // If somehow a user-added ID reaches here, reject it
  if (id.startsWith("user:")) {
    return c.json({ message: "Invalid model ID" }, HttpStatusCodes.BAD_REQUEST);
  }

  const existing = await prisma.vehicleModel.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ message: "Vehicle model not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const updated = await prisma.vehicleModel.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return c.json(formatModel(updated), HttpStatusCodes.OK);
};

// ---------- Remove ----------
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();

  // User-added models are not in the database, just return success
  if (id.startsWith("user:")) {
    return c.body(null, HttpStatusCodes.NO_CONTENT);
  }

  const existing = await prisma.vehicleModel.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ message: "Vehicle model not found" }, HttpStatusCodes.NOT_FOUND);
  }

  await prisma.vehicleModel.delete({ where: { id } });

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

// ---------- Clear User-Added Model ----------
export const clearUserModel: AppRouteHandler<ClearUserModelRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const body = await c.req.json();
  const { modelName } = body as { modelName: string };

  // Clear the model from all ads
  await prisma.ad.updateMany({
    where: { model: modelName },
    data: { model: null },
  });

  return c.json({ message: "User-added model cleared from all ads" }, HttpStatusCodes.OK);
};

import { db } from "@/server/db";
import { vehicleModels, ads } from "@/server/db/schema";
import { eq, and, or, ilike, count, isNotNull, isNull } from "drizzle-orm";
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

  const conditions = [];
  if (search) conditions.push(ilike(vehicleModels.name, `%${search}%`));
  if (brand) conditions.push(or(eq(vehicleModels.brand, brand), isNull(vehicleModels.brand)));
  if (isActive !== undefined) conditions.push(eq(vehicleModels.isActive, isActive === "true"));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [models, totalRes] = await Promise.all([
    db.query.vehicleModels.findMany({
      where: whereClause,
      orderBy: (vehicleModels, { asc }) => [asc(vehicleModels.name)],
      offset: offset,
      limit: limit,
    }),
    db.select({ value: count() }).from(vehicleModels).where(whereClause),
  ]);

  const total = totalRes[0].value;

  const includeUserModels = query.includeUserModels === "true";
  let userModels: string[] = [];
  if (includeUserModels) {
    const adConditions = [isNotNull(ads.model)];
    if (brand) adConditions.push(eq(ads.brand, brand));
    
    // Use groupBy to get distinct models directly from the database to save memory and CPU
    const dbAds = await db.select({ model: ads.model })
      .from(ads)
      .where(and(...adConditions))
      .groupBy(ads.model)
      .limit(200);
    
    const dbModelNames = new Set(models.map((m) => m.name.toLowerCase()));
    
    const set = new Set<string>();
    for (const a of dbAds) {
      if (a.model) {
        set.add(a.model);
      }
    }
    
    userModels = Array.from(set)
      .filter((name) => !dbModelNames.has(name.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  }

  return c.json(
    {
      models: [
        ...models.map(formatModel),
        ...userModels.map((name) => {
          const createdAt = new Date();
          const updatedAt = createdAt;
          return {
            id: `user:${name}`,
            name,
            brand: brand || null,
            isActive: true,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
          };
        }),
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
  const model = await db.query.vehicleModels.findFirst({ where: eq(vehicleModels.id, id) });
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

  const findConditions = [ilike(vehicleModels.name, body.name)];
  if (body.brand) findConditions.push(eq(vehicleModels.brand, body.brand));

  const existing = await db.query.vehicleModels.findFirst({
    where: and(...findConditions),
  });
  
  let finalModel = existing;
  
  if (!existing) {
    const [newModel] = await db.insert(vehicleModels).values({
      name: body.name,
      brand: body.brand || null,
      isActive: body.isActive ?? true,
    }).returning();
    finalModel = newModel;
  } else if (existing && !isUserAdded) {
    return c.json({ message: "Vehicle model already exists" }, HttpStatusCodes.CONFLICT as any);
  } else if (existing && existing.isActive !== body.isActive) {
    const [updatedModel] = await db.update(vehicleModels)
      .set({ isActive: body.isActive })
      .where(eq(vehicleModels.id, existing.id))
      .returning();
    finalModel = updatedModel;
  }

  if (isUserAdded && previousModelName) {
    await db.update(ads).set({ model: null }).where(eq(ads.model, previousModelName));
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

  if (id.startsWith("user:")) {
    return c.json({ message: "Vehicle model not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const existing = await db.query.vehicleModels.findFirst({ where: eq(vehicleModels.id, id) });
  if (!existing) {
    return c.json({ message: "Vehicle model not found" }, HttpStatusCodes.NOT_FOUND);
  }

  const [updated] = await db.update(vehicleModels).set({
    ...(body.name !== undefined && { name: body.name }),
    ...(body.brand !== undefined && { brand: body.brand }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  }).where(eq(vehicleModels.id, id)).returning();

  return c.json(formatModel(updated), HttpStatusCodes.OK);
};

// ---------- Remove ----------
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const user = c.get("user");
  if (!user || !isAdmin(user)) {
    return c.json({ message: "Forbidden - Admin only" }, HttpStatusCodes.FORBIDDEN);
  }

  const { id } = c.req.param();

  if (id.startsWith("user:")) {
    return c.body(null, HttpStatusCodes.NO_CONTENT);
  }

  const deleted = await db.delete(vehicleModels).where(eq(vehicleModels.id, id)).returning();
  if (deleted.length === 0) {
    return c.json({ message: "Vehicle model not found" }, HttpStatusCodes.NOT_FOUND);
  }

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

  await db.update(ads).set({ model: null }).where(eq(ads.model, modelName));

  return c.json({ message: "User-added model cleared from all ads" }, HttpStatusCodes.OK);
};

/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "@/server/db";
import { organizations, members } from "@/server/db/schema";
import { eq, and, ilike, inArray, count } from "drizzle-orm";
import type { ListRoute, GetByIdRoute } from "./org.routes";
import { AppRouteHandler } from "@/types/server";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user)
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );

  const isAdmin = (user as any)?.role === "admin";

  const { page = "1", limit = "10", search = "" } = c.req.valid("query");

  // Convert to numbers and validate
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // For non-admin users, get the organizations they're enrolled in
  let userOrganizationIds: string[] = [];

  if (!isAdmin && user) {
    // Get the organizations where the user is a member
    const userMemberships = await db.query.members.findMany({
      where: eq(members.userId, user.id),
      columns: { organizationId: true },
    });

    userOrganizationIds = userMemberships.map((m) => m.organizationId);

    if (userOrganizationIds.length === 0) {
      return c.json(
        {
          organizations: [],
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0,
          },
        },
        HttpStatusCodes.OK
      );
    }
  }

  // Build the where condition based on user role and search parameter
  const conditions = [];

  // If not admin, add organization filter
  if (!isAdmin && userOrganizationIds.length > 0) {
    conditions.push(inArray(organizations.id, userOrganizationIds));
  }

  // Add search condition if provided
  if (search && search.trim() !== "") {
    conditions.push(ilike(organizations.name, `%${search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalOrganizationsRes, fetchedOrganizations] = await Promise.all([
    db.select({ value: count() }).from(organizations).where(whereClause),
    db.query.organizations.findMany({
      where: whereClause,
      offset,
      limit: limitNum,
      orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
    }),
  ]);

  const totalOrganizations = totalOrganizationsRes[0].value;

  return c.json(
    {
      organizations: fetchedOrganizations,
      pagination: {
        total: totalOrganizations,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalOrganizations / limitNum),
      },
    },
    HttpStatusCodes.OK
  );
};

// ---------- Get Organization by ID ----------
export const getById: AppRouteHandler<GetByIdRoute> = async (c) => {
  const { id } = c.req.valid("param");

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
  });

  if (!organization) {
    return c.json(
      { message: "Organization not found" },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(organization, HttpStatusCodes.OK);
};

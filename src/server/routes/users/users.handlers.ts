/* eslint-disable @typescript-eslint/no-explicit-any */
import * as HttpStatusCodes from "stoker/http-status-codes";

import { prisma } from "@/server/prisma/client";
import type { ListRoute } from "./users.routes";
import { AppRouteHandler } from "@/types/server";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user)
    return c.json(
      { message: "Unauthenticated user" },
      HttpStatusCodes.UNAUTHORIZED
    );

  const isAdmin = user?.role === "admin";

  // Only admins can view users
  if (!isAdmin) {
    return c.json(
      { message: "Unauthorized: Admin access required" },
      HttpStatusCodes.FORBIDDEN
    );
  }

  const { page = "1", limit = "10", search = "" } = c.req.valid("query");

  // Convert to numbers and validate
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Build the where condition
  let whereCondition: any = {};

  // Add search condition if provided
  if (search && search.trim() !== "") {
    whereCondition = {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    };
  }

  // First, get the total count
  const totalUsers = await prisma.user.count({
    where: whereCondition,
  });

  // Then get the paginated items
  const users = await prisma.user.findMany({
    where: whereCondition,
    skip: offset,
    take: limitNum,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      banned: true,
    },
  });

  return c.json(
    {
      users,
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


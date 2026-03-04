import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import * as schemas from "./auto-part-category.schemas";

const tags = ["AutoPartCategory"];

// ---------- List Categories (public) ----------
export const list = createRoute({
  tags,
  summary: "List all auto part categories",
  path: "/",
  method: "get",
  request: {
    query: schemas.querySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.withPaginationSchema,
      "The list of auto part categories"
    ),
  },
});

export type ListRoute = typeof list;

// ---------- Get One Category ----------
export const getOne = createRoute({
  tags,
  summary: "Get a single auto part category",
  path: "/:id",
  method: "get",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.categorySchema, "The category"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Category not found"
    ),
  },
});

export type GetOneRoute = typeof getOne;

// ---------- Create Category (admin only) ----------
export const create = createRoute({
  tags,
  summary: "Create an auto part category",
  path: "/",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      schemas.createCategorySchema,
      "Category data"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      schemas.categorySchema,
      "Category created"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Invalid input"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({ message: z.string() }),
      "Category already exists"
    ),
  },
});

export type CreateRoute = typeof create;

// ---------- Update Category (admin only) ----------
export const update = createRoute({
  tags,
  summary: "Update an auto part category",
  path: "/:id",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
    body: jsonContentRequired(schemas.updateCategorySchema, "Updated category data"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.categorySchema, "Category updated"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Category not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});

export type UpdateRoute = typeof update;

// ---------- Delete Category (admin only) ----------
export const remove = createRoute({
  tags,
  summary: "Delete an auto part category",
  path: "/:id",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Category deleted"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Category not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});

export type RemoveRoute = typeof remove;

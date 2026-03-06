import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import * as schemas from "./brand-carousel.schemas";

const tags = ["BrandCarousel"];

// ---------- List All (public) ----------
export const list = createRoute({
  tags,
  summary: "List all brand carousel items",
  description: "Retrieve all brand carousel items ordered by position",
  path: "/",
  method: "get",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.listBrandCarouselResponseSchema,
      "The list of brand carousel items"
    ),
  },
});
export type ListRoute = typeof list;

// ---------- Create ----------
export const create = createRoute({
  tags,
  summary: "Create a brand carousel item",
  description: "Add a new brand to the carousel (admin only)",
  path: "/",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      schemas.createBrandCarouselSchema,
      "The brand carousel item to create"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      schemas.brandCarouselResponseSchema,
      "The created brand carousel item"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});
export type CreateRoute = typeof create;

// ---------- Update ----------
export const update = createRoute({
  tags,
  summary: "Update a brand carousel item",
  description: "Update an existing brand carousel item (admin only)",
  path: "/:id",
  method: "put",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
    body: jsonContentRequired(
      schemas.updateBrandCarouselSchema,
      "The fields to update"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.brandCarouselResponseSchema,
      "The updated brand carousel item"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});
export type UpdateRoute = typeof update;

// ---------- Delete ----------
export const remove = createRoute({
  tags,
  summary: "Delete a brand carousel item",
  description: "Remove a brand from the carousel (admin only)",
  path: "/:id",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Successfully deleted"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});
export type RemoveRoute = typeof remove;

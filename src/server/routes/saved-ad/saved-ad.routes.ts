import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";
import * as schemas from "./saved-ad.schemas";

const tags = ["Favorites"];

// GET /saved-ad - List all user's favorites
export const list = createRoute({
  tags,
  summary: "Get user's favorite ads",
  description: "Retrieve all ads saved by the current user",
  path: "/",
  method: "get",
  middleware: [serverAuthMiddleware], // Require authentication
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.favoritesListSchema,
      "List of favorite ads"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "User not authenticated"
    ),
  },
});

// POST /saved-ad - Add ad to favorites
export const create = createRoute({
  tags,
  summary: "Add ad to favorites",
  description: "Save an ad to user's favorites list",
  path: "/",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      schemas.addFavoriteSchema,
      "Ad to add to favorites"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      schemas.favoriteSchema,
      "Ad added to favorites"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Ad already in favorites or invalid ad ID"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "User not authenticated"
    ),
  },
});

// DELETE /saved-ad/:adId - Remove from favorites
export const remove = createRoute({
  tags,
  summary: "Remove ad from favorites",
  description: "Remove a saved ad from user's favorites",
  path: "/:adId",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({
      adId: z.string().min(1),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Ad removed from favorites"),
      "Success message"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Favorite not found"
    ),
  },
});

// GET /saved-ad/check/:adId - Check if ad is favorited
export const check = createRoute({
  tags,
  summary: "Check if ad is favorited",
  description: "Check if an ad is in user's favorites",
  path: "/check/:adId",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({
      adId: z.string().min(1),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.checkFavoriteSchema,
      "Favorite status"
    ),
  },
});

// Export route types for handlers
export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type RemoveRoute = typeof remove;
export type CheckRoute = typeof check;

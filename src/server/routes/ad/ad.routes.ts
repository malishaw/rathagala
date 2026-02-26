import { createRoute, z } from "@hono/zod-openapi";
import {
  jsonContent,
  jsonContentOneOf,
  jsonContentRequired,
} from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";

import {
  createErrorSchema,
  createMessageObjectSchema,
} from "stoker/openapi/schemas";
import { notFoundSchema } from "@/server/helpers/constants";
import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";

import * as schemas from "./ad.schemas";

const tags = ["Ad"];

// --------- List Ads ----------
export const list = createRoute({
  tags,
  summary: "List all ads",
  description: "Retrieve a list of all ads",
  path: "/",
  method: "get",
  middleware: [serverAuthMiddleware],

  request: {
    query: schemas.querySchema.extend({
      filterByUser: z
        .string()
        .optional()
        .transform((val) => val === "true")
        .pipe(z.boolean().default(false)),
      includeDeleted: z.string().optional(),
      includeExpired: z.string().optional(),
      status: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.withPaginationSchema,
      "The list of ads"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Invalid parameters"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Something went wrong while fetching ads"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
  },
});

export type ListRoute = typeof list;

// --------- Create Ad ----------
export const create = createRoute({
  tags,
  summary: "Create a new ad",
  description: "Fill all required fields to create a new ad",
  path: "/",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      schemas.createAdSchema,
      "The ad details to create"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      schemas.selectAdSchema,
      "The created ad"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({ message: z.string() }),
      "The validation error(s)"
    ),
  },
});

export type CreateRoute = typeof create;

// --------- Get Single Ad by ID ----------
export const getOne = createRoute({
  tags,
  summary: "Get a single ad by ID",
  description: "Retrieve details of a specific ad using its ID",
  path: "/{id}",
  method: "get",
  request: {
    params: schemas.IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.selectAdSchema,
      "Requested ad by id"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Ad not found"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({ message: z.string() }),
      "Invalid id error"
    ),
  },
});

export type GetOneRoute = typeof getOne;

// --------- Update Task ----------
export const update = createRoute({
  tags,
  summary: "Update an existing ad",
  description: "Update the details of an existing ad using its ID",
  path: "/{id}",
  method: "put",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
    body: jsonContentRequired(
      schemas.updateAdSchema,
      "New ad details to update"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.selectAdSchema, "The updated ad"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContentOneOf(
      [
        createErrorSchema(schemas.updateAdSchema),
        createErrorSchema(schemas.IdParamsSchema),
      ],
      "The validation error(s)"
    ),
  },
});

export type UpdateRoute = typeof update;

// --------- Delete Ad ----------
export const remove = createRoute({
  tags,
  summary: "Delete an ad",
  description: "Delete an ad using its ID",
  path: "/{id}",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
    body: jsonContentRequired(
      schemas.deleteAdBodySchema,
      "Reason for deleting the ad"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Ad deleted successfully"),
      "Ad unpublished successfully"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Ad not found"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(schemas.IdParamsSchema),
      "Invalid Id param"
    ),
  },
});

export type RemoveRoute = typeof remove;

// --------- Permanent Delete Ad (Admin Only) ----------
export const permanentDelete = createRoute({
  tags,
  summary: "Permanently delete an ad",
  description: "Permanently delete an ad from the system (admin only)",
  path: "/{id}/permanent",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Ad permanently deleted successfully"),
      "Ad permanently deleted"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Ad not found"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema("Forbidden"),
      "Admin access required"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(schemas.IdParamsSchema),
      "Invalid Id param"
    ),
  },
});

export type PermanentDeleteRoute = typeof permanentDelete;

// --------- Bulk Permanent Delete Ad (Admin Only) ----------
export const bulkPermanentDelete = createRoute({
  tags,
  summary: "Bulk permanently delete ads",
  description: "Permanently delete multiple ads from the system (admin only)",
  path: "/bulk-permanent-delete",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({
        adIds: z.array(z.string()).min(1, "At least one ad ID is required")
      }),
      "Array of ad IDs to delete"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Ads permanently deleted successfully"),
      "Ads permanently deleted"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      createMessageObjectSchema("Invalid request"),
      "Invalid request"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema("Forbidden"),
      "Admin access required"
    ),
  },
});

export type BulkPermanentDeleteRoute = typeof bulkPermanentDelete;

// --------- Approve Ad ----------
export const approve = createRoute({
  tags,
  summary: "Approve an ad",
  description: "Approve a pending ad (admin only)",
  path: "/{id}/approve",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.selectAdSchema, "The approved ad"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema("Forbidden"),
      "Admin access required"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Ad not found"),
  },
});

export type ApproveRoute = typeof approve;

// --------- Reject Ad ----------
export const reject = createRoute({
  tags,
  summary: "Reject an ad",
  description: "Reject a pending ad (admin only)",
  path: "/{id}/reject",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
    body: jsonContent(
      z.object({
        rejectionDescription: z.string().optional(),
      }),
      "Rejection description"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.selectAdSchema, "The rejected ad"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema("Forbidden"),
      "Admin access required"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Ad not found"),
  },
});

export type RejectRoute = typeof reject;

// --------- Update Boost/Featured Status ----------
export const updatePromotion = createRoute({
  tags,
  summary: "Update ad promotion status",
  description: "Update boost or featured status with expiry (admin only)",
  path: "/{id}/promotion",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
    body: jsonContent(
      z.object({
        promotionType: z.enum(["boost", "featured", "none"]),
        duration: z.enum(["1week", "2weeks", "1month"]).optional(),
      }),
      "Promotion details"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.selectAdSchema, "The updated ad"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema("Forbidden"),
      "Admin access required"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Ad not found"),
  },
});

export type UpdatePromotionRoute = typeof updatePromotion;

// --------- Bulk Create Ads ----------
export const bulkCreate = createRoute({
  tags,
  summary: "Bulk create ads",
  description: "Create multiple ads at once (admin only)",
  path: "/bulk",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      schemas.bulkCreateAdSchema,
      "The list of ads to create"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        count: z.number(),
      }),
      "Ads created successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Admin access required"
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      z.object({ message: z.string() }),
      "Validation or processing error"
    ),
  },
});


export type BulkCreateRoute = typeof bulkCreate;


// --------- Increment View Count ----------
export const incrementView = createRoute({
  tags,
  summary: "Increment ad view count",
  description: "Increment the view count for a specific ad",
  path: "/{id}/view",
  method: "post",
  request: {
    params: schemas.IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        views: z.number(),
      }),
      "View count incremented"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Ad not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(schemas.IdParamsSchema),
      "Invalid Id param"
    ),
  },
});

export type IncrementViewRoute = typeof incrementView;

// --------- Get Trending Ads ----------
export const trending = createRoute({
  tags,
  summary: "Get trending ads",
  description: "Retrieve trending ads ordered by view count",
  path: "/trending",
  method: "get",
  request: {
    query: z.object({
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10))
        .pipe(z.number().min(1).max(50).default(10)),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(schemas.adSchema),
      "The trending ads"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Invalid parameters"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Something went wrong while fetching trending ads"
    ),
  },
});

export type TrendingRoute = typeof trending;


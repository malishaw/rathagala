import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { createMessageObjectSchema } from "stoker/openapi/schemas";
import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import * as schemas from "./boost.schemas";

const tags = ["Boost"];

// --------- Get Boost Pricing ----------
export const getPricing = createRoute({
  tags,
  summary: "Get boost pricing",
  path: "/pricing",
  method: "get",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(schemas.boostPricingSchema),
      "Boost pricing list"
    ),
  },
});
export type GetPricingRoute = typeof getPricing;

// --------- Update Boost Pricing (Admin) ----------
export const updatePricing = createRoute({
  tags,
  summary: "Update boost pricing (admin)",
  path: "/pricing",
  method: "put",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(schemas.updateBoostPricingSchema, "Pricing updates"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Pricing updated"),
      "Pricing updated"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
  },
});
export type UpdatePricingRoute = typeof updatePricing;

// --------- Request Boost ----------
export const requestBoost = createRoute({
  tags,
  summary: "Request a boost for an ad",
  path: "/request",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(schemas.createBoostRequestSchema, "Boost request"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({ message: z.string(), boostRequestId: z.string(), totalAmount: z.number() }),
      "Boost requested"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Bad request"
    ),
  },
});
export type RequestBoostRoute = typeof requestBoost;

// --------- Approve Boost (Admin) ----------
export const approveBoost = createRoute({
  tags,
  summary: "Approve a boost request (admin)",
  path: "/approve",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(schemas.approveBoostSchema, "Approve boost"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Boost approved"),
      "Boost approved"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Boost request not found"
    ),
  },
});
export type ApproveBoostRoute = typeof approveBoost;

// --------- Get Boost Requests (Admin) ----------
export const getBoostRequests = createRoute({
  tags,
  summary: "Get all boost requests (admin)",
  path: "/requests",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    query: z.object({
      status: z.string().optional(),
      page: z.string().optional().default("1"),
      limit: z.string().optional().default("20"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        boostRequests: z.array(z.any()),
        pagination: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      }),
      "Boost requests"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
  },
});
export type GetBoostRequestsRoute = typeof getBoostRequests;

// --------- Get Boost Request for an Ad ----------
export const getAdBoostRequest = createRoute({
  tags,
  summary: "Get boost request for a specific ad",
  path: "/ad/:adId",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ adId: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ boostRequest: z.any().nullable() }),
      "Ad boost request"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
  },
});
export type GetAdBoostRequestRoute = typeof getAdBoostRequest;

// --------- Admin Promote Ad (Admin) ----------
export const adminPromote = createRoute({
  tags,
  summary: "Admin directly promote an ad (no user boost request needed)",
  path: "/admin-promote",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(schemas.adminPromoteSchema, "Admin promote"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema("Ad promoted"),
      "Ad promoted"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Ad not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Bad request"
    ),
  },
});
export type AdminPromoteRoute = typeof adminPromote;

// --------- Get Revenue Stats (Admin) ----------
export const getRevenue = createRoute({
  tags,
  summary: "Get revenue statistics (admin)",
  path: "/revenue",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    query: schemas.revenueFilterSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        totalRevenue: z.number(),
        bumpRevenue: z.number(),
        topAdRevenue: z.number(),
        urgentRevenue: z.number(),
        featuredRevenue: z.number(),
        bumpCount: z.number(),
        topAdCount: z.number(),
        urgentCount: z.number(),
        featuredCount: z.number(),
        totalBoostedCount: z.number(),
        activeBumpCount: z.number(),
        activeTopAdCount: z.number(),
        activeUrgentCount: z.number(),
        activeFeaturedCount: z.number(),
        records: z.array(z.any()),
      }),
      "Revenue stats"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
  },
});
export type GetRevenueRoute = typeof getRevenue;

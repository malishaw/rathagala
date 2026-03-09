import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import * as schemas from "./vehicle-model.schemas";

const tags = ["VehicleModel"];

// ---------- List (public) ----------
export const list = createRoute({
  tags,
  summary: "List all vehicle models",
  path: "/",
  method: "get",
  request: {
    query: schemas.querySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.withPaginationSchema,
      "The list of vehicle models"
    ),
  },
});

export type ListRoute = typeof list;

// ---------- Get One ----------
export const getOne = createRoute({
  tags,
  summary: "Get a single vehicle model",
  path: "/:id",
  method: "get",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.vehicleModelSchema, "The vehicle model"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Vehicle model not found"
    ),
  },
});

export type GetOneRoute = typeof getOne;

// ---------- Create (admin only) ----------
export const create = createRoute({
  tags,
  summary: "Create a vehicle model",
  path: "/",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(schemas.createVehicleModelSchema, "Vehicle model data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(schemas.vehicleModelSchema, "Vehicle model created"),
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
      "Vehicle model already exists"
    ),
  },
});

export type CreateRoute = typeof create;

// ---------- Update (admin only) ----------
export const update = createRoute({
  tags,
  summary: "Update a vehicle model",
  path: "/:id",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
    body: jsonContentRequired(schemas.updateVehicleModelSchema, "Updated vehicle model data"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.vehicleModelSchema, "Vehicle model updated"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Vehicle model not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});

export type UpdateRoute = typeof update;

// ---------- Remove (admin only) ----------
export const remove = createRoute({
  tags,
  summary: "Delete a vehicle model",
  path: "/:id",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "Vehicle model deleted" },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Vehicle model not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});

export type RemoveRoute = typeof remove;

// ---------- Clear User-Added Model (admin only) ----------
export const clearUserModel = createRoute({
  tags,
  summary: "Clear a user-added model from all ads",
  path: "/clear-user-model",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({ modelName: z.string() }),
      "Model name to clear"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "User-added model cleared"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});

export type ClearUserModelRoute = typeof clearUserModel;

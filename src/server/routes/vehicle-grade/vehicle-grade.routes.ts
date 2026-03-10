import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import * as schemas from "./vehicle-grade.schemas";

const tags = ["VehicleGrade"];

// ---------- List (public) ----------
export const list = createRoute({
  tags,
  summary: "List all vehicle grades",
  path: "/",
  method: "get",
  request: {
    query: schemas.querySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.withPaginationSchema,
      "The list of vehicle grades"
    ),
  },
});

export type ListRoute = typeof list;

// ---------- Get One ----------
export const getOne = createRoute({
  tags,
  summary: "Get a single vehicle grade",
  path: "/:id",
  method: "get",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.vehicleGradeSchema, "The vehicle grade"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Vehicle grade not found"
    ),
  },
});

export type GetOneRoute = typeof getOne;

// ---------- Create (admin only) ----------
export const create = createRoute({
  tags,
  summary: "Create a vehicle grade",
  path: "/",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(schemas.createVehicleGradeSchema, "Vehicle grade data"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(schemas.vehicleGradeSchema, "Vehicle grade created"),
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
      "Vehicle grade already exists"
    ),
  },
});

export type CreateRoute = typeof create;

// ---------- Update (admin only) ----------
export const update = createRoute({
  tags,
  summary: "Update a vehicle grade",
  path: "/:id",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
    body: jsonContentRequired(schemas.updateVehicleGradeSchema, "Updated vehicle grade data"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.vehicleGradeSchema, "Vehicle grade updated"),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Vehicle grade not found"
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
  summary: "Delete a vehicle grade",
  path: "/:id",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: { description: "Vehicle grade deleted" },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Vehicle grade not found"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});

export type RemoveRoute = typeof remove;

// ---------- Clear User-Added Grade (admin only) ----------
export const clearUserGrade = createRoute({
  tags,
  summary: "Clear a user-added grade from all ads",
  path: "/clear-user-grade",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      z.object({ gradeName: z.string() }),
      "Grade name to clear"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "User-added grade cleared"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden - Admin only"
    ),
  },
});

export type ClearUserGradeRoute = typeof clearUserGrade;

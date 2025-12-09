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

import * as schemas from "./report.schemas";

const tags = ["Report"];

// --------- List Reports ----------
export const list = createRoute({
  tags,
  summary: "List all reports",
  description: "Retrieve a list of all reports (admin only)",
  path: "/",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    query: schemas.querySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.withPaginationSchema,
      "The list of reports"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Something went wrong while fetching reports"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Admin access required"
    ),
  },
});

export type ListRoute = typeof list;

// --------- Create Report ----------
export const create = createRoute({
  tags,
  summary: "Create a new report",
  description: "Report an ad for inappropriate content or violations",
  path: "/",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      schemas.createReportSchema,
      "The report details to create"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      schemas.selectReportSchema,
      "The created report"
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

// --------- Get Single Report by ID ----------
export const getOne = createRoute({
  tags,
  summary: "Get a single report by ID",
  description: "Retrieve details of a specific report using its ID (admin only)",
  path: "/{id}",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.selectReportSchema,
      "Requested report by id"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Report not found"
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
      "Invalid id error"
    ),
  },
});

export type GetOneRoute = typeof getOne;

// --------- Update Report ----------
export const update = createRoute({
  tags,
  summary: "Update a report",
  description: "Update the status or details of a report (admin only)",
  path: "/{id}",
  method: "put",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
    body: jsonContentRequired(
      schemas.updateReportSchema,
      "New report details to update"
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(schemas.selectReportSchema, "The updated report"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema("Unauthorized"),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema("Forbidden"),
      "Admin access required"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Report not found"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContentOneOf(
      [
        createErrorSchema(schemas.updateReportSchema),
        createErrorSchema(schemas.IdParamsSchema),
      ],
      "The validation error(s)"
    ),
  },
});

export type UpdateRoute = typeof update;

// --------- Delete Report ----------
export const remove = createRoute({
  tags,
  summary: "Delete a report",
  description: "Delete a report using its ID (admin only)",
  path: "/{id}",
  method: "delete",
  middleware: [serverAuthMiddleware],
  request: {
    params: schemas.IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: "Report deleted successfully",
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Report not found"),
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

export type RemoveRoute = typeof remove;

// --------- Get Reports by Ad ID ----------
export const getByAdId = createRoute({
  tags,
  summary: "Get reports for a specific ad",
  description: "Retrieve all reports for a specific ad (admin only)",
  path: "/ad/{adId}",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ adId: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(schemas.selectReportSchema),
      "Reports for the ad"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Admin access required"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Something went wrong while fetching reports"
    ),
  },
});

export type GetByAdIdRoute = typeof getByAdId;

// --------- Get User's Reports ----------
export const getUserReports = createRoute({
  tags,
  summary: "Get current user's reports",
  description: "Retrieve all reports created by the currently authenticated user",
  path: "/my-reports",
  method: "get",
  middleware: [serverAuthMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(schemas.selectReportSchema),
      "User's reports"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      "Something went wrong while fetching user reports"
    ),
  },
});

export type GetUserReportsRoute = typeof getUserReports;

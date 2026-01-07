import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { z } from "zod";
import { jsonContent } from "stoker/openapi/helpers";

import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import { querySchema, withPaginationSchema, updateProfileSchema, updateUserByAdminSchema, assignOrganizationSchema, bulkCreateUserSchema } from "./users.schemas";

const tags = ["Users"];

// ---------- List Users ----------
export const list = createRoute({
  tags,
  path: "/",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    query: querySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      withPaginationSchema,
      "The list of users"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
  },
});

export type ListRoute = typeof list;

// ---------- Update User OrganizationId ----------
export const updateOrganizationId = createRoute({
  tags,
  path: "/update-organization-id",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            organizationId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        user: z.object({
          id: z.string(),
          organizationId: z.string().nullable(),
        }),
      }),
      "User organizationId updated successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Bad request"
    ),
  },
});

export type UpdateOrganizationIdRoute = typeof updateOrganizationId;

// ---------- Get Current User with OrganizationId ----------
export const getCurrentUser = createRoute({
  tags,
  path: "/me",
  method: "get",
  middleware: [serverAuthMiddleware],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        phone: z.string().nullable().optional(),
        phoneVerified: z.enum(["verified", "not_verified", "rejected"]).nullable().optional(),
        organizationId: z.string().nullable(),
        organization: z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string().nullable(),
        }).nullable().optional(),
      }),
      "Current user with organization"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
  },
});

export type GetCurrentUserRoute = typeof getCurrentUser;

// ---------- Update User Profile ----------
export const updateProfile = createRoute({
  tags,
  path: "/profile",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateProfileSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          phone: z.string().nullable().optional(),
          whatsappNumber: z.string().nullable().optional(),
          province: z.string().nullable().optional(),
          district: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          location: z.string().nullable().optional(),
        }),
      }),
      "User profile updated successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Bad request"
    ),
  },
});

export type UpdateProfileRoute = typeof updateProfile;

// ---------- Assign Organization To User (Admin) ----------
export const assignOrganizationToUser = createRoute({
  tags,
  path: "/assign-organization",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: assignOrganizationSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          organizationId: z.string().nullable(),
          organization: z.object({
            id: z.string(),
            name: z.string(),
          }).nullable().optional(),
        }),
      }),
      "Organization assigned successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden: Admin access required"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "User not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Bad request"
    ),
  },
});

export type AssignOrganizationToUserRoute = typeof assignOrganizationToUser;

// ---------- Update User By Admin ----------
export const updateUserByAdmin = createRoute({
  tags,
  path: "/{userId}",
  method: "patch",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({
      userId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: updateUserByAdminSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          role: z.string().nullable(),
          phone: z.string().nullable().optional(),
          phoneVerified: z.enum(["verified", "not_verified", "rejected"]).nullable().optional(),
          whatsappNumber: z.string().nullable().optional(),
          province: z.string().nullable().optional(),
          district: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          location: z.string().nullable().optional(),
          emailVerified: z.boolean(),
          banned: z.boolean(),
          createdAt: z.string(),
        }),
      }),
      "User updated successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden: Admin access required"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "User not found"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Bad request"
    ),
  },
});

export type UpdateUserByAdminRoute = typeof updateUserByAdmin;

// ---------- Bulk Create Users ----------
export const bulkCreate = createRoute({
  tags,
  path: "/bulk",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: {
      content: {
        "application/json": {
          schema: bulkCreateUserSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        count: z.number(),
      }),
      "Users created successfully"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      z.object({ message: z.string() }),
      "Forbidden: Admin access required"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Bad request"
    ),
  },
});

export type BulkCreateRoute = typeof bulkCreate;



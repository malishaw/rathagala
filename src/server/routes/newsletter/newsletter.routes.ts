import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import * as schemas from "./newsletter.schemas";

const tags = ["Newsletter"];

// ---------- List Newsletters ----------
export const list = createRoute({
  tags,
  summary: "List all sent newsletters",
  description: "Retrieve a paginated list of sent newsletters (admin only)",
  path: "/",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    query: schemas.querySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.withPaginationSchema,
      "The list of sent newsletters"
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

export type ListRoute = typeof list;

// ---------- Get One Newsletter ----------
export const getOne = createRoute({
  tags,
  summary: "Get a single newsletter by ID",
  description: "Retrieve full details of a sent newsletter (admin only)",
  path: "/:id",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      schemas.newsletterResponseSchema,
      "The newsletter details"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Newsletter not found"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
  },
});

export type GetOneRoute = typeof getOne;

// ---------- Send Newsletter ----------
export const send = createRoute({
  tags,
  summary: "Send a newsletter email",
  description: "Send individual or bulk newsletter emails to users (admin only)",
  path: "/send",
  method: "post",
  middleware: [serverAuthMiddleware],
  request: {
    body: jsonContentRequired(
      schemas.sendNewsletterSchema,
      "The newsletter email details"
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        newsletter: schemas.newsletterResponseSchema,
      }),
      "Newsletter sent successfully"
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      "Invalid input"
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

export type SendRoute = typeof send;

// ---------- Get All Users Emails (for recipient selection) ----------
export const getRecipients = createRoute({
  tags,
  summary: "Get all user emails for newsletter",
  description: "Retrieve all user emails for recipient selection (admin only)",
  path: "/recipients",
  method: "get",
  middleware: [serverAuthMiddleware],
  request: {
    query: z.object({
      search: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        users: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
          })
        ),
      }),
      "List of users with emails"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthorized"
    ),
  },
});

export type GetRecipientsRoute = typeof getRecipients;

import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { z } from "zod";
import { jsonContent } from "stoker/openapi/helpers";

import { serverAuthMiddleware } from "@/server/middlewares/auth-middleware";
import { querySchema, withPaginationSchema, IdParamsSchema } from "./org.schemas";
import { OrganizationSchema } from "@/types/schema-types";

const tags = ["Organizations"];

// ---------- List Organizations ----------
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
      "The list of organizations"
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      "Unauthenticated request"
    ),
  },
});

export type ListRoute = typeof list;

// ---------- Get Organization by ID ----------
export const getById = createRoute({
  tags,
  path: "/{id}",
  method: "get",
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      OrganizationSchema,
      "Organization details"
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      "Organization not found"
    ),
  },
});

export type GetByIdRoute = typeof getById;

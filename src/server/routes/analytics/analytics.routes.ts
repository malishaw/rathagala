import { createRouter } from "@/server/helpers/create-app";
import * as handlers from "./analytics.handlers";
import * as schemas from "./analytics.schemas";

const analyticsRoutes = createRouter()
  .openapi(
    {
      method: "get",
      path: "/summary",
      summary: "Get ad summary report",
      description: "Get total ads, approved ads, pending ads, and draft ads",
      tags: ["Analytics"],
      responses: {
        200: {
          description: "Ad summary",
          content: {
            "application/json": {
              schema: schemas.adSummaryResponseSchema,
            },
          },
        },
      },
    },
    handlers.getAdSummary
  )
  .openapi(
    {
      method: "get",
      path: "/ad-creation",
      summary: "Get ad creation report",
      description: "Get ad creation trends by daily, monthly, or date range",
      tags: ["Analytics"],
      request: {
        query: schemas.dateRangeSchema,
      },
      responses: {
        200: {
          description: "Ad creation report",
          content: {
            "application/json": {
              schema: schemas.adCreationResponseSchema,
            },
          },
        },
      },
    },
    handlers.getAdCreationReport
  )
  .openapi(
    {
      method: "get",
      path: "/ad-deletion",
      summary: "Get ad deletion report",
      description: "Get ad deletion trends by daily, monthly, or date range",
      tags: ["Analytics"],
      request: {
        query: schemas.dateRangeSchema,
      },
      responses: {
        200: {
          description: "Ad deletion report",
          content: {
            "application/json": {
              schema: schemas.adDeletionResponseSchema,
            },
          },
        },
      },
    },
    handlers.getAdDeletionReport
  )
  .openapi(
    {
      method: "get",
      path: "/ad-creation-by-entity",
      summary: "Get ad creation by user and organization",
      description: "Get ad counts by users and organizations",
      tags: ["Analytics"],
      responses: {
        200: {
          description: "Ad creation by entity",
          content: {
            "application/json": {
              schema: schemas.adCreationByEntityResponseSchema,
            },
          },
        },
      },
    },
    handlers.getAdCreationByEntity
  )
  .openapi(
    {
      method: "get",
      path: "/ad-advanced-summary",
      summary: "Get ad advanced summary",
      description: "Get total count and top 10 of various ad attributes",
      tags: ["Analytics"],
      responses: {
        200: {
          description: "Ad advanced summary",
          content: {
            "application/json": {
              schema: schemas.adAdvancedSummaryResponseSchema,
            },
          },
        },
      },
    },
    handlers.getAdAdvancedSummary
  )
  .openapi(
    {
      method: "get",
      path: "/user-summary",
      summary: "Get user summary",
      description: "Get total users, agents, organizations, and top 10 entities",
      tags: ["Analytics"],
      responses: {
        200: {
          description: "User summary",
          content: {
            "application/json": {
              schema: schemas.userSummaryResponseSchema,
            },
          },
        },
      },
    },
    handlers.getUserSummary
  );

export default analyticsRoutes;

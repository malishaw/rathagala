import { db } from "@/server/db";
import { media as mediaSchema } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/types/server";
import { GetOneRoute, ListRoute, RemoveRoute, SaveRoute } from "./media.routes";

// ---- List Media Handler ----
export const list: AppRouteHandler<ListRoute> = async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: HttpStatusPhrases.UNAUTHORIZED },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const media = await db.query.media.findMany({
    where: eq(mediaSchema.uploaderId, user.id),
    orderBy: (media, { desc }) => [desc(media.createdAt)],
  });

  return c.json(media, HttpStatusCodes.OK);
};

// ---- Save Media Handler ----
export const save: AppRouteHandler<SaveRoute> = async (c) => {
  const user = c.get("user");
  const mediaDetails = c.req.valid("json");

  console.log({ mediaDetails });

  if (!user) {
    return c.json(
      { message: HttpStatusPhrases.UNAUTHORIZED },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const [createdMedia] = await db.insert(mediaSchema).values({
    ...mediaDetails,
    uploaderId: user.id,
  }).returning();

  return c.json(createdMedia, HttpStatusCodes.CREATED);
};

// ---- Get single media by id Handler ----
export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const mediaId = c.req.valid("param").id;
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: HttpStatusPhrases.UNAUTHORIZED },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const media = await db.query.media.findFirst({
    where: and(eq(mediaSchema.id, mediaId), eq(mediaSchema.uploaderId, user.id)),
  });

  if (!media) {
    return c.json(
      { message: HttpStatusPhrases.NOT_FOUND },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(media, HttpStatusCodes.OK);
};

// ---- Delete Ad Handler ----
export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const mediaId = c.req.valid("param").id;
  const user = c.get("user");

  if (!user) {
    return c.json(
      { message: HttpStatusPhrases.UNAUTHORIZED },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  const [deletedMedia] = await db.delete(mediaSchema).where(
    and(eq(mediaSchema.id, mediaId), eq(mediaSchema.uploaderId, user.id))
  ).returning();

  return c.json(deletedMedia, HttpStatusCodes.OK);
};

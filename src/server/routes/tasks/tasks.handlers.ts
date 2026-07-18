import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/types/server";
import type {
  ListRoute,
  CreateRoute,
  GetOneRoute,
  UpdateRoute,
  RemoveRoute
} from "./tasks.routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const fetchedTasks = await db.query.tasks.findMany();

  return c.json(fetchedTasks, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const taskData = c.req.valid("json");

  const [createdTask] = await db.insert(tasks).values({
    ...taskData,
  }).returning();

  return c.json(createdTask, HttpStatusCodes.CREATED);
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
  const params = c.req.valid("param");

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, params.id)
  });

  if (!task) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(task, HttpStatusCodes.OK);
};

export const update: AppRouteHandler<UpdateRoute> = async (c) => {
  const params = c.req.valid("param");
  const payload = c.req.valid("json");

  const [updatedTask] = await db.update(tasks).set({
    ...payload,
  })
    .where(eq(tasks.id, params.id))
    .returning();

  if (!updatedTask) {
    return c.json(
      { message: HttpStatusPhrases.NOT_FOUND },
      HttpStatusCodes.NOT_FOUND
    ) as any;
  }

  return c.json(updatedTask, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const params = c.req.valid("param");

  await db.delete(tasks).where(eq(tasks.id, params.id));

  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

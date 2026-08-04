import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import { auth } from "@/lib/auth";

export const serverAuthMiddleware = createMiddleware(async (c, next) => {
  let session = null;

  try {
    session = await auth.api.getSession({ headers: c.req.raw.headers });
  } catch (error) {
    // If the auth session lookup itself throws (e.g. DB connection error in edge
    // runtime), log it and fall through as an unauthenticated request rather
    // than surfacing an unhandled 500 to the client.
    console.error("[serverAuthMiddleware] Failed to retrieve session:", error);
  }

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);

  return next();
});

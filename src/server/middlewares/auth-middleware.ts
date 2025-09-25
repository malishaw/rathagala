import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import { auth } from "@/lib/auth";

export const serverAuthMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    // return c.json(
    //   { message: HttpStatusPhrases.UNAUTHORIZED },
    //   HttpStatusCodes.UNAUTHORIZED
    // );
    c.set("user", null);
    c.set("session", null);
    // Continue the middleware chain as an unauthenticated request.
    // Previously this returned undefined which caused Hono to report
    // "Context is not finalized". Always return next() (or a Response).
    return next();
  }           

  c.set("user", session.user);
  c.set("session", session.session);

  return next();
});

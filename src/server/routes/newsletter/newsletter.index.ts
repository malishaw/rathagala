import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./newsletter.handler";
import * as routes from "./newsletter.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.getRecipients, handlers.getRecipients)
  .openapi(routes.send, handlers.send)
  .openapi(routes.getOne, handlers.getOne);

export default router;

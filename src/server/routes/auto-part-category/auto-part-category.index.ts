import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./auto-part-category.handler";
import * as routes from "./auto-part-category.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.create, handlers.create)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove);

export default router;

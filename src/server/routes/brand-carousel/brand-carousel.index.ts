import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./brand-carousel.handler";
import * as routes from "./brand-carousel.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove);

export default router;

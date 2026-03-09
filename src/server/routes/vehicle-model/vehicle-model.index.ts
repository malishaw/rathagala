import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./vehicle-model.handler";
import * as routes from "./vehicle-model.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.clearUserModel, handlers.clearUserModel)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove);

export default router;

import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./vehicle-grade.handler";
import * as routes from "./vehicle-grade.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.clearUserGrade, handlers.clearUserGrade)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove);

export default router;

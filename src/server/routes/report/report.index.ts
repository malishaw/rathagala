import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./report.handlers";
import * as routes from "./report.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.create, handlers.create)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.getByAdId, handlers.getByAdId)
  .openapi(routes.getUserReports, handlers.getUserReports);

export default router;

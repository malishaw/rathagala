import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./ad.handler";
import * as routes from "./ad.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.trending, handlers.trending)
  .openapi(routes.bulkCreate, handlers.bulkCreate)
  .openapi(routes.bulkPermanentDelete, handlers.bulkPermanentDelete)
  .openapi(routes.sendExpiryReminders, handlers.sendExpiryReminders)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.permanentDelete, handlers.permanentDelete)
  .openapi(routes.approve, handlers.approve)
  .openapi(routes.reject, handlers.reject)
  .openapi(routes.incrementView, handlers.incrementView)
  .openapi(routes.renew, handlers.renew);

export default router;

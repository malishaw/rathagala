import { createRouter } from "@/server/helpers/create-app";
import * as handlers from "./boost.handler";
import * as routes from "./boost.routes";

const router = createRouter()
  .openapi(routes.getPricing, handlers.getPricing)
  .openapi(routes.updatePricing, handlers.updatePricing)
  .openapi(routes.requestBoost, handlers.requestBoost)
  .openapi(routes.approveBoost, handlers.approveBoost)
  .openapi(routes.adminPromote, handlers.adminPromote)
  .openapi(routes.getBoostRequests, handlers.getBoostRequests)
  .openapi(routes.getAdBoostRequest, handlers.getAdBoostRequest)
  .openapi(routes.getRevenue, handlers.getRevenue);

export default router;

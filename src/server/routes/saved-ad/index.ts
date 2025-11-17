import { createRouter } from "@/server/helpers/create-app";
import * as handlers from "./saved-ad.handler";
import * as routes from "./saved-ad.routes";

// Create router and register all routes with their handlers
const savedAdRouter = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.remove, handlers.remove)
  .openapi(routes.check, handlers.check);

export default savedAdRouter;

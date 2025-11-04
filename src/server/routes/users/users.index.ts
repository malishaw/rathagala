import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./users.handlers";
import * as routes from "./users.routes";

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.updateOrganizationId, handlers.updateOrganizationId)
  .openapi(routes.getCurrentUser, handlers.getCurrentUser)
  .openapi(routes.updateProfile, handlers.updateProfile);

export default router;


import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "../users/users.handlers";
import * as routes from "../users/users.routes";

// Create a router for /user (singular) to match frontend expectations
const router = createRouter()
  .openapi(routes.updateProfile, handlers.updateProfile);

export default router;


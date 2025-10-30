import { createRouter } from "@/server/helpers/create-app";

import * as handlers from "./users.handlers";
import * as routes from "./users.routes";

const router = createRouter().openapi(routes.list, handlers.list);

export default router;


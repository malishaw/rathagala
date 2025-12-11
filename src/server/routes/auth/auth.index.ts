import { createRouter } from "@/server/helpers/create-app";
import * as handlers from "./auth.handlers";
import * as routes from "./verification.routes";

const verificationRoute = createRouter()
  .openapi(routes.sendVerificationCode, handlers.sendVerificationCode)
  .openapi(routes.verifyCode, handlers.verifyCode);

export default verificationRoute;

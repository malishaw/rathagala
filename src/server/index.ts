import { configureOpenAPI } from "@/server/helpers/configure-open-api";
import { createApp } from "@/server/helpers/create-app";

// Routes
import adRoute from "@/server/routes/ad/ad.index";
import { authController } from "@/server/routes/auth/auth.routes";
import mediaRoute from "@/server/routes/media/media.index";
import orgRoute from "@/server/routes/orgs/org.index";
import rootRoute from "@/server/routes/root/index.route";
import savedAdRoute from "@/server/routes/saved-ad/index";
import tasksRoute from "@/server/routes/tasks/tasks.index";
import userRoute from "@/server/routes/user/user.index";
import usersRoute from "@/server/routes/users/users.index";
import reportRoute from "@/server/routes/report/report.index";

const app = createApp();

// Configure Open API Documentation
configureOpenAPI(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .route("/", rootRoute)
  .route("/tasks", tasksRoute)

  // Project Routes
  .route("/auth", authController)
  .route("/organizations", orgRoute)
  .route("/ad", adRoute)
  .route("/media", mediaRoute)
  .route("/users", usersRoute)
  .route("/user", userRoute)
  .route("/report", reportRoute)
  .route("/saved-ad", savedAdRoute);

export type AppType = typeof routes;

export default app;

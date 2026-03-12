import { configureOpenAPI } from "@/server/helpers/configure-open-api";
import { createApp } from "@/server/helpers/create-app";

// Routes
import adRoute from "@/server/routes/ad/ad.index";
import { authController } from "@/server/routes/auth/auth.routes";
import verificationRoute from "@/server/routes/auth/auth.index";
import mediaRoute from "@/server/routes/media/media.index";
import orgRoute from "@/server/routes/orgs/org.index";
import rootRoute from "@/server/routes/root/index.route";
import savedAdRoute from "@/server/routes/saved-ad/index";
import tasksRoute from "@/server/routes/tasks/tasks.index";
import userRoute from "@/server/routes/user/user.index";
import usersRoute from "@/server/routes/users/users.index";
import reportRoute from "@/server/routes/report/report.index";
import analyticsRoute from "@/server/routes/analytics/analytics.index";
import newsletterRoute from "@/server/routes/newsletter/newsletter.index";
import autoPartCategoryRoute from "@/server/routes/auto-part-category/auto-part-category.index";
import brandCarouselRoute from "@/server/routes/brand-carousel/brand-carousel.index";
import vehicleModelRoute from "@/server/routes/vehicle-model/vehicle-model.index";
import vehicleGradeRoute from "@/server/routes/vehicle-grade/vehicle-grade.index";
import boostRoute from "@/server/routes/boost/boost.index";

const app = createApp();

// Configure Open API Documentation
configureOpenAPI(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .route("/", rootRoute)
  .route("/tasks", tasksRoute)

  // Project Routes
  .route("/verification", verificationRoute)
  .route("/auth", authController)
  .route("/organizations", orgRoute)
  .route("/ad", adRoute)
  .route("/media", mediaRoute)
  .route("/users", usersRoute)
  .route("/user", userRoute)
  .route("/report", reportRoute)
  .route("/saved-ad", savedAdRoute)
  .route("/analytics", analyticsRoute)
  .route("/newsletter", newsletterRoute)
  .route("/auto-part-category", autoPartCategoryRoute)
  .route("/brand-carousel", brandCarouselRoute)
  .route("/vehicle-model", vehicleModelRoute)
  .route("/vehicle-grade", vehicleGradeRoute)
  .route("/boost", boostRoute);

export type AppType = typeof routes;

export default app;

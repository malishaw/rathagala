import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  functions: {
    dashboard: {
      routes: [
        "app/dashboard/report/page",
        "app/dashboard/backup/page",
        "app/dashboard/ads-manage/page",
        "app/dashboard/ads/page",
        "app/dashboard/organizations/page",
        "app/sell/new/page",
        "app/edit-ad/[id]/page",
      ],
      patterns: [
        "/dashboard/*",
        "/sell/*",
        "/edit-ad/*",
      ],
    },
  },
});
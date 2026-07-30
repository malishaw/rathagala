import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  functions: {
    dashboard: {
      routes: [
        "app/(frontend)/dashboard/report/page",
        "app/(frontend)/dashboard/backup/page",
        "app/(frontend)/dashboard/ads-manage/page",
        "app/(frontend)/dashboard/ads/page",
        "app/(frontend)/dashboard/organizations/page",
        "app/(frontend)/(landing)/sell/new/page",
        "app/(frontend)/edit-ad/[id]/page",
      ],
      patterns: [
        "/dashboard/*",
        "/sell/*",
        "/edit-ad/*",
      ],
      override: {
        wrapper: "cloudflare-node",
        converter: "edge",
        proxyExternalRequest: "fetch",
      },
    },
  },
});
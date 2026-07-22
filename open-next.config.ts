import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();
config.default.minify = true;

config.functions = {
  api: {
    routes: [
      "app/api/[...route]/route",
      "app/api/auth/[...all]/route",
      "app/api/check-ad-notifications/route",
      "app/api/locations/route",
      "app/api/manufacture-years/route",
      "app/api/market-price/route",
      "app/api/media/upload/route",
      "app/api/media/delete/route",
      "app/api/plaiceholder/route",
      "app/api/similar-vehicles/route",
      "app/api/watermark/route",
      "app/api/admin/backup/clear/route",
      "app/api/admin/backup/export/route",
      "app/api/admin/backup/import/route",
      "app/api/admin/backup/stats/route",
      "app/api/admin/backup/verify-password/route",
      "app/api/admin/locations/cities/route",
      "app/api/admin/locations/cities/[id]/route",
      "app/api/admin/locations/districts/route",
      "app/api/admin/locations/districts/[id]/route",
      "app/api/admin/locations/provinces/route",
      "app/api/admin/locations/provinces/[id]/route",
      "app/api/admin/locations/seed/route",
      "app/api/admin/manufacture-years/route",
      "app/api/admin/manufacture-years/[id]/route",
      "app/api/admin/manufacture-years/seed/route",
      "app/api/admin/media/route",
      "app/api/admin/media/bulk-delete/route",
      "app/api/admin/media/rename/route",
      "app/api/admin/media/replace/route",
      "app/api/admin/users/delete/route",
    ],
    patterns: ["api/*"],
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
  dashboard: {
    routes: [
      "app/(frontend)/dashboard/page",
      "app/(frontend)/dashboard/address/page",
      "app/(frontend)/dashboard/ads/page",
      "app/(frontend)/dashboard/ads/new/page",
      "app/(frontend)/dashboard/ads/[id]/page",
      "app/(frontend)/dashboard/ads-manage/page",
      "app/(frontend)/dashboard/auto-parts/page",
      "app/(frontend)/dashboard/backup/page",
      "app/(frontend)/dashboard/carousel/page",
      "app/(frontend)/dashboard/deleted-ads/page",
      "app/(frontend)/dashboard/expired-ads/page",
      "app/(frontend)/dashboard/grades/page",
      "app/(frontend)/dashboard/manufacture-years/page",
      "app/(frontend)/dashboard/media/page",
      "app/(frontend)/dashboard/models/page",
      "app/(frontend)/dashboard/newsletter/page",
      "app/(frontend)/dashboard/organizations/page",
      "app/(frontend)/dashboard/organizations/[id]/page",
      "app/(frontend)/dashboard/promotion/page",
      "app/(frontend)/dashboard/report/page",
      "app/(frontend)/dashboard/reports/page",
      "app/(frontend)/dashboard/revenue/page",
      "app/(frontend)/dashboard/users/page",
    ],
    patterns: ["dashboard/*"],
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
    },
  },
};

export default config;





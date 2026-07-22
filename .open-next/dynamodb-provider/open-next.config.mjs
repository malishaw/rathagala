import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);import bannerUrl from 'url';const __dirname = bannerUrl.fileURLToPath(new URL('.', import.meta.url));

// node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js
var cloudflareContextSymbol = Symbol.for("__cloudflare-context__");
function getCloudflareContext(options = { async: false }) {
  return options.async ? getCloudflareContextAsync() : getCloudflareContextSync();
}
function getCloudflareContextFromGlobalScope() {
  const global = globalThis;
  return global[cloudflareContextSymbol];
}
function inSSG() {
  const global = globalThis;
  return global.__NEXT_DATA__?.nextExport === true;
}
function getCloudflareContextSync() {
  const cloudflareContext = getCloudflareContextFromGlobalScope();
  if (cloudflareContext) {
    return cloudflareContext;
  }
  if (inSSG()) {
    throw new Error(`

ERROR: \`getCloudflareContext\` has been called in sync mode in either a static route or at the top level of a non-static one, both cases are not allowed but can be solved by either:
  - make sure that the call is not at the top level and that the route is not static
  - call \`getCloudflareContext({async: true})\` to use the \`async\` mode
  - avoid calling \`getCloudflareContext\` in the route
`);
  }
  throw new Error(initOpenNextCloudflareForDevErrorMsg);
}
async function getCloudflareContextAsync() {
  const cloudflareContext = getCloudflareContextFromGlobalScope();
  if (cloudflareContext) {
    return cloudflareContext;
  }
  const inNodejsRuntime = process.env.NEXT_RUNTIME === "nodejs";
  if (inNodejsRuntime || inSSG()) {
    const cloudflareContext2 = await getCloudflareContextFromWrangler();
    addCloudflareContextToNodejsGlobal(cloudflareContext2);
    return cloudflareContext2;
  }
  throw new Error(initOpenNextCloudflareForDevErrorMsg);
}
function addCloudflareContextToNodejsGlobal(cloudflareContext) {
  const global = globalThis;
  global[cloudflareContextSymbol] = cloudflareContext;
}
async function getCloudflareContextFromWrangler(options) {
  const { getPlatformProxy } = await import(
    /* webpackIgnore: true */
    `${"__wrangler".replaceAll("_", "")}`
  );
  const environment = options?.environment ?? process.env.NEXT_DEV_WRANGLER_ENV;
  const { env, cf, ctx } = await getPlatformProxy({
    ...options,
    // The `env` passed to the fetch handler does not contain variables from `.env*` files.
    // because we invoke wrangler with `CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV`=`"false"`.
    // Initializing `envFiles` with an empty list is the equivalent for this API call.
    envFiles: [],
    environment
  });
  return {
    env,
    cf,
    ctx
  };
}
var initOpenNextCloudflareForDevErrorMsg = `

ERROR: \`getCloudflareContext\` has been called without having called \`initOpenNextCloudflareForDev\` from the Next.js config file.
You should update your Next.js config file as shown below:

   \`\`\`
   // next.config.mjs

   import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

   initOpenNextCloudflareForDev();

   const nextConfig = { ... };
   export default nextConfig;
   \`\`\`

`;

// node_modules/@opennextjs/cloudflare/dist/api/overrides/asset-resolver/index.js
var resolver = {
  name: "cloudflare-asset-resolver",
  async maybeGetAssetResult(event) {
    const { ASSETS } = getCloudflareContext().env;
    if (!ASSETS || !isUserWorkerFirst(globalThis.__ASSETS_RUN_WORKER_FIRST__, event.rawPath)) {
      return void 0;
    }
    const { method, headers } = event;
    if (method !== "GET" && method != "HEAD") {
      return void 0;
    }
    const url = new URL(event.rawPath, "https://assets.local");
    const response = await ASSETS.fetch(url, {
      headers,
      method
    });
    if (response.status === 404) {
      await response.body?.cancel();
      return void 0;
    }
    return {
      type: "core",
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: getResponseBody(method, response),
      isBase64Encoded: false
    };
  }
};
function getResponseBody(method, response) {
  if (method === "HEAD") {
    return null;
  }
  return response.body || new ReadableStream();
}
function isUserWorkerFirst(runWorkerFirst, pathname) {
  if (!Array.isArray(runWorkerFirst)) {
    return runWorkerFirst ?? false;
  }
  let hasPositiveMatch = false;
  for (let rule of runWorkerFirst) {
    let isPositiveRule = true;
    if (rule.startsWith("!")) {
      rule = rule.slice(1);
      isPositiveRule = false;
    } else if (hasPositiveMatch) {
      continue;
    }
    const match = new RegExp(`^${rule.replace(/([[\]().*+?^$|{}\\])/g, "\\$1").replace("\\*", ".*")}$`).test(pathname);
    if (match) {
      if (isPositiveRule) {
        hasPositiveMatch = true;
      } else {
        return false;
      }
    }
  }
  return hasPositiveMatch;
}
var asset_resolver_default = resolver;

// node_modules/@opennextjs/cloudflare/dist/api/config.js
function defineCloudflareConfig(config2 = {}) {
  const { incrementalCache, tagCache, queue, cachePurge, enableCacheInterception = false, routePreloadingBehavior = "none" } = config2;
  return {
    default: {
      override: {
        wrapper: "cloudflare-node",
        converter: "edge",
        proxyExternalRequest: "fetch",
        incrementalCache: resolveIncrementalCache(incrementalCache),
        tagCache: resolveTagCache(tagCache),
        queue: resolveQueue(queue),
        cdnInvalidation: resolveCdnInvalidation(cachePurge)
      },
      routePreloadingBehavior
    },
    // node:crypto is used to compute cache keys
    edgeExternals: ["node:crypto"],
    cloudflare: {
      useWorkerdCondition: true
    },
    dangerous: {
      enableCacheInterception
    },
    middleware: {
      external: true,
      override: {
        wrapper: "cloudflare-edge",
        converter: "edge",
        proxyExternalRequest: "fetch",
        incrementalCache: resolveIncrementalCache(incrementalCache),
        tagCache: resolveTagCache(tagCache),
        queue: resolveQueue(queue)
      },
      assetResolver: () => asset_resolver_default
    }
  };
}
function resolveIncrementalCache(value = "dummy") {
  if (typeof value === "string") {
    return value;
  }
  return typeof value === "function" ? value : () => value;
}
function resolveTagCache(value = "dummy") {
  if (typeof value === "string") {
    return value;
  }
  return typeof value === "function" ? value : () => value;
}
function resolveQueue(value = "dummy") {
  if (typeof value === "string") {
    return value;
  }
  return typeof value === "function" ? value : () => value;
}
function resolveCdnInvalidation(value = "dummy") {
  if (typeof value === "string") {
    return value;
  }
  return typeof value === "function" ? value : () => value;
}

// open-next.config.ts
var config = defineCloudflareConfig();
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
      "app/api/admin/users/delete/route"
    ],
    patterns: ["api/*"],
    override: {
      wrapper: "cloudflare-node",
      converter: "edge"
    }
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
      "app/(frontend)/dashboard/users/page"
    ],
    patterns: ["dashboard/*"],
    override: {
      wrapper: "cloudflare-node",
      converter: "edge"
    }
  }
};
var open_next_config_default = config;
export {
  open_next_config_default as default
};

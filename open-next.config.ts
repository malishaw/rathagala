import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();
config.default.minify = true;
config.default.override = {
  wrapper: "cloudflare-node",
  converter: "edge",
};

export default config;






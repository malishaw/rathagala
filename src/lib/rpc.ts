import type { AppType } from "@/server";
import { hc } from "hono/client";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "https://rathagala.lk");

export const client = hc<AppType>(appUrl);

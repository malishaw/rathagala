import { logger as honoLogger } from "hono/logger";

// Using Hono's built-in logger instead of pino/hono-pino.
// Pino depends on `thread-stream` which uses `WeakRef` — not available
// in Cloudflare Workers runtime, causing ReferenceError on every request.
export function logger() {
  return honoLogger();
}

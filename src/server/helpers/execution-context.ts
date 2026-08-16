/**
 * Safely invokes c.executionCtx.waitUntil if available without throwing
 * in environments where ExecutionContext is not present (Node.js, Next.js App Router).
 */
export function safeWaitUntil(c: any, promise: Promise<any>): void {
  try {
    if (c && "executionCtx" in c && c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
      c.executionCtx.waitUntil(promise);
      return;
    }
  } catch {
    // c.executionCtx getter throws Error: "This context has no ExecutionContext"
    // in Hono when running outside of Cloudflare Workers. Catch and ignore.
  }
}

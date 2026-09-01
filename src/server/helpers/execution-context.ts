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

/**
 * Ensures background tasks (such as email delivery) complete before serverless/worker
 * isolate termination. If c.executionCtx.waitUntil is available, registers it; otherwise,
 * awaits the promise(s) bounded by timeoutMs (default: 3000ms) to ensure delivery without
 * hanging the HTTP response.
 */
export async function safeBackgroundJob(
  c: any,
  promiseOrPromises: Promise<any> | Promise<any>[],
  timeoutMs = 3000
): Promise<void> {
  const promises = Array.isArray(promiseOrPromises) ? promiseOrPromises : [promiseOrPromises];

  // If Cloudflare ExecutionContext is present, register tasks
  try {
    if (c && "executionCtx" in c && c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
      for (const p of promises) {
        c.executionCtx.waitUntil(p);
      }
      return;
    }
  } catch {
    // In Hono/Next.js App Router, executionCtx may throw. Fall through to bounded await.
  }

  // Fallback for Next.js App Router / Serverless:
  // Await promises with bounded timeout so worker process doesn't kill them in-flight
  try {
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([
      Promise.allSettled(promises),
      timeoutPromise,
    ]);
  } catch (err) {
    console.error("[safeBackgroundJob] Background task error:", err);
  }
}


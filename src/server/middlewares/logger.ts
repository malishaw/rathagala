import pino from "pino";
import { pinoLogger } from "hono-pino";

import { env } from "@/lib/env";

export function logger() {
  return pinoLogger({
    pino: pino({ level: env.LOG_LEVEL || "info" })
  });
}

// https://youtu.be/sNh9PoM9sUE?list=PLTxa3yJw3ixt9b8oT3Yy-uZYtiGIhcIsA&t=1749

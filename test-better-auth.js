const { drizzleAdapter } = require("better-auth/adapters/drizzle");
const { db } = require("./src/server/db/index.js"); // Wait, src/server/db is TS. I'll use ts-node or bun

import { toast } from "sonner";
import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";

import { ac, admin, member, owner } from "./permissions";

// BETTER_AUTH_URL is server-only (no NEXT_PUBLIC_ prefix), so it's undefined in
// the browser. Use NEXT_PUBLIC_APP_URL (exposed to the client) instead, falling
// back to the current origin at runtime to avoid requests hitting localhost:3000.
const authBaseURL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : undefined);

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [
    adminClient(),
    organizationClient({
      ac: ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
  ],
  fetchOptions: {
    onError: (ctx) => {
      toast.error(ctx.error.message);
    },
  },
});

import { AppOpenAPI } from "@/types/server";
import packageJSON from "$/package.json";

export function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: packageJSON.version,
      title: "DONEXT - Web Boilerplate"
    }
  });

  app.get("/reference", (c) => {
    return c.html(`
      <!doctype html>
      <html>
        <head>
          <title>DONEXT API Reference</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <script id="api-reference" data-url="/api/doc"></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>
    `);
  });
}


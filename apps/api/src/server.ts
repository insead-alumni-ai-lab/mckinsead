import "dotenv/config";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { appRouter } from "./routers";

const port = parseInt(process.env.PORT ?? "3001", 10);

const server = createHTTPServer({
  router: appRouter,
  middleware: cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }),
});

server.listen(port);
console.log(`🚀 mckinsead API listening on http://localhost:${port}`);

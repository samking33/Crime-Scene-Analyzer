import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app";

const log = console.log;

(async () => {
  const app = await createApp();
  const server = createServer(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`express server serving on port ${port}`);
  });
})();

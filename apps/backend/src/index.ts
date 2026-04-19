import { app } from "./app.js";
import { env } from "./config/env.js";
import { startSyncRunner } from "./jobs/sync-runner.js";

startSyncRunner();

app.listen(env.PORT, () => {
  console.log(`UniRemind backend listening on http://localhost:${env.PORT}`);
});

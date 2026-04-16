import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`UniRemind backend listening on http://localhost:${env.PORT}`);

  // Start the sync runner if it exists (Phase 4), otherwise fall back to scheduler (Phase 3)
  import("./lib/sync-runner.js")
    .then(({ startSyncRunner }) => {
      startSyncRunner();
    })
    .catch(() => {
      import("./lib/scheduler.js")
        .then(({ startScheduler }) => {
          startScheduler();
        })
        .catch((err) => {
          console.error("No scheduler or sync runner found:", err);
        });
    });
});
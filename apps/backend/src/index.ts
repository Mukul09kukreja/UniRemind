import { app } from "./app.js";
import { env } from "./config/env.js";
import { startScheduler } from "./lib/scheduler.js";

app.listen(env.PORT, () => {
  console.log(`UniRemind backend listening on http://localhost:${env.PORT}`);
  startScheduler();
});
// Legacy entry point: all booking verification now runs in the isolated local test database.
import { spawnSync } from "node:child_process";
const result = spawnSync(process.execPath, ["scripts/run-integration.mjs"], { stdio: "inherit" });
process.exit(result.status ?? 1);

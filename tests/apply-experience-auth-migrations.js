import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Apply the dedicated synthetic Experience Auth migration set before tests.
await applyD1Migrations(env.EXPERIENCE_AUTH_DB, env.TEST_EXPERIENCE_AUTH_MIGRATIONS);

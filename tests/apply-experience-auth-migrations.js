import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// The Workers Vitest pool creates a fresh isolated storage namespace per test file.
// Apply this binding's migrations in the setup file, before tests access its tables.
await applyD1Migrations(env.EXPERIENCE_AUTH_DB, env.EXPERIENCE_AUTH_MIGRATIONS);

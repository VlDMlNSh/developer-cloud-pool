import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const migrations = await readD1Migrations(path.join(root, "migrations"));

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        // All three namespaces are synthetic local D1 databases. No remote proxy
        // connection string or Cloudflare account resource is configured.
        d1Databases: {
          POOL_DB: "00000000-0000-0000-0000-000000000000",
          UPGRADE_DB: "11111111-1111-4111-8111-111111111111",
          REPLAY_DB: "22222222-2222-4222-8222-222222222222"
        },
        bindings: { UPGRADE_MIGRATIONS: migrations }
      }
    })
  ],
  test: {
    include: ["test/d1-upgrade-binding.smoke.ts", "test/d1-upgrade-fixture.smoke.ts"],
    testTimeout: 15000,
    hookTimeout: 15000
  }
});

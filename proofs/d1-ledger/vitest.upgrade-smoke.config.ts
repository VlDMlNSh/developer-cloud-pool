import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        // Both namespaces are synthetic local D1 databases. No remote proxy
        // connection string or Cloudflare account resource is configured.
        d1Databases: {
          POOL_DB: "00000000-0000-0000-0000-000000000000",
          UPGRADE_DB: "11111111-1111-4111-8111-111111111111"
        }
      }
    })
  ],
  test: {
    include: ["test/d1-upgrade-binding.smoke.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000
  }
});

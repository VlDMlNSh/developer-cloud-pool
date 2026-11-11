import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

const experienceAuthMigrations = await readD1Migrations("./experience-auth-migrations");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.proof.jsonc" },
      miniflare: {
        bindings: {
          TEST_EXPERIENCE_AUTH_MIGRATIONS: experienceAuthMigrations
        }
      }
    })
  ],
  test: {
    include: ["tests/*.vitest.js"],
    testTimeout: 30000
  }
});

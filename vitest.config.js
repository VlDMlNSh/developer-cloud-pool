import path from "node:path";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";

const experienceAuthMigrations = await readD1Migrations(
  path.join(process.cwd(), "experience-auth-migrations")
);

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
    setupFiles: ["./tests/apply-experience-auth-migrations.js"],
    include: ["tests/*.vitest.js"],
    testTimeout: 30000
  }
});

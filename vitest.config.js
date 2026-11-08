import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-plugin";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.proof.jsonc" }
    })
  ],
  test: {
    include: ["tests/*.vitest.js"],
    testTimeout: 30000
  }
});

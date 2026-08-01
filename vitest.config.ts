import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

export default defineConfig({
  // Mirrors tsconfig.json's "@/*" -> "./*" path mapping (Next.js's bundler
  // resolves this itself; vitest needs it spelled out explicitly).
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**"],
  },
})

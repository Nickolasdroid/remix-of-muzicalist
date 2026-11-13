import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "supabase/functions/_shared/**/*.{test,spec}.ts",
    ],
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // edge functions import nodemailer through Deno's npm: scheme
      { find: /^npm:nodemailer.*$/, replacement: path.resolve(__dirname, "./src/test/nodemailerStub.ts") },
    ],
  },
});

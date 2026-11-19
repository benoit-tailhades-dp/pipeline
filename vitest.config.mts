import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

const presentation = ["src/app/**", "src/components/**"];

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: [...configDefaults.exclude, ...presentation],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: presentation.map((dir) => `${dir}/*.test.{ts,tsx}`),
          setupFiles: ["./vitest.setup.dom.ts"],
        },
      },
    ],
  },
});

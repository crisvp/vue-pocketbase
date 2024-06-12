/** @type {import('vite').UserConfig} */

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      dts({
        include: "src/**/*.ts",
        outDir: "dist",

        rollupTypes: true,
        insertTypesEntry: true,
        staticImport: true,
      }),
    ],
    build: {
      emptyOutDir: false,
      lib: {
        entry: "src/index.ts",
        name: "Vue Pocketbase",
        formats: ["es", "cjs", "umd"],
      },
      output: {
        globals: {
          vue: "vue",
        },
      },
      sourcemap: true,
      minify: mode === "production",
    },
    resolve: {
      alias: {
        "@": import.meta.dirname + "/src",
      },
    },
    test: {
      typecheck: {
        tsconfig: "tsconfig.test.json",
      },
      testFiles: ["**/*.test.ts"],
      transform: {
        "^.+\\.ts$": "ts-jest",
      },
    },
  };
});

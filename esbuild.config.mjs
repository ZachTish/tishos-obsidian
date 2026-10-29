import { build } from "esbuild";

export const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  platform: "browser",
  target: "es2018",
  outfile: "main.js",
  sourcemap: false,
  logLevel: "info",
};

await build(buildOptions);

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

test("load/unload only reads plugin settings and registers the command and settings tab", async () => {
  const result = await build({
    entryPoints: ["src/main.ts"], bundle: true, write: false,
    external: ["obsidian"], format: "cjs", platform: "browser",
    target: "es2018", metafile: true,
  });
  const unexpected = (operation) => { throw new Error(`Unexpected foundation work: ${operation}`); };
  const guarded = new Proxy({}, { get: (_, key) => unexpected(String(key)) });
  class HostPlugin {
    constructor(app, manifest) { this.app = app; this.manifest = manifest; }
    async loadData() { counts.loads++; return null; }
    addCommand(command) { counts.commands++; assert.equal(command.id, "open-app"); }
    addSettingTab() { counts.tabs++; }
    onunload() {}
  }
  const counts = { loads: 0, commands: 0, tabs: 0 };
  class HostSettingsTab {}
  // Vault access, event registrations, writes, timers and launches are forbidden on load.
  Object.setPrototypeOf(HostPlugin.prototype, guarded);
  const module = { exports: {} };
  runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports,
    require(id) { assert.equal(id, "obsidian"); return { Plugin: HostPlugin, PluginSettingTab: HostSettingsTab }; },
    window: guarded, document: guarded,
    fetch: () => unexpected("fetch"),
    setTimeout: () => unexpected("setTimeout"),
    setInterval: () => unexpected("setInterval"),
    requestAnimationFrame: () => unexpected("requestAnimationFrame"),
  }, { timeout: 1000 });
  for (let cycle = 0; cycle < 3; cycle++) {
    const instance = new module.exports.default(guarded, { id: "tishos" });
    assert.ok(instance instanceof HostPlugin);
    await instance.onload();
    await instance.onunload();
  }
  const external = Object.values(result.metafile.outputs).flatMap(output => output.imports);
  assert.deepEqual([...new Set(external.map(item => item.path))], ["obsidian"]);
  assert.deepEqual(counts, { loads: 3, commands: 3, tabs: 3 });
});

test("release metadata agrees and adds no runtime dependencies", async () => {
  const json = async (path) => JSON.parse(await readFile(path, "utf8"));
  const [manifest, pkg, lock, versions] = await Promise.all([
    json("manifest.json"), json("package.json"), json("package-lock.json"), json("versions.json"),
  ]);
  assert.equal(manifest.id, "tishos");
  assert.equal(manifest.name, "TishOs");
  assert.equal(manifest.isDesktopOnly, false);
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.version, lock.version);
  assert.equal(manifest.version, lock.packages[""].version);
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.equal(pkg.private, true);
  assert.deepEqual(pkg.dependencies ?? {}, {});
});

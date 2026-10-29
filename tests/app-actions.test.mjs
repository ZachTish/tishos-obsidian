import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

const bundled = await build({
  entryPoints: ["src/main.ts", "src/app-actions.ts"], outdir: "unused",
  bundle: true, write: false, external: ["obsidian"], format: "cjs",
  platform: "browser", target: "es2018",
});

function host({ saved = null, failSave = false, failOpen = false } = {}) {
  const notices = [], opened = [], writes = [], commands = [], tabs = [], controls = [];
  const unexpected = () => { throw new Error("Unexpected background or vault work"); };
  const app = new Proxy({}, { get: unexpected });
  class Plugin {
    constructor(app) { this.app = app; }
    async loadData() { return saved; }
    addCommand(command) { commands.push(command); }
    addSettingTab(tab) { tabs.push(tab); }
    async saveData(value) {
      if (failSave) throw new Error("Disk failure");
      writes.push(value);
    }
  }
  class PluginSettingTab {
    containerEl = { empty() { controls.length = 0; } };
  }
  class Setting {
    constructor() { controls.push(this); }
    setName(name) { this.name = name; return this; }
    setDesc(desc) { this.desc = desc; return this; }
    addText(cb) {
      const text = this.text = {
        inputEl: { setAttribute(name, value) { text[name] = value; } },
        setPlaceholder() { return this; },
        setValue(value) { this.value = value; return this; },
        onChange(cb) { this.change = cb; return this; },
      };
      cb(text); return this;
    }
    addButton(cb) {
      this.button = {
        setButtonText(value) { this.label = value; return this; },
        onClick(cb) { this.click = cb; return this; },
      };
      cb(this.button); return this;
    }
  }
  const require = id => {
    assert.equal(id, "obsidian");
    return { Plugin, PluginSettingTab, Setting, Notice: class { constructor(message) { notices.push(message); } } };
  };
  function load(file) {
    const module = { exports: {} };
    runInNewContext(bundled.outputFiles.find(f => f.path.endsWith(file)).text, {
      module, exports: module.exports, require, URL,
      window: { open(url) { if (failOpen) throw new Error("Unavailable"); opened.push(url); return null; } },
      fetch: unexpected, setTimeout: unexpected, setInterval: unexpected,
    });
    return module.exports;
  }
  return { app, load, notices, opened, writes, commands, tabs, controls };
}

test("valid native and HTTPS links preserve exact encoded parameters", () => {
  const h = host();
  const { validateAppLink, openAppLink } = h.load("app-actions.js");
  for (const link of ["tishos://", "tishos://food/scan?name=A%20%26%20B&return=obsidian%3A%2F%2Fopen", "https://example.com/app?action=scan"]) {
    assert.equal(validateAppLink(` ${link} `), link);
    openAppLink(link);
  }
  assert.equal(h.opened.length, 3);
  assert.deepEqual(h.notices, [], "null window.open result must not imply failure");
});

test("missing, malformed, executable, file and credential-bearing links never launch", () => {
  const h = host();
  const { openAppLink } = h.load("app-actions.js");
  for (const input of ["", "  ", "not a url", "tishos://food scan", "https://", "http://example.com", "javascript://alert(1)", "data://text", "file:///tmp/a", "blob://abc", "about://blank", "vbscript://x", "https://user:pass@example.com", "tishos://user:pass@action"]) {
    openAppLink(input);
  }
  assert.equal(h.opened.length, 0);
  assert.equal(h.notices.length, 14);
});

test("synchronous launch errors show a useful message without exposing the URL", () => {
  const h = host({ failOpen: true });
  h.load("app-actions.js").openAppLink("tishos://action?private=test");
  assert.match(h.notices[0], /Could not open/);
  assert.ok(!h.notices[0].includes("private"));
});

test("action IDs are unique and no unimplemented action links ship", () => {
  const { APP_ACTIONS } = host().load("app-actions.js");
  assert.equal(new Set(APP_ACTIONS.map(a => a.id)).size, APP_ACTIONS.length);
  assert.deepEqual(Array.from(APP_ACTIONS, a => a.id), ["open-app"]);
  assert.equal(APP_ACTIONS[0].link, undefined);
});

test("command uses current saved settings, never an unsaved draft", async () => {
  const h = host({ saved: { appLink: "tishos://old", futureSetting: 42 } });
  const p = new (h.load("main.js").default)(h.app);
  await p.onload();
  h.tabs[0].display();
  assert.equal(h.controls[0].text["aria-label"], "TishOS app link");
  h.controls[0].text.change(" tishos://new?value=one%20two ");
  h.commands[0].callback();
  assert.deepEqual(h.opened, ["tishos://old"]);
  await h.controls[0].button.click();
  assert.equal(h.writes[0].futureSetting, 42);
  assert.equal(p.settings.appLink, "tishos://new?value=one%20two");
  h.commands[0].callback();
  assert.equal(h.opened[1], p.settings.appLink);
});

test("missing configuration is inert and rejected edits do not change saved settings", async () => {
  const h = host();
  const p = new (h.load("main.js").default)(h.app);
  await p.onload();
  h.commands[0].callback();
  assert.match(h.notices[0], /settings first/);
  h.tabs[0].display();
  h.controls[0].text.change("javascript://bad");
  await h.controls[0].button.click();
  assert.equal(p.settings.appLink, "");
  assert.equal(h.writes.length, 0);
  assert.equal(h.opened.length, 0);
});

test("saving an empty link clears it without launching anything", async () => {
  const h = host({ saved: { appLink: "tishos://" } });
  const p = new (h.load("main.js").default)(h.app);
  await p.onload();
  h.tabs[0].display();
  h.controls[0].text.change(" ");
  await h.controls[0].button.click();
  assert.equal(p.settings.appLink, "");
  assert.equal(h.opened.length, 0);
});

test("failed saves preserve the last working command target", async () => {
  const h = host({ saved: { appLink: "tishos://old" }, failSave: true });
  const p = new (h.load("main.js").default)(h.app);
  await p.onload();
  h.tabs[0].display();
  h.controls[0].text.change("tishos://new");
  await h.controls[0].button.click();
  h.commands[0].callback();
  assert.deepEqual(h.opened, ["tishos://old"]);
  assert.match(h.notices[0], /Could not save/);
});

test("bad persisted configuration does not break plugin startup", async () => {
  for (const saved of [null, false, "bad", [], { appLink: 42 }]) {
    const h = host({ saved });
    const p = new (h.load("main.js").default)(h.app);
    await p.onload();
    assert.equal(p.settings.appLink, "");
    assert.equal(h.commands.length, 1);
    assert.equal(h.opened.length, 0);
    assert.equal(h.writes.length, 0);
  }
});

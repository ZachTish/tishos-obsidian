# TishOs

A fresh Obsidian plugin for features Zach explicitly chooses to keep. Version 0.1.0 is an empty, loadable foundation.

## Current behavior

Enabling or disabling TishOs adds no commands, settings, views, styles, event listeners, timers, indexes, network requests, or note writes. It stores no data and has no runtime dependencies beyond Obsidian. Existing TPS plugins remain independent; nothing is migrated or disabled automatically.

`src/main.ts` is the entire runtime. It uses the ordinary Obsidian plugin lifecycle. The manifest permits desktop and mobile; physical iPhone/iPad validation has not been performed.

## Adding a chosen feature

1. Agree on the specific user action and result before migrating anything.
2. Implement that behavior in a small, plainly named module when it needs one. Keep `main.ts` as the entry point.
3. Use Obsidian's native behavior where it suffices. Do not carry over a legacy plugin's settings, services, dependencies, or compatibility layers just to reuse one command.
4. Add only the configuration and persistent data that the accepted feature needs. There is no feature registry, shared service container, or settings framework to maintain in advance.
5. Test the behavior and its lifecycle. Event-driven features must also prove that unrelated edits and sync bursts do not cause broad scans, reads, writes, or repeated rendering. Clean up registrations through Obsidian's lifecycle APIs.

Dependencies and shared abstractions need an actual use, not a planned one. The initial inactivity regression should evolve deliberately as features are accepted.

## Installation

Add `ZachTish/tishos-obsidian` in BRAT and select release `0.1.0`. The plugin appears as **TishOs**. This initial release intentionally has no commands or settings page.

Release assets are `main.js` and `manifest.json`. Existing TPS plugins stay installed independently; adding TishOs does not replace them.

## Development

Source lives outside the vault. Follow the parent workspace's source map and release checklist.

From `Plugin Development`, prepare only this plugin's isolated dependency cache:

```sh
node prepare-dependencies.mjs tishos
```

Then, from this folder:

```sh
npm test
npm run build
```

Tests compile into memory; the separate build writes only `main.js` here. Neither deploys, reloads, watches files, or changes a vault. All npm dependencies are development tools/types; Obsidian supplies the runtime API. `private: true` prevents accidental npm publication.

Explicit test installation, from `Plugin Development`:

```sh
node deploy-runtime.mjs --target test tishos
```

Only `main.js` and `manifest.json` ship. CSS is unnecessary until there is a visible feature. Minimum Obsidian version is 1.0.0; the foundation uses only the longstanding `Plugin` base class.

The shell test uses a guarded fake Obsidian host to detect unexpected API access, imports, timers, or network work during construction/load/unload. It does not substitute for loading the final bundle in Obsidian. Version-specific installed checks and artifact hashes belong in release notes.

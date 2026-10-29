# TishOs

A small Obsidian plugin for features Zach explicitly chooses to keep. Version 0.2.0 adds a command scaffold for opening the native TishOS app through links it supports.

## Current behavior

The command **TishOs: Open TishOS app** opens the link saved under **Settings → TishOs → App link**. Paste a link supported by the native app and press **Save**. The default is blank; invoking the command before configuration explains where to set it. Saving never launches the app. Clearing and saving the field disables the launch until another link is configured.

Native app links (`scheme://…`) and HTTPS universal links are supported. Executable/file URLs, HTTP URLs, malformed links and embedded URL credentials are rejected. Links and encoded query parameters are passed through unchanged. HTTPS links may open a browser if the device does not associate them with an installed app. The operating system may prompt before switching apps. This plugin cannot confirm delivery or completion of a native action; a missing app or unsupported route may fail outside Obsidian.

The native app owns its URL scheme, supported actions, parameter validation and any return to Obsidian. This release does not assume a TishOS route exists, implement a scanner, or add native app handlers. Physical iPhone/iPad app handoff has not been validated.

Startup reads this plugin's settings once and registers one command and one settings tab. There are no vault scans, file/editor listeners, timers, indexes, network requests, note reads/writes, custom views or styles. Only an explicit Save writes plugin settings. Existing TPS plugins remain independent; nothing is migrated or disabled automatically.

## Adding an app command

`src/app-actions.ts` contains the short `APP_ACTIONS` list. After the native app supports a route, add a stable command ID, a user-facing name and its exact link. For example, **if** the native app implements this hypothetical route:

```ts
{ id: "scan-food", name: "Scan food barcode", link: "tishos://food/scan" }
```

The entry point registers each entry with Obsidian and the shared launcher validates and opens its link. Omitting `link` uses the saved App link. Use URL/URLSearchParams to encode any future action parameters; do not concatenate unescaped note text into a link. Context-dependent actions should get a small explicit callback when needed, not a background service.

There is no action router, callback protocol, retry mechanism or feature dependency container to keep synchronized with the native app. Adding a command requires the normal source/test/build/release process. Do not add speculative command entries for routes the app does not yet support.

## Settings

One flat page contains **App link** and **Save**; no navigation hub or disclosures are needed. The input has an accessible label and uses Obsidian's native responsive settings layout, including on mobile. Persisted state is only `appLink`, default `""`. Draft input is transient until saved. Unrecognized saved keys are preserved. Opening settings or loading/unloading the plugin does not write data. Future controls should stay on this page while the workflow remains small.

## Adding a chosen feature

1. Agree on the specific user action and result before migrating anything.
2. Implement that behavior in a small, plainly named module when it needs one. Keep `main.ts` as the entry point.
3. Use Obsidian's native behavior where it suffices. Do not carry over a legacy plugin's settings, services, dependencies, or compatibility layers just to reuse one command.
4. Add only the configuration and persistent data that the accepted feature needs. Keep modules tied to a concrete action rather than introducing a shared service container or settings framework in advance.
5. Test the behavior and its lifecycle. Event-driven features must also prove that unrelated edits and sync bursts do not cause broad scans, reads, writes, or repeated rendering. Clean up registrations through Obsidian's lifecycle APIs.

Dependencies and shared abstractions need an actual use, not a planned one. The lifecycle regression should evolve deliberately as features are accepted.

## Installation

Add `ZachTish/tishos-obsidian` in BRAT and select release `0.2.0`. The plugin appears as **TishOs**.

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

Only `main.js` and `manifest.json` ship. No CSS is needed for the native settings controls. Minimum Obsidian version remains 1.0.0; the plugin uses longstanding command/settings/lifecycle APIs.

Tests use a guarded fake Obsidian host to detect unexpected vault access, imports, timers, launches, or network work during load/unload. They also cover command dispatch, encoded links, rejected links, settings drafts, save failures and preservation of unrelated settings. They do not substitute for loading the final bundle in Obsidian. Installed checks cover registration/removal, blank-link behavior, settings rendering and dispatch with the external launch boundary intercepted so QA cannot trigger a native import. Desktop narrow-layout inspection does not establish physical iPhone behavior. Version-specific results and artifact hashes belong in release notes.

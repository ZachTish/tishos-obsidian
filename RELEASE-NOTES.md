# 0.1.0 — Minimal foundation

TishOs starts as an empty, independent Obsidian plugin. No features, commands, settings, migrations, or dependencies from the existing TPS plugins are included. Enabling it registers no application work and creates no saved state. No CSS is shipped.

Minimum Obsidian version: 1.0.0. The runtime uses only Obsidian's `Plugin` base class and is not desktop-only. No physical iPhone/iPad or older-client acceptance is claimed.

Validation on 2026-10-29:

- TypeScript check and both declared tests passed, with no skips.
- Separate final build: 1,046-byte `main.js`; no bundled runtime dependencies.
- Installed final artifacts in Obsidian Plugin Test Vault, Obsidian 1.15.0, with Sync disabled.
- Two native load/unload cycles passed: zero registered events, child components, or commands; no `data.json` created.
- Original disabled state restored; core/community-plugin configuration hashes unchanged.
- Production was not inspected or changed. This establishes foundation lifecycle correctness, not a performance benchmark for future features.

SHA-256 of tested artifacts:

```text
3b7d3c8873d4b28ad3f7bce6db6266f16b75e7d64e54139ab046aba063d5ce10  main.js
6a436488491af37cd5b87adee0c8ea5f22df430938886a49e8a2c24cbc4e3a06  manifest.json
```

No changes to notes, existing plugin settings, or execution states are required. The BRAT repository is `ZachTish/tishos-obsidian`; use numeric release `0.1.0`. The release contains the exact artifacts verified in the test vault. Production installation and user acceptance remain separate.

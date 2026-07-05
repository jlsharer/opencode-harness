# Role Trace Artifact: implementer plugin autoload adjustment

## Metadata

- orchestrationId: `2026-07-05-opencode-memory-contracts`
- role: `implementer`
- artifactId: `plugin-autoload-adjustment`
- status: completed

## Input Contract

- User correction: local OpenCode plugins are auto-loaded from `.opencode/plugins/`, so a single adapter entry point requires segmented plugin modules to live outside that auto-loaded directory.
- Existing files: the plugin adapter, the former segmented lifecycle plugin in the auto-loaded plugin directory, `.opencode/scripts/validate-harness.mjs`, `.opencode/harness.manifest.json`, harness docs, and memory evidence.

## Output Contract

- Moved segmented lifecycle logic to `.opencode/plugin-modules/harness-lifecycle.js`.
- Kept `.opencode/plugins/index.js` as the only auto-loaded plugin file and updated it to import the segmented module.
- Updated manifest, validation script, design notes, workflow/checklist docs, and memory records to reflect the new layout.

## Routing Metadata

- Original request routing metadata status: absent.
- No values were invented for `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback`.

## Evidence

- Validation evidence: `validation/plugin-autoload-adjustment-checks.md`.
- Hooks/plugins remain guardrails and telemetry only, not acceptance proof.

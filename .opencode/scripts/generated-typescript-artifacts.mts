export type GeneratedArtifact = Readonly<{
  source: string;
  output: string;
  mode: 0o644 | 0o755;
  shebang?: string;
}>;

export const GENERATED_TYPESCRIPT_ARTIFACTS: readonly GeneratedArtifact[] = [
  {
    source: "bin/opencode-harness.js",
    output: "bin/opencode-harness.mjs",
    mode: 0o755,
    shebang: "#!/usr/bin/env node",
  },
  { source: ".opencode/src/plugins/index.js", output: ".opencode/plugins/index.js", mode: 0o644 },
  {
    source: ".opencode/src/plugin-modules/harness-lifecycle.js",
    output: ".opencode/plugin-modules/harness-lifecycle.js",
    mode: 0o644,
  },
  {
    source: ".opencode/src/plugin-modules/role-model-routing-enforcement.js",
    output: ".opencode/plugin-modules/role-model-routing-enforcement.js",
    mode: 0o644,
  },
  {
    source: ".opencode/src/plugin-modules/task-thread-policy.js",
    output: ".opencode/plugin-modules/task-thread-policy.js",
    mode: 0o644,
  },
  {
    source: ".opencode/src/plugin-modules/trace-root-permissions.js",
    output: ".opencode/plugin-modules/trace-root-permissions.js",
    mode: 0o644,
  },
  {
    source: ".opencode/src/routing/model-routing-helper.js",
    output: ".opencode/routing/model-routing-helper.mjs",
    mode: 0o644,
    shebang: "#!/usr/bin/env node",
  },
  {
    source: ".opencode/src/routing/resolve-model-routing.js",
    output: ".opencode/routing/resolve-model-routing.mjs",
    mode: 0o644,
    shebang: "#!/usr/bin/env node",
  },
  {
    source: ".opencode/src/routing/routing-config-loader.js",
    output: ".opencode/routing/routing-config-loader.mjs",
    mode: 0o644,
  },
  {
    source: ".opencode/src/routing/routing-policy.js",
    output: ".opencode/routing/routing-policy.mjs",
    mode: 0o644,
  },
  {
    source: ".opencode/src/routing/routing-policy.test.js",
    output: ".opencode/routing/routing-policy.test.mjs",
    mode: 0o644,
  },
  {
    source: ".opencode/src/plugin-modules/task-thread-policy.test.js",
    output: ".opencode/plugin-modules/task-thread-policy.test.mjs",
    mode: 0o644,
  },
  {
    source: ".opencode/src/plugin-modules/trace-root-permissions.test.js",
    output: ".opencode/plugin-modules/trace-root-permissions.test.mjs",
    mode: 0o644,
  },
  {
    source: ".opencode/src/scripts/bootstrap-portable-harness.js",
    output: ".opencode/scripts/bootstrap-portable-harness.mjs",
    mode: 0o644,
    shebang: "#!/usr/bin/env node",
  },
  {
    source: ".opencode/src/scripts/portable-harness.test.js",
    output: ".opencode/scripts/portable-harness.test.mjs",
    mode: 0o644,
    shebang: "#!/usr/bin/env node",
  },
  {
    source: ".opencode/src/scripts/validate-portable-harness.js",
    output: ".opencode/scripts/validate-portable-harness.mjs",
    mode: 0o644,
    shebang: "#!/usr/bin/env node",
  },
] as const;

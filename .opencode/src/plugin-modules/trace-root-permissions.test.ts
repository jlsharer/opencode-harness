import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyTraceRootPermissions,
  planTraceRootPermissions,
  TRACE_ONLY_ROLES,
  TRACE_PERMISSION_ROLES,
} from "./trace-root-permissions.ts";
import type { TracePermissionOptions, TraceRole } from "./trace-root-permissions.ts";

interface TestAgent {
  permission: Record<string, unknown>;
}

interface TestConfig {
  agent: Record<TraceRole, TestAgent>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "trace-root-permissions-"));
test.after(() => fs.rmSync(temp, { recursive: true, force: true }));

function privateDir(name: string): string {
  const value = path.join(temp, name);
  fs.mkdirSync(value, { recursive: true, mode: 0o700 });
  fs.chmodSync(value, 0o700);
  return fs.realpathSync(value);
}

function cfg(): TestConfig {
  return {
    agent: Object.fromEntries(
      TRACE_PERMISSION_ROLES.map((role) => [
        role,
        {
          permission: TRACE_ONLY_ROLES.includes(role)
            ? {
                edit: { "*": "deny", [`.memory/orchestrations/*/roles/${role}/*.md`]: "allow" },
                task: "deny",
              }
            : { task: "deny", edit: role === "implementer" ? "allow" : { "*": "allow" } },
        },
      ]),
    ) as Record<TraceRole, TestAgent>,
  };
}

function options(name = "trace"): TracePermissionOptions & {
  workspaceRoot: string;
  traceRoot: string;
  runtimeRoot: string;
  directory: string;
  env: Record<string, string | undefined>;
} {
  const workspaceRoot = privateDir(`workspace-${name}`);
  const traceRoot = privateDir(`external-${name}`);
  const runtimeRoot = privateDir(`runtime-${name}`);
  return { workspaceRoot, traceRoot, runtimeRoot, directory: workspaceRoot, env: {} };
}

function matches(pattern: string | undefined, value: string): boolean {
  if (pattern === undefined) return false;
  return new RegExp(`^${pattern.replace(/[.+^$()|\\]/g, "\\$&").replaceAll("*", "[^/]*")}$`).test(
    value,
  );
}

test("absent and exact workspace memory are no-ops", () => {
  const value = cfg();
  const before = structuredClone(value);
  assert.equal(applyTraceRootPermissions(value, { env: {} }), null);
  assert.deepEqual(value, before);
  const opt = options("fallback");
  fs.mkdirSync(path.join(opt.workspaceRoot, ".memory"), { mode: 0o700 });
  assert.equal(
    applyTraceRootPermissions(value, {
      ...opt,
      traceRoot: path.join(opt.workspaceRoot, ".memory"),
    }),
    null,
  );
  assert.deepEqual(value, before);
});

test("four external allows and only three trailing md edit allows are role-isolated", () => {
  const value = cfg();
  const opt = options("positive");
  const implementerEdit = structuredClone(value.agent.implementer!.permission.edit);
  const plan = applyTraceRootPermissions(value, opt);
  if (!plan) throw new Error("expected external trace permission plan");
  assert.equal(plan.permissions.length, 4);
  for (const role of TRACE_PERMISSION_ROLES) {
    const external = value.agent[role]!.permission.external_directory;
    if (external === null || typeof external !== "object" || Array.isArray(external))
      throw new Error("expected external directory permission rules");
    const last = Object.entries(external).at(-1);
    assert.deepEqual(last, [`${opt.traceRoot}/orchestrations/*/roles/${role}/*`, "allow"]);
    assert.ok(
      !Object.keys(external).some((rule) =>
        rule.includes(`/roles/${role === "planner" ? "validator" : "planner"}/`),
      ),
    );
    if (TRACE_ONLY_ROLES.includes(role))
      assert.deepEqual(Object.entries(value.agent[role]!.permission.edit as object).at(-1), [
        `${path.relative(opt.workspaceRoot, opt.traceRoot)}/orchestrations/*/roles/${role}/*.md`,
        "allow",
      ]);
  }
  const plannerEdit = Object.keys(value.agent.planner!.permission.edit as object).at(-1);
  assert.equal(
    matches(
      plannerEdit,
      `${path.relative(opt.workspaceRoot, opt.traceRoot)}/orchestrations/run/roles/planner/trace.md`,
    ),
    true,
  );
  assert.equal(
    matches(
      plannerEdit,
      `${path.relative(opt.workspaceRoot, opt.traceRoot)}/orchestrations/run/roles/validator/trace.md`,
    ),
    false,
    "sibling role denied",
  );
  assert.equal(
    matches(
      plannerEdit,
      `${path.relative(opt.workspaceRoot, opt.traceRoot)}/orchestrations/run/roles/planner/trace.txt`,
    ),
    false,
    "non-md denied",
  );
  assert.deepEqual(value.agent.implementer!.permission.edit, implementerEdit);
  assert.ok(!JSON.stringify(value).includes("/*.txt"));
});

test("spaces are accepted and wildcard, relative, root, overlap, symlink, wrong mode and malformed cfg fail atomically", () => {
  const spaced = options("with space");
  assert.ok(planTraceRootPermissions(cfg(), spaced));
  const base = options("negative");
  const cases = [
    { ...base, traceRoot: "relative" },
    { ...base, traceRoot: "/" },
    { ...base, traceRoot: `${base.traceRoot}*` },
    { ...base, traceRoot: base.workspaceRoot },
  ];
  const link = path.join(temp, "trace-link");
  fs.symlinkSync(base.traceRoot, link);
  cases.push({ ...base, traceRoot: link });
  const wrong = privateDir("wrong-mode");
  fs.chmodSync(wrong, 0o755);
  cases.push({ ...base, traceRoot: wrong });
  for (const candidate of cases) {
    const value = cfg();
    const before = structuredClone(value);
    assert.throws(() => applyTraceRootPermissions(value, candidate));
    assert.deepEqual(value, before);
  }
  type MutableMalformedConfig = {
    agent: Partial<Record<TraceRole, { permission: unknown }>>;
  };
  for (const mutate of [
    (v: MutableMalformedConfig) => delete v.agent.validator,
    (v: MutableMalformedConfig) => {
      if (!v.agent.validator) throw new Error("missing validator fixture");
      v.agent.validator.permission = "allow";
    },
    (v: MutableMalformedConfig) => {
      if (!v.agent.validator) throw new Error("missing validator fixture");
      const permission = v.agent.validator.permission;
      if (!isRecord(permission)) throw new Error("malformed validator permission fixture");
      permission.edit = { "*": "bad" };
    },
  ]) {
    const value = cfg();
    mutate(value);
    const before = structuredClone(value);
    assert.throws(() => applyTraceRootPermissions(value, base));
    assert.deepEqual(value, before);
  }
});

test("probe pair is closed, exclusive, owner-only and exact", () => {
  const opt = options("probe");
  const marker = path.join(privateDir("probe-parent"), "marker.json");
  const nonce = "a".repeat(64);
  assert.throws(() =>
    applyTraceRootPermissions(cfg(), {
      ...opt,
      env: { OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH: marker },
    }),
  );
  const value = cfg();
  const plan = applyTraceRootPermissions(value, {
    ...opt,
    env: {
      OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH: marker,
      OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE: nonce,
    },
  });
  assert.equal(fs.lstatSync(marker).mode & 0o777, 0o600);
  const document: Record<string, unknown> = JSON.parse(fs.readFileSync(marker, "utf8"));
  assert.deepEqual(
    Object.keys(document).sort(),
    [
      "nonce",
      "permissionPlanDigest",
      "permissions",
      "roles",
      "schemaVersion",
      "traceRoot",
      "workspaceRoot",
    ].sort(),
  );
  if (!plan) throw new Error("expected external trace permission plan");
  assert.equal(document.permissionPlanDigest, plan.digest);
  assert.equal(document.nonce, nonce);
  assert.throws(() =>
    applyTraceRootPermissions(cfg(), {
      ...opt,
      env: {
        OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH: marker,
        OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE: nonce,
      },
    }),
  );
});

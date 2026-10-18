import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const TRACE_PERMISSION_ROLES = Object.freeze([
  "implementer",
  "planner",
  "researcher",
  "validator",
]);
export const TRACE_ONLY_ROLES = Object.freeze(["planner", "researcher", "validator"]);
export const TRACE_PERMISSION_SCHEMA_VERSION = "1.0.0";

export type TraceRole = (typeof TRACE_PERMISSION_ROLES)[number];
type PermissionAction = "allow" | "ask" | "deny";
type PermissionRules = Record<string, PermissionAction>;
type PermissionValue = PermissionAction | PermissionRules;
type Environment = Record<string, string | undefined>;
type UnknownRecord = Record<string, unknown>;

interface AgentPermission extends UnknownRecord {
  external_directory?: PermissionValue | undefined;
  edit?: PermissionValue | undefined;
}

interface AgentConfig extends UnknownRecord {
  permission: AgentPermission;
}

interface HarnessConfig extends UnknownRecord {
  agent: Record<TraceRole, AgentConfig>;
}

export interface TracePermissionOptions {
  env?: Environment | undefined;
  traceRoot?: string | undefined;
  workspaceRoot?: string | undefined;
  runtimeRoot?: string | undefined;
  directory?: string | undefined;
  allowNonLinuxForTests?: boolean | undefined;
}

interface PermissionPlanEntry {
  role: TraceRole;
  externalDirectory: string;
  edit: string | null;
}

export interface TracePermissionPlan {
  schemaVersion: string;
  workspaceRoot: string;
  traceRoot: string;
  roles: TraceRole[];
  permissions: PermissionPlanEntry[];
  digest: string;
  replacements: Record<TraceRole, AgentPermission>;
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fail(message: string): never {
  throw new Error(`trace-root-permissions: ${message}`);
}

function mode(stat: fs.Stats): number {
  return stat.mode & 0o777;
}

function strictDescendant(root: string, candidate: string): boolean {
  return candidate.startsWith(`${root}${path.sep}`);
}

function currentUid(): number {
  if (typeof process.getuid !== "function") fail("current-user identity is unavailable");
  return process.getuid();
}

function canonicalDirectory(
  value: unknown,
  label: string,
  exactMode: number | null = null,
): string {
  if (
    typeof value !== "string" ||
    !path.isAbsolute(value) ||
    value === path.parse(value).root ||
    value.includes("\0") ||
    value.includes("\n") ||
    value.includes("\r")
  )
    fail(`${label} must be a non-root absolute canonical path`);
  if (
    path.normalize(value) !== value ||
    value.endsWith(path.sep) ||
    value.includes(`${path.sep}${path.sep}`)
  )
    fail(`${label} must be lexical-canonical`);
  let real;
  try {
    real = fs.realpathSync(value);
  } catch (error) {
    fail(`${label} is unavailable: ${errorMessage(error)}`);
  }
  if (real !== value) fail(`${label} must equal its real path`);
  const root = path.parse(value).root;
  let current = root;
  let parent = fs.lstatSync(root);
  for (const component of value.slice(root.length).split(path.sep)) {
    current = path.join(current, component);
    const stat = fs.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      fail(`${label} contains a symlink or non-directory component`);
    if (stat.uid !== 0 && stat.uid !== currentUid()) fail(`${label} contains an untrusted owner`);
    const writable = (mode(stat) & 0o022) !== 0;
    const sticky = writable && (stat.mode & 0o1000) !== 0 && stat.uid === 0;
    if (writable && !sticky) fail(`${label} contains group/world-writable ancestry`);
    const parentSticky = (mode(parent) & 0o022) !== 0 && (parent.mode & 0o1000) !== 0;
    if (parentSticky && (stat.uid !== currentUid() || mode(stat) !== 0o700))
      fail(`${label} child beneath sticky ancestry must be current-user mode 0700`);
    parent = stat;
  }
  if (parent.uid !== currentUid()) fail(`${label} must be owned by the current user`);
  if (exactMode !== null && mode(parent) !== exactMode)
    fail(`${label} must have mode ${exactMode.toString(8)}`);
  return value;
}

function rules(value: unknown, label: string): PermissionRules {
  if (value === undefined) return {};
  if (value === "allow" || value === "ask" || value === "deny") return { "*": value };
  if (!isRecord(value)) fail(`${label} must be an action or pattern object`);
  for (const [pattern, action] of Object.entries(value))
    if (!pattern || (action !== "allow" && action !== "ask" && action !== "deny"))
      fail(`${label} contains an invalid permission rule`);
  return value as PermissionRules;
}

function permissionPlanDigest(plan: Omit<TracePermissionPlan, "digest" | "replacements">): string {
  return createHash("sha256").update(JSON.stringify(plan)).digest("hex");
}

function harnessConfig(value: unknown): HarnessConfig {
  if (!isRecord(value) || !isRecord(value.agent)) fail("cfg.agent must contain all harness roles");
  for (const role of TRACE_PERMISSION_ROLES) {
    const agent = value.agent[role];
    if (!isRecord(agent)) fail(`missing or malformed agent: ${role}`);
    if (!isRecord(agent.permission)) fail(`agent ${role} permission must be an object`);
  }
  return value as HarnessConfig;
}

export function planTraceRootPermissions(
  cfg: unknown,
  options: TracePermissionOptions = {},
): TracePermissionPlan | null {
  const env = options.env ?? process.env;
  const traceValue = options.traceRoot ?? env.OPENCODE_HARNESS_TRACE_ROOT;
  const workspaceValue = options.workspaceRoot ?? env.OPENCODE_HARNESS_WORKSPACE_ROOT;
  if (!traceValue) return null;
  if (!workspaceValue) fail("workspace root is required when trace root is present");
  if (process.platform !== "linux" && !options.allowNonLinuxForTests)
    fail("external trace permissions require Linux");
  const workspace = canonicalDirectory(workspaceValue, "workspace root");
  if (traceValue === path.join(workspace, ".memory")) return null;
  const traceRoot = canonicalDirectory(traceValue, "trace root", 0o700);
  const runtimeValue = options.runtimeRoot ?? env.OPENCODE_HARNESS_RUNTIME_ROOT;
  const runtimeRoot = runtimeValue ? canonicalDirectory(runtimeValue, "runtime root") : null;
  const contextDirectory = options.directory ?? workspace;
  if (contextDirectory !== workspace) fail("plugin context directory must equal workspace root");
  if (
    traceRoot === workspace ||
    strictDescendant(workspace, traceRoot) ||
    strictDescendant(traceRoot, workspace)
  )
    fail("workspace and external trace root must not overlap");
  if (
    runtimeRoot &&
    (traceRoot === runtimeRoot ||
      strictDescendant(runtimeRoot, traceRoot) ||
      strictDescendant(traceRoot, runtimeRoot))
  )
    fail("runtime and trace root must not overlap");
  if (/[*?\[\]{}!]/.test(traceRoot) || traceRoot.includes("\\"))
    fail("trace root contains glob-active or ambiguous characters");
  const relativeRoot = path.relative(workspace, traceRoot);
  if (
    !relativeRoot ||
    path.isAbsolute(relativeRoot) ||
    path.resolve(workspace, relativeRoot) !== traceRoot ||
    relativeRoot.includes("\\")
  )
    fail("trace root cannot be represented as an exact workspace-relative path");
  const config = harnessConfig(cfg);

  const replacements = {} as Record<TraceRole, AgentPermission>;
  const permissionPlan: PermissionPlanEntry[] = [];
  for (const role of TRACE_PERMISSION_ROLES) {
    const agent = config.agent[role]!;
    const permission = agent.permission;
    const externalPattern = `${traceRoot}/orchestrations/*/roles/${role}/*`;
    const external: PermissionRules = {
      ...rules(permission.external_directory, `${role}.external_directory`),
      [externalPattern]: "allow",
    };
    let replacement = { ...permission, external_directory: external };
    let editPattern = null;
    if (TRACE_ONLY_ROLES.includes(role)) {
      editPattern = `${relativeRoot.split(path.sep).join("/")}/orchestrations/*/roles/${role}/*.md`;
      replacement = {
        ...replacement,
        edit: { ...rules(permission.edit, `${role}.edit`), [editPattern]: "allow" },
      };
    } else if (Object.hasOwn(permission, "edit")) rules(permission.edit, `${role}.edit`);
    replacements[role] = replacement;
    permissionPlan.push({ role, externalDirectory: externalPattern, edit: editPattern });
  }
  const plan = {
    schemaVersion: TRACE_PERMISSION_SCHEMA_VERSION,
    workspaceRoot: workspace,
    traceRoot,
    roles: [...TRACE_PERMISSION_ROLES],
    permissions: permissionPlan,
  };
  return { ...plan, digest: permissionPlanDigest(plan), replacements };
}

function writeProbeMarker(plan: TracePermissionPlan, env: Environment): void {
  const markerPath = env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH;
  const nonce = env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE;
  if (!markerPath && !nonce) return;
  if (!markerPath || !nonce || typeof nonce !== "string" || !/^[a-f0-9]{64}$/.test(nonce))
    fail("probe path and nonce must be a complete valid pair");
  if (
    !path.isAbsolute(markerPath) ||
    path.normalize(markerPath) !== markerPath ||
    path.dirname(markerPath) === markerPath
  )
    fail("probe marker path must be absolute and canonical");
  const parent = canonicalDirectory(path.dirname(markerPath), "probe marker parent", 0o700);
  if (path.dirname(markerPath) !== parent) fail("probe marker parent mismatch");
  const marker = {
    schemaVersion: TRACE_PERMISSION_SCHEMA_VERSION,
    nonce,
    workspaceRoot: plan.workspaceRoot,
    traceRoot: plan.traceRoot,
    roles: plan.roles,
    permissionPlanDigest: plan.digest,
    permissions: plan.permissions,
  };
  fs.writeFileSync(markerPath, `${JSON.stringify(marker)}\n`, { flag: "wx", mode: 0o600 });
  fs.chmodSync(markerPath, 0o600);
}

export function applyTraceRootPermissions(
  cfg: unknown,
  options: TracePermissionOptions = {},
): TracePermissionPlan | null {
  const plan = planTraceRootPermissions(cfg, options);
  const env = options.env ?? process.env;
  if (!plan) {
    if (
      env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH ||
      env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE
    )
      fail("probe variables are forbidden when external trace permissions are inactive");
    return null;
  }
  const config = harnessConfig(cfg);
  for (const role of TRACE_PERMISSION_ROLES)
    config.agent[role]!.permission = plan.replacements[role]!;
  writeProbeMarker(plan, env);
  return plan;
}

export async function TraceRootPermissionsPlugin(
  context: { directory?: string | undefined } = {},
  options: TracePermissionOptions = {},
) {
  return {
    config: async (cfg: unknown) =>
      applyTraceRootPermissions(cfg, {
        ...options,
        directory: options.directory ?? context.directory,
      }),
  };
}

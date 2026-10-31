import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import path from "node:path";
import { createDispatchController, safeScopePath, withinScope } from "./dispatch-controller.ts";
import { validateTaskPacket, validateTaskResult } from "./task-contracts.ts";
import type { TaskContext, TaskResult } from "./task-contracts.ts";

export const GLOBAL_PROFILE_VERSION = "1.0.0";
export const NATIVE_SOURCE_COMMIT = "68bc26b7da1990ce10ffecfbc1e09eb13aa5d824";

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("global protocol: object required");
  return value as Record<string, unknown>;
}

export function identifier(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value))
    throw new Error("global protocol: invalid identity");
  return value;
}

/** Declared files are evidence, never a tool boundary. No Git or implicit project writes. */
export async function declaredFileEvidence(cwd: string, files: string[]) {
  if (!path.isAbsolute(cwd) || path.resolve(cwd) !== cwd || !files.length || files.length > 256)
    throw new Error("global protocol: invalid evidence roots");
  const records: { path: string; sha256: string | null; missing: boolean }[] = [];
  for (const name of [...new Set(files)].sort()) {
    safeScopePath(name);
    if (name.endsWith("/")) throw new Error("declare evidence files individually");
    const target = path.join(cwd, name);
    let current = path.parse(target).root;
    let missing = false;
    for (const part of target.slice(current.length).split(path.sep)) {
      current = path.join(current, part);
      try {
        if ((await lstat(current)).isSymbolicLink()) throw new Error("symlink evidence");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        missing = true;
        break;
      }
    }
    if (missing) {
      records.push({ path: name, sha256: null, missing: true });
      continue;
    }
    const file = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const before = await file.stat();
      if (!before.isFile()) throw new Error("evidence must be a regular file");
      const hash = createHash("sha256");
      for await (const bytes of file.createReadStream({ autoClose: false })) hash.update(bytes);
      const after = await file.stat();
      if (
        before.ino !== after.ino ||
        before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs
      )
        throw new Error("evidence changed during read");
      records.push({ path: name, sha256: hash.digest("hex"), missing: false });
    } finally {
      await file.close();
    }
  }
  return { records, sha256: createHash("sha256").update(JSON.stringify(records)).digest("hex") };
}

type Task = {
  context: TaskContext;
  callID: string;
  childID?: string;
  state: "admitted" | "running" | "awaiting-guidance" | "returned" | "rejected" | "cancelled";
  result?: TaskResult;
  nonceDigest?: string;
  usedNonces?: Set<string>;
};

/** Ephemeral authorization is never restored from traces, context or compaction. */
export function createGlobalProtocol() {
  const runs = new Map<
    string,
    {
      cwd: string;
      evidenceFiles: string[];
      controller: ReturnType<typeof createDispatchController>;
      tasks: Map<string, Task>;
      accepted: boolean;
    }
  >();
  const children = new Set<string>();
  const key = (parentID: string, id: string) => JSON.stringify([parentID, id]);

  function run(parentID: string, id: string) {
    const value = runs.get(key(parentID, id));
    if (!value) throw new Error("orchestration is not admitted for this parent");
    return value;
  }

  function admitOrchestration(
    parentID: string,
    cwd: string,
    spec: unknown,
    declaredFiles?: string[],
  ) {
    identifier(parentID);
    if (!path.isAbsolute(cwd) || path.resolve(cwd) !== cwd) throw new Error("invalid native cwd");
    const controller = createDispatchController(spec, { acceptanceGatePolicy: "native-host" });
    const evidenceFiles = declaredFiles ?? [
      ...controller.spec.allowedPaths,
      ...controller.spec.validationInputs,
    ];
    if (
      !Array.isArray(evidenceFiles) ||
      !evidenceFiles.length ||
      evidenceFiles.length > 256 ||
      evidenceFiles.some(
        (name) =>
          typeof name !== "string" ||
          name.endsWith("/") ||
          !withinScope(name, [
            ...controller.spec.allowedPaths,
            ...controller.spec.validationInputs,
          ]),
      )
    )
      throw new Error("declare individual evidenceFiles within the reviewed scope");
    evidenceFiles.forEach(safeScopePath);
    const id = controller.spec.orchestrationId;
    if (runs.size >= 128 || runs.has(key(parentID, id)))
      throw new Error("duplicate or exhausted orchestration ledger");
    runs.set(key(parentID, id), {
      cwd,
      evidenceFiles: [...new Set(evidenceFiles)],
      controller,
      tasks: new Map(),
      accepted: false,
    });
    return id;
  }

  function admitTask(parentID: string, callID: string, role: TaskContext["role"], packet: unknown) {
    const value = validateTaskPacket(role, packet);
    const context: TaskContext = {
      orchestrationId: identifier(value.orchestrationId),
      delegationTaskId: identifier(value.delegationTaskId),
      scopeKey: identifier(value.scopeKey),
      role,
      taskMode: String(value.taskMode),
    };
    const owner = run(parentID, context.orchestrationId);
    if (owner.accepted || owner.tasks.has(context.delegationTaskId))
      throw new Error("terminal or duplicate task");
    identifier(callID);
    owner.controller.reserve({
      id: context.delegationTaskId,
      workUnitId: context.scopeKey,
      role,
      taskMode: context.taskMode,
      parentSessionId: parentID,
    });
    owner.tasks.set(context.delegationTaskId, {
      context,
      callID: identifier(callID),
      state: "admitted",
    });
    return { context, cwd: owner.cwd };
  }

  function taskFor(parentID: string, context: TaskContext) {
    const owner = run(parentID, context.orchestrationId);
    const task = owner.tasks.get(context.delegationTaskId);
    if (
      !task ||
      Object.keys(task.context).some(
        (key) => task.context[key as keyof TaskContext] !== context[key as keyof TaskContext],
      ) ||
      Object.keys(context).length !== Object.keys(task.context).length
    )
      throw new Error("unknown correlated task");
    return { owner, task };
  }

  function started(
    parentID: string,
    context: TaskContext,
    child: { id: string; parentID?: string; agent?: string },
  ) {
    const { task } = taskFor(parentID, context);
    if (
      task.state !== "admitted" ||
      child.parentID !== parentID ||
      child.agent !== context.role ||
      children.has(child.id)
    )
      throw new Error("invalid or reused native child");
    identifier(child.id);
    children.add(child.id);
    task.childID = child.id;
    task.state = "running";
  }

  function reject(parentID: string, context: TaskContext) {
    const { owner, task } = taskFor(parentID, context);
    if (["admitted", "running", "awaiting-guidance"].includes(task.state)) {
      if (task.state === "awaiting-guidance")
        owner.controller.continueClarification(context.delegationTaskId);
      owner.controller.failLaunch(context.delegationTaskId);
      task.state = "rejected";
    }
  }

  function cancel(parentID: string, context: TaskContext) {
    const { owner, task } = taskFor(parentID, context);
    if (!["admitted", "running", "awaiting-guidance"].includes(task.state))
      throw new Error("terminal task");
    owner.controller.cancel(context.delegationTaskId);
    task.state = "cancelled";
    return { childID: task.childID, termination: "unconfirmed" };
  }

  function result(
    parentID: string,
    context: TaskContext,
    input: unknown,
    proof: { treeHash?: string; gateIds?: string[] } = {},
  ) {
    const { owner, task } = taskFor(parentID, context);
    if (task.state !== "running") throw new Error("duplicate, cancelled or late result");
    const decoded = validateTaskResult(input, context);
    if (decoded.outcome === "clarification") {
      const digest = createHash("sha256").update(decoded.requestNonce!).digest("hex");
      task.usedNonces ??= new Set();
      if (task.usedNonces.has(digest) || task.usedNonces.size >= 8)
        throw new Error("replayed or exhausted clarification nonce");
      task.usedNonces.add(digest);
      task.nonceDigest = digest;
      owner.controller.clarification(context.delegationTaskId);
      task.state = "awaiting-guidance";
      return decoded;
    }
    if (decoded.outcome === "success" && context.role === "validator") {
      const gates = owner.controller.spec.acceptanceGates.filter((g) =>
        g.workUnitIds.includes(context.scopeKey),
      );
      if (
        gates.some(
          (g) =>
            !decoded.evidence.some(
              (e) =>
                e.command === g.evidenceCommand && e.exitCode === 0 && e.sha256 === proof.treeHash,
            ),
        )
      )
        throw new Error("command-backed tree-bound gate evidence required");
    }
    owner.controller.complete(context.delegationTaskId, decoded.outcome, proof);
    task.result = decoded;
    task.state = "returned";
    return decoded;
  }

  function continueClarification(
    parentID: string,
    childID: string,
    callID: string,
    input: unknown,
  ) {
    const response = object(input);
    if (
      Object.keys(response).sort().join() !== "answer,delegationTaskId,kind,requestNonce,version" ||
      response.version !== 1 ||
      response.kind !== "clarification-response" ||
      typeof response.answer !== "string" ||
      !response.answer.trim() ||
      response.answer.length > 4096 ||
      typeof response.requestNonce !== "string" ||
      !response.requestNonce ||
      response.requestNonce.length > 160
    )
      throw new Error("invalid clarification response");
    const matches = [...runs.values()]
      .flatMap((owner) => [...owner.tasks.values()].map((task) => ({ owner, task })))
      .filter(
        ({ task }) =>
          task.childID === childID && task.context.delegationTaskId === response.delegationTaskId,
      );
    if (matches.length !== 1) throw new Error("unresolved clarification child unavailable");
    const { owner, task } = matches[0]!;
    if (
      run(parentID, task.context.orchestrationId) !== owner ||
      task.state !== "awaiting-guidance" ||
      task.nonceDigest !== createHash("sha256").update(response.requestNonce).digest("hex")
    )
      throw new Error("stale or forged clarification response");
    identifier(callID);
    // This resumes the already reserved native child; leaf-agent budgets count
    // fresh children. The nonce ledger separately caps clarification at eight.
    owner.controller.continueClarification(task.context.delegationTaskId);
    delete task.nonceDigest;
    task.callID = callID;
    task.state = "running";
    return { context: task.context, cwd: owner.cwd };
  }

  function accept(parentID: string, id: string, treeHash: string) {
    const owner = run(parentID, id);
    const state = owner.controller.snapshot();
    if (
      owner.accepted ||
      state.active ||
      [...owner.tasks.values()].some((t) =>
        ["admitted", "running", "awaiting-guidance", "cancelled"].includes(t.state),
      ) ||
      owner.controller.spec.roleModeTaskMapping.some(
        (m) =>
          ![...owner.tasks.values()].some(
            (t) =>
              t.context.scopeKey === m.workUnitId &&
              t.context.role === m.role &&
              t.context.taskMode === m.taskMode &&
              t.result?.outcome === "success",
          ),
      ) ||
      owner.controller.spec.acceptanceGates.some((g) => state.gates[g.id] !== treeHash)
    )
      throw new Error("independent acceptance incomplete or stale");
    owner.accepted = true;
    return { accepted: true, treeHash };
  }

  return {
    admitOrchestration,
    admitTask,
    continueClarification,
    started,
    result,
    reject,
    cancel,
    accept,
    snapshot: (parentID: string, id: string) => run(parentID, id).controller.snapshot(),
    evidenceFiles: (parentID: string, id: string) => [...run(parentID, id).evidenceFiles],
    cwd: (parentID: string, id: string) => run(parentID, id).cwd,
    spec: (parentID: string, id: string) => run(parentID, id).controller.spec,
  };
}

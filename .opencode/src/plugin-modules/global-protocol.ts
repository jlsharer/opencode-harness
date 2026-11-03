import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import path from "node:path";
import {
  createDispatchController,
  gateObligationsFor,
  safeScopePath,
  withinScope,
} from "./dispatch-controller.ts";
import { validateTaskPacket, validateTaskResult } from "./task-contracts.ts";
import type { TaskContext, TaskResult } from "./task-contracts.ts";

export const GLOBAL_PROFILE_VERSION = "2.0.0";
// Logical identities are counted once, across resident records and permanent rejection entries.
export type ReplayRecord = {
  kind: "run" | "task" | "call" | "child";
  key: string;
  summary?: AcceptanceSummary;
};
export type AcceptanceSummary = {
  parentID: string;
  orchestrationId: string;
  cwd: string;
  generation: string;
  specDigest: string;
  treeHash: string;
  gates: { id: string; evidenceHash: string }[];
  sequence: number;
};
type ReplayToken = object;

const canonical = (record: ReplayRecord) =>
  JSON.stringify({
    kind: record.kind,
    key: record.key,
    ...(record.summary === undefined ? {} : { summary: record.summary }),
  });

const byteLength = (record: ReplayRecord) => Buffer.byteLength(canonical(record), "utf8");

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Fixed finite replay accounting; no eviction, optional ceiling or payload history. */
export function createGlobalReplayLedger() {
  const entries = new Map<
    string,
    { record: ReplayRecord; bytes: number; summaryReservedBytes: number }
  >();
  const credits = new Map<ReplayToken, { records: number; bytes: number; settled: boolean }>();
  let records = 0,
    bytes = 0,
    summaryReservedBytes = 0;
  const entryKey = (kind: string, key: string) => JSON.stringify([kind, key]);

  function reserve(count: number, reservedBytes: number): ReplayToken {
    if (
      !Number.isSafeInteger(count) ||
      count < 1 ||
      !Number.isSafeInteger(reservedBytes) ||
      reservedBytes < 1
    )
      throw new Error("invalid replay reservation");
    if (records + count > 65536 || bytes + reservedBytes > 16777216)
      throw new Error("exact replay ledger exhausted");
    const token = {};
    credits.set(token, { records: count, bytes: reservedBytes, settled: false });
    records += count;
    bytes += reservedBytes;
    return token;
  }

  function settle(token: ReplayToken, input: ReplayRecord[]) {
    const credit = credits.get(token);
    if (!credit || !input.length || input.length > credit.records)
      throw new Error("invalid replay settlement");
    // All serialization/validation/allocation precedes mutation. Never release admission credits on failure.
    const prepared = input.map((record) => {
      const text = canonical(record);
      const size = Buffer.byteLength(text, "utf8");
      return {
        record: JSON.parse(text) as ReplayRecord,
        bytes: size,
        summaryReservedBytes:
          record.kind === "run" && record.summary !== undefined
            ? size - byteLength({ kind: "run", key: record.key })
            : 0,
      };
    });
    const keys = prepared.map(({ record }) => entryKey(record.kind, record.key));
    if (new Set(keys).size !== keys.length || keys.some((key) => entries.has(key)))
      throw new Error("duplicate replay identity");
    const used = prepared.reduce((sum, entry) => sum + entry.bytes, 0);
    if (used > credit.bytes) throw new Error("replay reservation exceeded");
    prepared.forEach((entry, i) => entries.set(keys[i]!, entry));
    summaryReservedBytes += prepared.reduce((sum, entry) => sum + entry.summaryReservedBytes, 0);
    credit.records -= input.length;
    credit.bytes -= used;
    credit.settled = true;
    if (credit.records === 0) {
      bytes -= credit.bytes;
      credits.delete(token);
    }
  }

  function releaseUnadmitted(token: ReplayToken) {
    const credit = credits.get(token);
    if (!credit || credit.settled) throw new Error("admitted replay credits cannot be released");
    records -= credit.records;
    bytes -= credit.bytes;
    credits.delete(token);
  }

  function prepareReplacement(record: ReplayRecord) {
    const key = entryKey(record.kind, record.key),
      previous = entries.get(key);
    const text = canonical(record),
      next = {
        record: JSON.parse(text) as ReplayRecord,
        bytes: Buffer.byteLength(text, "utf8"),
        summaryReservedBytes: 0,
      };
    if (!previous || next.bytes > previous.bytes) throw new Error("unreserved replay replacement");
    return () => {
      if (entries.get(key) !== previous) throw new Error("replay replacement changed");
      entries.set(key, next);
      bytes -= previous.bytes - next.bytes;
      summaryReservedBytes -= previous.summaryReservedBytes;
    };
  }

  return {
    reserve,
    settle,
    releaseUnadmitted,
    prepareReplacement,
    has: (kind: string, key: string) => entries.has(entryKey(kind, key)),
    get: (kind: string, key: string) => {
      const value = entries.get(entryKey(kind, key));
      return value && (JSON.parse(canonical(value.record)) as ReplayRecord | undefined);
    },
    snapshot: () => ({
      identityRecords: records,
      identityLimit: 65536,
      canonicalBytes: bytes,
      byteLimit: 16777216,
      reservedRecords: [...credits.values()].reduce((n, c) => n + c.records, 0),
      reservedBytes: summaryReservedBytes + [...credits.values()].reduce((n, c) => n + c.bytes, 0),
      reservedSummaryBytes: summaryReservedBytes,
      remainingRecords: 65536 - records,
      remainingBytes: 16777216 - bytes,
    }),
  };
}

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
  replayToken: ReplayToken;
  proof?: { attemptId: string; treeHash: string; domain: string };
  nonceDigest?: string;
  usedNonces?: Set<string>;
};

/** Ephemeral authorization is never restored from traces, context or compaction. */
export function createGlobalProtocol(
  options: {
    now?: () => number;
    maxTaskTimeoutMs?: number;
    replayLedger?: ReturnType<typeof createGlobalReplayLedger>;
    generation?: string;
  } = {},
) {
  const trustedOptions = {
    ...(options.now === undefined ? {} : { now: options.now }),
    ...(options.maxTaskTimeoutMs === undefined
      ? {}
      : { maxTaskTimeoutMs: options.maxTaskTimeoutMs }),
  };
  const replayLedger = options.replayLedger ?? createGlobalReplayLedger();
  const generation = identifier(options.generation ?? randomUUID());
  let sequence = 0;
  const runs = new Map<
    string,
    {
      cwd: string;
      evidenceFiles: string[];
      controller: ReturnType<typeof createDispatchController>;
      tasks: Map<string, Task>;
      accepted: boolean;
      summaryTemplate: AcceptanceSummary;
      summary?: AcceptanceSummary;
      acceptanceDigest?: string;
      evidenceRevision?: string;
      revisionInvalidated?: boolean;
    }
  >();
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
    const controller = createDispatchController(spec, {
      ...trustedOptions,
      acceptanceGatePolicy: "native-host",
    });
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
    if (runs.size >= 128 || replayLedger.has("run", key(parentID, id)))
      throw new Error("duplicate or exhausted orchestration ledger");
    const summaryTemplate: AcceptanceSummary = {
      parentID,
      orchestrationId: id,
      cwd,
      generation,
      specDigest: digest(controller.spec),
      treeHash: "f".repeat(64),
      gates: controller.spec.acceptanceGates
        .map((gate) => ({ id: gate.id, evidenceHash: "f".repeat(64) }))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
      sequence: Number.MAX_SAFE_INTEGER,
    };
    const runRecord: ReplayRecord = {
      kind: "run",
      key: key(parentID, id),
      summary: summaryTemplate,
    };
    const credit = replayLedger.reserve(1, byteLength(runRecord));
    replayLedger.settle(credit, [runRecord]);
    runs.set(key(parentID, id), {
      cwd,
      evidenceFiles: [...new Set(evidenceFiles)],
      controller,
      tasks: new Map(),
      accepted: false,
      summaryTemplate,
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
    const taskRecord: ReplayRecord = {
      kind: "task",
      key: JSON.stringify([parentID, context.orchestrationId, context.delegationTaskId]),
    };
    const callRecord: ReplayRecord = { kind: "call", key: JSON.stringify([parentID, callID]) };
    if (replayLedger.has("task", taskRecord.key) || replayLedger.has("call", callRecord.key))
      throw new Error("duplicate replay identity");
    const credit = replayLedger.reserve(
      3,
      byteLength(taskRecord) +
        byteLength(callRecord) +
        byteLength({ kind: "child", key: JSON.stringify(["x".repeat(160)]) }),
    );
    try {
      owner.controller.reserve({
        id: context.delegationTaskId,
        workUnitId: context.scopeKey,
        role,
        taskMode: context.taskMode,
        parentSessionId: parentID,
      });
    } catch (error) {
      replayLedger.releaseUnadmitted(credit);
      throw error;
    }
    replayLedger.settle(credit, [taskRecord, callRecord]);
    owner.tasks.set(context.delegationTaskId, {
      context,
      callID: identifier(callID),
      state: "admitted",
      replayToken: credit,
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
      replayLedger.has("child", JSON.stringify([child.id]))
    )
      throw new Error("invalid or reused native child");
    identifier(child.id);
    replayLedger.settle(task.replayToken, [{ kind: "child", key: JSON.stringify([child.id]) }]);
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
    return {
      ...(task.childID === undefined ? {} : { childID: task.childID }),
      termination: "unconfirmed",
    };
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
      // V1 deliberately retains historical reverse-edge command proof. V2 uses exact owners.
      const gates =
        owner.controller.spec.schemaVersion === "1.0.0"
          ? owner.controller.spec.acceptanceGates.filter((g) =>
              g.workUnitIds.includes(context.scopeKey),
            )
          : gateObligationsFor(owner.controller.spec, {
              workUnitId: context.scopeKey,
              role: context.role,
              taskMode: context.taskMode,
            });
      if (
        owner.controller.spec.schemaVersion === "2.0.0" &&
        gates.length === 0 &&
        (!proof.treeHash || !decoded.evidence.some((e) => e.sha256 === proof.treeHash))
      )
        throw new Error("current tree-bound advisory evidence required");
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
    if (
      owner.controller.spec.schemaVersion === "2.0.0" &&
      proof.treeHash &&
      /^[a-f0-9]{64}$/.test(proof.treeHash)
    ) {
      if (owner.evidenceRevision !== undefined && owner.evidenceRevision !== proof.treeHash) {
        owner.controller.invalidateValidation();
        owner.revisionInvalidated = true;
      }
      owner.evidenceRevision = proof.treeHash;
    }
    owner.controller.complete(context.delegationTaskId, decoded.outcome, proof);
    if (
      decoded.outcome === "success" &&
      context.role === "validator" &&
      owner.controller.spec.schemaVersion === "2.0.0"
    )
      task.proof = {
        attemptId: context.delegationTaskId,
        treeHash: proof.treeHash!,
        domain: JSON.stringify([...owner.evidenceFiles].sort()),
      };
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
    const callRecord: ReplayRecord = { kind: "call", key: JSON.stringify([parentID, callID]) };
    if (replayLedger.has("call", callRecord.key)) throw new Error("duplicate replay identity");
    const credit = replayLedger.reserve(1, byteLength(callRecord));
    try {
      owner.controller.continueClarification(task.context.delegationTaskId);
    } catch (error) {
      replayLedger.releaseUnadmitted(credit);
      throw error;
    }
    replayLedger.settle(credit, [callRecord]);
    delete task.nonceDigest;
    task.callID = callID;
    task.state = "running";
    return { context: task.context, cwd: owner.cwd };
  }

  function accept(parentID: string, id: string, treeHash: string, version: 1 | 2 = 1) {
    const owner = run(parentID, id);
    if (!/^[a-f0-9]{64}$/.test(treeHash)) throw new Error("invalid acceptance tree hash");
    if (owner.controller.spec.schemaVersion === "2.0.0") {
      const domain = JSON.stringify([...owner.evidenceFiles].sort());
      const stale = owner.controller.spec.roleModeTaskMapping.some((mapping) => {
        if (mapping.role !== "validator") return false;
        const attemptId = owner.controller.currentCompletion(mapping);
        if (!attemptId) return false;
        const proof = owner.tasks.get(attemptId)?.proof;
        return (
          !proof ||
          proof.attemptId !== attemptId ||
          proof.domain !== domain ||
          proof.treeHash !== treeHash
        );
      });
      if (stale || (owner.revisionInvalidated && !owner.controller.mappingsComplete())) {
        owner.revisionInvalidated = false;
        owner.controller.invalidateValidation();
        throw new Error(
          "independent acceptance stale: declared revision changed; fresh validators required",
        );
      }
    }
    const state = owner.controller.snapshot();
    if (owner.controller.spec.associationDiagnostics.length) {
      const details = owner.controller.spec.associationDiagnostics
        .map(
          (d) =>
            `unit ${d.workUnitId}, gate ${d.gateId}: unitDeclares=${d.unitDeclares}, gateDeclares=${d.gateDeclares}`,
        )
        .join("; ");
      throw new Error(
        `independent acceptance incomplete: inconsistent v1 association declarations (${details}); legacy unit proof does not establish global acceptance`,
      );
    }
    if (
      owner.accepted ||
      (owner.controller.spec.schemaVersion === "2.0.0" && !owner.controller.mappingsComplete()) ||
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
    if (!Number.isSafeInteger(sequence + 1)) throw new Error("acceptance sequence exhausted");
    const summary: AcceptanceSummary = {
      ...owner.summaryTemplate,
      treeHash,
      gates: owner.summaryTemplate.gates.map((g) => ({
        id: g.id,
        evidenceHash: state.gates[g.id]!,
      })),
      sequence: sequence + 1,
    };
    const acceptanceDigest = digest(summary);
    const commit = replayLedger.prepareReplacement({
      kind: "run",
      key: key(parentID, id),
      summary,
    });
    commit();
    sequence++;
    owner.summary = summary;
    owner.acceptanceDigest = acceptanceDigest;
    owner.accepted = true;
    return version === 1
      ? { accepted: true, treeHash }
      : { accepted: true, treeHash, summary: structuredClone(summary), acceptanceDigest };
  }

  function refusal(parentID: string, cwd: string, id: string) {
    const owner = run(parentID, id);
    if (owner.cwd !== cwd) return "native cwd mismatch";
    const tasks = [...owner.tasks.values()];
    if (tasks.some((t) => t.state === "cancelled")) return "cancelled task: termination uncertain";
    if (tasks.some((t) => t.state === "awaiting-guidance")) return "awaiting-guidance task";
    if (tasks.some((t) => t.state === "admitted")) return "admitted task: native callback pending";
    if (owner.controller.snapshot().active) return "active or uncertain controller attempts";
    if (tasks.some((t) => t.state !== "returned" || !t.childID))
      return "rejected or uncertain task";
    if (!owner.accepted) return "run is not accepted";
    return null;
  }

  function retire(
    parentID: string,
    cwd: string,
    id: string,
    acceptanceDigest: string,
    adapterProof: {
      generation: string;
      parentID: string;
      cwd: string;
      pending: boolean;
      callsConsumed: boolean;
      prepare: () => () => void;
    },
  ) {
    if (
      adapterProof.generation !== generation ||
      adapterProof.parentID !== parentID ||
      adapterProof.cwd !== cwd
    )
      throw new Error("retirement parent/cwd/generation mismatch");
    const entry = replayLedger.get("run", key(parentID, id));
    const owner = runs.get(key(parentID, id));
    if (!owner) {
      if (
        !entry?.summary ||
        entry.summary.cwd !== cwd ||
        entry.summary.generation !== generation ||
        digest(entry.summary) !== acceptanceDigest
      )
        throw new Error("unknown retirement or mismatched acceptance digest");
      return { retired: true, summary: entry.summary, acceptanceDigest };
    }
    const reason = refusal(parentID, cwd, id);
    if (reason || adapterProof.pending || !adapterProof.callsConsumed)
      throw new Error(
        "retirement refused: " + (reason ?? "pending callback/command or unconsumed call"),
      );
    if (acceptanceDigest !== owner.acceptanceDigest)
      throw new Error("retirement acceptance digest mismatch");
    // Rejection identities were installed at admission/start, before authority. Prepare
    // all adapter replacements without mutation. The final commit has no await.
    const commitAdapter = adapterProof.prepare();
    const result = { retired: true, summary: structuredClone(owner.summary!), acceptanceDigest };
    commitAdapter();
    runs.delete(key(parentID, id));
    return result;
  }

  function status(parentID: string, cwd: string) {
    return {
      version: 2,
      profileVersion: GLOBAL_PROFILE_VERSION,
      supportedControlVersions: [1, 2],
      generation,
      residentRuns: { used: runs.size, limit: 128 },
      replay: replayLedger.snapshot(),
      runs: [...runs.entries()]
        .filter(([key]) => JSON.parse(key)[0] === parentID)
        .map(([key, owner]) => {
          const id = JSON.parse(key)[1] as string;
          return {
            orchestrationId: id,
            accepted: owner.accepted,
            acceptanceDigest: owner.acceptanceDigest ?? null,
            retirementRefusal: refusal(parentID, cwd, id),
          };
        }),
    };
  }

  return {
    admitOrchestration,
    status,
    retire,
    admitTask,
    continueClarification,
    started,
    result,
    reject,
    cancel,
    accept,
    snapshot: (parentID: string, id: string) => run(parentID, id).controller.snapshot(),
    diagnostics: (parentID: string, id: string) => run(parentID, id).controller.diagnostics(),
    evidenceFiles: (parentID: string, id: string) => [...run(parentID, id).evidenceFiles],
    cwd: (parentID: string, id: string) => run(parentID, id).cwd,
    spec: (parentID: string, id: string) => run(parentID, id).controller.spec,
  };
}

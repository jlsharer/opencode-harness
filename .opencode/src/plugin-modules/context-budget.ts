import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export type UsageTelemetry = {
  status: "unknown" | "reported";
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
};

/** Only native/reported measurements are accepted; byte counts are never token estimates. */
export function validateUsageTelemetry(value: unknown): UsageTelemetry {
  if (value === undefined || value === null)
    return { status: "unknown", inputTokens: null, outputTokens: null, costUsd: null };
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("usage must be an object");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !["inputTokens", "outputTokens", "costUsd"].includes(key)))
    throw new Error("unsupported usage field");
  const token = (key: string): number | null => {
    const candidate = record[key];
    if (candidate === undefined || candidate === null) return null;
    if (typeof candidate !== "number" || !Number.isSafeInteger(candidate) || candidate < 0)
      throw new Error(`invalid ${key}`);
    return candidate;
  };
  const cost = record.costUsd;
  if (
    cost !== undefined &&
    cost !== null &&
    (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0)
  )
    throw new Error("invalid costUsd");
  const inputTokens = token("inputTokens");
  const outputTokens = token("outputTokens");
  const costUsd = typeof cost === "number" ? cost : null;
  return {
    status:
      inputTokens === null && outputTokens === null && costUsd === null ? "unknown" : "reported",
    inputTokens,
    outputTokens,
    costUsd,
  };
}

export type ReferenceIndex = Record<string, { path: string; sha256: string }>;
export type ExpansionBudget = { maxEntries: number; maxBytes: number; maxReferenceBytes: number };
export type ExpandedReference = {
  id: string;
  path: string;
  content: string;
  bytes: number;
  sha256: string;
};

function positiveBound(value: number, ceiling: number): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > ceiling)
    throw new Error("invalid expansion budget");
}

async function checkedPath(root: string, relative: string): Promise<string> {
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative.includes("\\") ||
    relative.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw new Error("reference must be a canonical relative path");
  const target = path.join(root, relative);
  // Check every component, including root ancestors. O_NOFOLLOW protects the leaf read too.
  let current = path.parse(target).root;
  for (const part of target.slice(current.length).split(path.sep)) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) throw new Error("symlink reference is forbidden");
    if (current !== target && !stat.isDirectory()) throw new Error("invalid reference ancestor");
  }
  if ((await realpath(target)) !== target) throw new Error("reference changed canonical path");
  return target;
}

/** Explicit allowlisted index only; no recursive discovery or implicit expansion. Same-UID
 * ancestor replacement remains a filesystem race boundary, not a sandbox guarantee. */
export async function expandIndexedReferences(
  root: string,
  index: ReferenceIndex,
  requestedIds: string[],
  budget: ExpansionBudget,
): Promise<{ entries: ExpandedReference[]; bytes: number }> {
  positiveBound(budget.maxEntries, 128);
  positiveBound(budget.maxBytes, 1024 * 1024);
  positiveBound(budget.maxReferenceBytes, budget.maxBytes);
  if (!path.isAbsolute(root) || path.resolve(root) !== root)
    throw new Error("root must be canonical absolute");
  if (requestedIds.length > budget.maxEntries || new Set(requestedIds).size !== requestedIds.length)
    throw new Error("reference entry budget exceeded or duplicate reference");
  const entries: ExpandedReference[] = [];
  let bytes = 0;
  for (const id of requestedIds) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(id) || !Object.hasOwn(index, id))
      throw new Error("unknown indexed reference");
    const entry = index[id];
    if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256))
      throw new Error("reference requires exact sha256");
    const target = await checkedPath(root, entry.path);
    const handle = await open(
      target,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    try {
      const before = await handle.stat();
      if (!before.isFile()) throw new Error("reference must be a regular file");
      const limit = Math.min(budget.maxReferenceBytes, budget.maxBytes - bytes);
      if (before.size > limit) throw new Error("reference byte budget exceeded");
      // Bounded allocation and bounded read even if the file grows concurrently.
      const buffer = Buffer.alloc(limit + 1);
      let length = 0;
      while (length < buffer.length) {
        const result = await handle.read(buffer, length, buffer.length - length, length);
        if (result.bytesRead === 0) break;
        length += result.bytesRead;
      }
      const after = await handle.stat();
      if (length > limit) throw new Error("reference byte budget exceeded");
      if (
        before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs ||
        before.ctimeMs !== after.ctimeMs
      )
        throw new Error("reference changed while reading");
      const data = buffer.subarray(0, length);
      const sha256 = createHash("sha256").update(data).digest("hex");
      if (sha256 !== entry.sha256) throw new Error("stale reference hash");
      const content = new TextDecoder("utf-8", { fatal: true }).decode(data);
      entries.push({ id, path: entry.path, content, bytes: length, sha256 });
      bytes += length;
    } finally {
      await handle.close();
    }
  }
  return { entries, bytes };
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Only terminal attempts with no active worker are safe for a native compaction request. */
export function managedCompactionSafe(value: unknown): boolean {
  const managed = object(value);
  return (
    managed?.stopped === false &&
    managed.background === null &&
    Array.isArray(managed.runs) &&
    managed.runs.every((entry: unknown) => {
      const run = object(entry);
      return (
        run?.interrupted === false &&
        run.active === 0 &&
        Array.isArray(run.attempts) &&
        run.attempts.every((entry: unknown) =>
          ["success", "blocked", "failed"].includes(String(object(entry)?.state)),
        )
      );
    })
  );
}

export type CompactionDecision =
  | { status: "skip" }
  | {
      status: "request-eligible";
      evidence: "reported-turn-input-proxy";
      messageID: string;
      providerID: string;
      modelID: string;
    };

/** Reported completed-turn input (uncached + cache read/write) is a proxy,
 * never a measurement of current occupancy. */
export function reportedInputCompactionDecision(input: {
  session: unknown;
  status: unknown;
  idleEvent: unknown;
  messages: unknown;
  providers: unknown;
  managed: unknown;
}): CompactionDecision {
  const skip = { status: "skip" } as const;
  const session = object(input.session);
  const status = object(input.status);
  const idleEvent = object(input.idleEvent);
  const time = object(session?.time);
  const compacting = time?.compacting ?? 0;
  if (
    !session ||
    typeof session.id !== "string" ||
    !session.id ||
    session.parentID !== undefined ||
    !idleEvent ||
    idleEvent.sessionID !== session.id ||
    !(
      idleEvent.type === "session.idle" ||
      (idleEvent.type === "session.status" && object(idleEvent.status)?.type === "idle")
    ) ||
    !status ||
    (Object.hasOwn(status, session.id) && object(status[session.id])?.type !== "idle") ||
    !managedCompactionSafe(input.managed) ||
    !Array.isArray(input.messages) ||
    !input.messages.length ||
    input.messages.length > 256 ||
    !Number.isSafeInteger(compacting) ||
    (compacting as number) < 0
  )
    return skip;
  const messages = input.messages as unknown[];
  const info = object(object(messages.at(-1))?.info);
  const turnTime = object(info?.time);
  const tokens = object(info?.tokens);
  const cache = object(tokens?.cache);
  if (tokens?.cache !== undefined && !cache) return skip;
  const cacheRead = cache?.read ?? 0;
  const cacheWrite = cache?.write ?? 0;
  if (
    !info ||
    info.role !== "assistant" ||
    info.sessionID !== session.id ||
    typeof info.id !== "string" ||
    !info.id ||
    info.summary === true ||
    info.error !== undefined ||
    !Number.isSafeInteger(turnTime?.created) ||
    !Number.isSafeInteger(turnTime?.completed) ||
    (turnTime?.completed as number) < (turnTime?.created as number) ||
    (turnTime?.created as number) <= (compacting as number) ||
    typeof info.providerID !== "string" ||
    !info.providerID ||
    typeof info.modelID !== "string" ||
    !info.modelID ||
    !Number.isSafeInteger(tokens?.input) ||
    (tokens?.input as number) < 0 ||
    !Number.isSafeInteger(cacheRead) ||
    (cacheRead as number) < 0 ||
    !Number.isSafeInteger(cacheWrite) ||
    (cacheWrite as number) < 0
  )
    return skip;
  const parent = object(
    object(messages.findLast((entry) => object(object(entry)?.info)?.id === info.parentID))?.info,
  );
  const parentModel = object(parent?.model);
  const parentTime = object(parent?.time);
  if (
    !parent ||
    parent.role !== "user" ||
    parent.sessionID !== session.id ||
    parentModel?.providerID !== info.providerID ||
    parentModel.modelID !== info.modelID ||
    !Number.isSafeInteger(parentTime?.created) ||
    (parentTime?.created as number) > (turnTime?.created as number) ||
    messages.some((entry) => {
      const message = object(object(entry)?.info);
      return (
        message?.sessionID !== session.id ||
        !message?.id ||
        (message?.role !== "assistant" && message?.role !== "user")
      );
    })
  )
    return skip;
  const providers = object(input.providers);
  const all = providers?.all;
  if (
    !Array.isArray(all) ||
    all.filter((provider: unknown) => object(provider)?.id === info.providerID).length !== 1
  )
    return skip;
  const provider = object(all.find((entry: unknown) => object(entry)?.id === info.providerID));
  const model = object(object(provider?.models)?.[info.modelID]);
  const limit = object(model?.limit)?.context;
  if (model?.id !== info.modelID || !Number.isSafeInteger(limit) || (limit as number) < 1)
    return skip;
  const reportedInput =
    BigInt(tokens?.input as number) + BigInt(cacheRead as number) + BigInt(cacheWrite as number);
  if (
    reportedInput > BigInt(Number.MAX_SAFE_INTEGER) ||
    reportedInput * 5n < BigInt(limit as number) * 3n
  )
    return skip;
  return {
    status: "request-eligible",
    evidence: "reported-turn-input-proxy",
    messageID: info.id,
    providerID: info.providerID,
    modelID: info.modelID,
  };
}

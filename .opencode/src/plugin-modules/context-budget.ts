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

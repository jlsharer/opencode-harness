/** Persistent refusal barrier, not durable recovery. Never enumerate completed orchestration history. */
import {
  constants,
  closeSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import type { Stats } from "node:fs";
import path from "node:path";

export interface DirectLeaseIdentity {
  orchestrationId: string;
  specDigest: string;
  delegationTaskId: string;
  parentSessionID: string;
  parentAgent: string;
  parentMessageID: string;
  parentCallID: string;
  childID: string;
  promptID: string;
  deadline: number;
}
declare const leaseBrand: unique symbol;
export type OwnedLease = Readonly<{ [leaseBrand]: never }>;

export class DirectLeaseCleanupError extends Error {
  readonly markerPath: string;
  readonly markerState: "present" | "missing" | "unknown";
  constructor(markerPath: string, markerState: "present" | "missing" | "unknown", cause: unknown) {
    super(`direct lease cleanup failed; marker ${markerState}: ${markerPath}`, { cause });
    this.name = "DirectLeaseCleanupError";
    this.markerPath = markerPath;
    this.markerState = markerState;
  }
}

const uid = () => process.getuid!();

const same = (a: Stats, b: Stats) => a.dev === b.dev && a.ino === b.ino;

function canonical(value: string) {
  if (
    typeof value !== "string" ||
    !path.isAbsolute(value) ||
    value.includes("\0") ||
    value !== path.resolve(value) ||
    value === "/"
  )
    throw new Error("unsafe direct lease root");
}

function ancestry(root: string, privateRoot: boolean) {
  canonical(root);
  const components = root.split("/").slice(1);
  let current = "/";
  for (let index = 0; index < components.length; index++) {
    current = path.join(current, components[index]!);
    const stat = lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink() || ![0, uid()].includes(stat.uid))
      throw new Error("unsafe direct lease ancestry");
    if (stat.mode & 0o022) {
      // Sticky root directories are traversable only through an existing private immediate child.
      if (stat.uid !== 0 || !(stat.mode & 0o1000) || index + 1 >= components.length)
        throw new Error("writable direct lease ancestry");
      const child = lstatSync(path.join(current, components[index + 1]!));
      if (!child.isDirectory() || child.uid !== uid() || (child.mode & 0o777) !== 0o700)
        throw new Error("unsafe sticky direct lease ancestry");
    }
    if (
      index === components.length - 1 &&
      (stat.uid !== uid() ||
        (privateRoot ? (stat.mode & 0o777) !== 0o700 : Boolean(stat.mode & 0o022)))
    )
      throw new Error("unsafe direct lease root permissions");
  }
  return lstatSync(root);
}

function parentStat(parent: string) {
  const stat = lstatSync(parent);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    stat.uid !== uid() ||
    (stat.mode & 0o777) !== 0o700
  )
    throw new Error("unsafe direct lease parent");
  return stat;
}

function readMarker(marker: string) {
  const before = lstatSync(marker);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.uid !== uid() ||
    (before.mode & 0o777) !== 0o600 ||
    before.nlink !== 1 ||
    before.size > 65536
  )
    throw new Error("unsafe direct lease marker");
  const fd = openSync(marker, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (!same(before, opened)) throw new Error("changed direct lease marker");
    const bytes = readFileSync(fd, "utf8");
    const after = fstatSync(fd);
    if (
      !same(before, after) ||
      after.size !== before.size ||
      after.mtimeMs !== before.mtimeMs ||
      after.ctimeMs !== before.ctimeMs ||
      !same(after, lstatSync(marker))
    )
      throw new Error("changed direct lease marker");
    return { stat: after, bytes };
  } finally {
    closeSync(fd);
  }
}

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

export function createDirectSessionLease(options: { traceRoot: string; workspaceRoot: string }) {
  const { traceRoot, workspaceRoot } = options;
  const rootIdentity = ancestry(traceRoot, true);
  ancestry(workspaceRoot, false);
  const parent = path.join(traceRoot, "orchestrations");
  const marker = path.join(parent, ".direct-session-unresolved.json");
  const owned = new WeakMap<object, { parent: Stats; marker: Stats; bytes: string }>();
  const checkRoot = () => {
    if (!same(rootIdentity, ancestry(traceRoot, true)))
      throw new Error("changed direct lease trace root");
  };
  const checkParent = () => {
    checkRoot();
    return parentStat(parent);
  };

  function validateOwned(lease: OwnedLease) {
    const record = owned.get(lease);
    if (!record) throw new Error("unowned direct lease");
    if (!same(record.parent, checkParent()))
      throw new Error(`changed direct lease parent retained: ${marker}`);
    const current = readMarker(marker);
    if (!same(record.marker, current.stat) || current.bytes !== record.bytes)
      throw new Error(`changed direct lease retained: ${marker}`);
    if (!same(record.parent, checkParent()) || !same(record.marker, lstatSync(marker)))
      throw new Error(`changed direct lease retained: ${marker}`);
    return record;
  }

  // The caller must bind this token to its exact active managed attempt.
  // Ownership validation alone proves neither attempt activity nor managed acceptance.
  function assertClear(lease?: OwnedLease) {
    if (lease !== undefined) {
      validateOwned(lease);
      return;
    }
    checkRoot();
    try {
      parentStat(parent);
    } catch (error) {
      if (missing(error)) return;
      throw error;
    }
    try {
      readMarker(marker);
    } catch (error) {
      if (missing(error)) return;
      throw error;
    }
    throw new Error(`unresolved direct session lease retained: ${marker}`);
  }

  return {
    assertClear,
    acquire(identity: DirectLeaseIdentity): OwnedLease {
      assertClear();
      const fields = [
        "orchestrationId",
        "specDigest",
        "delegationTaskId",
        "parentSessionID",
        "parentAgent",
        "parentMessageID",
        "parentCallID",
        "childID",
        "promptID",
      ] as const;
      if (
        fields.some(
          (key) =>
            typeof identity[key] !== "string" || !identity[key] || identity[key].length > 1024,
        ) ||
        !Number.isFinite(identity.deadline)
      )
        throw new Error("invalid direct lease identity");
      checkRoot();
      try {
        mkdirSync(parent, { mode: 0o700 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
      const parentIdentity = checkParent();
      const copied = Object.fromEntries(fields.map((key) => [key, identity[key]]));
      const bytes =
        JSON.stringify({
          version: 1,
          traceRoot,
          workspaceRoot,
          ...copied,
          deadline: identity.deadline,
        }) + "\n";
      const fd = openSync(
        marker,
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
        0o600,
      );
      let fileIdentity: Stats;
      try {
        fileIdentity = fstatSync(fd);
        writeFileSync(fd, bytes, "utf8");
        if (!same(parentIdentity, checkParent()) || !same(fileIdentity, lstatSync(marker)))
          throw new Error(`changed direct lease retained: ${marker}`);
      } finally {
        closeSync(fd);
      }
      const verified = readMarker(marker);
      if (!same(fileIdentity, verified.stat) || verified.bytes !== bytes)
        throw new Error(`changed direct lease retained: ${marker}`);
      const lease = Object.freeze({}) as OwnedLease;
      owned.set(lease, { parent: parentIdentity, marker: verified.stat, bytes });
      return lease;
    },
    release(lease: OwnedLease) {
      try {
        const record = validateOwned(lease);
        // Node has no descriptor-relative unlink; malicious same-UID replacement remains outside this boundary.
        unlinkSync(marker);
        if (!same(record.parent, checkParent()))
          throw new Error(`changed direct lease parent: ${marker}`);
        try {
          lstatSync(marker);
        } catch (error) {
          if (missing(error)) {
            owned.delete(lease);
            return;
          }
          throw error;
        }
        throw new Error(`direct lease cleanup failed: ${marker}`);
      } catch (error) {
        let state: "present" | "missing" | "unknown" = "unknown";
        try {
          const record = owned.get(lease);
          if (!record || !same(record.parent, checkParent()))
            throw new Error("unowned cleanup parent");
          try {
            lstatSync(marker);
            state = "present";
          } catch (failure) {
            if (missing(failure)) state = "missing";
            else throw failure;
          }
          if (!same(record.parent, checkParent())) state = "unknown";
        } catch {
          state = "unknown";
        }
        throw new DirectLeaseCleanupError(marker, state, error);
      }
    },
  };
}

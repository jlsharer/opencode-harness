import { formatTaskResultWrapper } from "./task-thread-policy.ts";

type RecordValue = Record<string, unknown>;

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`V2 ${label} must be an object`);
  return value as RecordValue;
}

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value))
    throw new Error(`V2 ${label} identity is unavailable`);
  return value;
}

function modelID(value: unknown): string {
  if (typeof value !== "string" || !/^[^\s<>"\\]{1,159}$/.test(value))
    throw new Error("V2 worker model identity is unavailable");
  return value;
}

function matchesTextContent(value: unknown, expected: string): boolean {
  if (typeof value === "string") return value === expected;
  if (!Array.isArray(value) || value.length !== 1) return false;
  const content = value[0];
  return (
    content !== null &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    content.type === "text" &&
    content.text === expected
  );
}

const ROLES = new Set(["researcher", "planner", "implementer", "validator"]);

/** V2 models may render their sole JSON result in one exact JSON code fence. */
export function v2JsonResult(text: string): string {
  if (text.length > 32768) throw new Error("V2 terminal result exceeds bound");
  const fenced = /^```json\n(\{[\s\S]*\})\n```$/.exec(text);
  if (!fenced) return text;
  // The existing typed result parser remains authoritative; this only removes
  // one exact display wrapper after independently verified native correlation.
  const decoded: unknown = JSON.parse(fenced[1]!);
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded))
    throw new Error("V2 fenced result is not a JSON object");
  return fenced[1]!;
}

export interface V2ToolBefore {
  tool: unknown;
  sessionID: unknown;
  id: unknown;
  input: unknown;
}

export interface V2ToolAfter extends V2ToolBefore {
  status: unknown;
  result?: unknown;
}

/** Native V2 uses sessionID for continuation; the internal controller retains its V1 policy vocabulary. */
export async function admitV2Subagent(
  event: V2ToolBefore,
  beforeTask: (input: { sessionID: string; callID: string }, args: RecordValue) => Promise<void>,
): Promise<void> {
  if (event.tool !== "subagent") throw new Error("V2 admission requires native subagent");
  const parent = identity(event.sessionID, "parent session");
  const callID = identity(event.id, "tool call");
  const input = record(event.input, "subagent input");
  if (
    Object.keys(input).some(
      (key) =>
        !["agent", "description", "prompt", "model", "sessionID", "background"].includes(key),
    ) ||
    !ROLES.has(String(input.agent)) ||
    typeof input.prompt !== "string" ||
    typeof input.description !== "string" ||
    (input.model !== undefined && typeof input.model !== "string") ||
    (input.background !== undefined && typeof input.background !== "boolean")
  )
    throw new Error("V2 subagent contract mismatch");
  const args: RecordValue = {
    subagent_type: input.agent,
    description: input.description,
    prompt: input.prompt,
  };
  if (input.sessionID !== undefined) args.task_id = identity(input.sessionID, "continued child");
  if (input.background !== undefined) args.background = input.background;
  await beforeTask({ sessionID: parent, callID }, args);
  if (typeof args.background !== "boolean")
    throw new Error("V2 managed dispatch did not establish native execution mode");
  input.prompt = args.prompt;
  input.background = args.background;
  if (Object.hasOwn(args, "task_id")) input.sessionID = args.task_id;
}

export function runningV2Subagent(
  event: V2ToolAfter,
  child: { id: unknown; parentID: unknown; model: unknown },
  startedAt: unknown,
): {
  input: { sessionID: string; callID: string };
  output: {
    metadata: {
      sessionId: string;
      jobId: string;
      background: true;
      jobStartedAt: number;
      model: { providerID: string; modelID: string };
    };
    output: string;
  };
} {
  if (event.tool !== "subagent" || event.status !== "completed")
    throw new Error("V2 native background launch did not complete");
  const parent = identity(event.sessionID, "parent session");
  const callID = identity(event.id, "tool call");
  const result = record(event.result, "background result");
  const output = record(result.output, "background output");
  const metadata = record(result.metadata, "background metadata");
  const childID = identity(output.sessionID, "child session");
  const model = record(child.model, "background child model");
  if (
    output.status !== "running" ||
    metadata.status !== "running" ||
    metadata.sessionID !== childID ||
    child.id !== childID ||
    child.parentID !== parent ||
    typeof output.output !== "string" ||
    output.output.length > 4096 ||
    !matchesTextContent(result.content, output.output) ||
    typeof startedAt !== "number" ||
    !Number.isSafeInteger(startedAt) ||
    startedAt <= 0
  )
    throw new Error("V2 native background child or launch identity mismatch");
  return {
    input: { sessionID: parent, callID },
    output: {
      metadata: {
        sessionId: childID,
        jobId: childID,
        background: true,
        jobStartedAt: startedAt,
        model: {
          providerID: identity(model.providerID, "worker provider"),
          modelID: modelID(model.id),
        },
      },
      output: `<task id="${childID}" state="running">\n${output.output}\n</task>`,
    },
  };
}

/** The native content, metadata, result and session relationship must all agree before synthesis. */
export function completedV2Subagent(
  event: V2ToolAfter,
  child: { id: unknown; parentID: unknown },
): {
  input: { sessionID: string; callID: string };
  output: { metadata: { sessionId: string }; output: string };
} {
  if (event.tool !== "subagent" || event.status !== "completed")
    throw new Error("V2 native subagent did not complete");
  const parent = identity(event.sessionID, "parent session");
  const callID = identity(event.id, "tool call");
  const result = record(event.result, "subagent result");
  const output = record(result.output, "subagent output");
  const metadata = record(result.metadata, "subagent metadata");
  const childID = identity(output.sessionID, "child session");
  if (
    output.status !== "completed" ||
    metadata.sessionID !== childID ||
    metadata.status !== "completed" ||
    child.id !== childID ||
    child.parentID !== parent ||
    typeof output.output !== "string"
  )
    throw new Error("V2 native subagent output and child identity mismatch");
  if (
    !matchesTextContent(
      result.content,
      `<subagent sessionID="${childID}" state="completed">\n${output.output}\n</subagent>`,
    )
  )
    throw new Error("V2 native completed wrapper mismatch");
  return {
    input: { sessionID: parent, callID },
    output: {
      metadata: { sessionId: childID },
      output: formatTaskResultWrapper(v2JsonResult(output.output), childID),
    },
  };
}

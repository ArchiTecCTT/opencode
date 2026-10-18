export * as SessionLegacy from "./legacy.js"

/**
 * Before v2.1, native data was stored as `state` or `providerState`.
 * Stored events and projected messages keep whichever shape they were written with; these upgrade them on read.
 */

const renames: Record<string, ReadonlyArray<readonly [string, string]>> = {
  "session.text.ended": [["state", "native"]],
  "session.reasoning.started": [["state", "native"]],
  "session.reasoning.ended": [["state", "native"]],
  "session.tool.called": [["state", "native"]],
  "session.step.ended": [["providerState", "native"]],
  "session.step.failed": [["providerState", "native"]],
  "session.compaction.ended": [["providerState", "native"]],
}

export function event(type: string, data: unknown) {
  if (!isRecord(data)) return data
  if (type === "session.message.content.updated") return content(data)
  return (renames[type] ?? []).reduce((result, [from, to]) => rename(result, from, to), data)
}

export function message(type: string, data: Record<string, unknown>) {
  if (type === "assistant") return content(rename(data, "providerState", "native"))
  if (type === "compaction") return rename(data, "providerState", "native")
  return data
}

function content(data: Record<string, unknown>) {
  if (!Array.isArray(data.content)) return data
  return { ...data, content: data.content.map(part) }
}

function part(value: unknown) {
  if (!isRecord(value)) return value
  if (value.type === "text" || value.type === "reasoning") return rename(value, "state", "native")
  if (value.type === "tool")
    return rename(value, "providerState", "native")
  return value
}

function rename(value: Record<string, unknown>, from: string, to: string) {
  if (!(from in value)) return value
  const { [from]: moved, ...rest } = value
  return { ...rest, [to]: moved }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export * as SessionLegacy from "./session-legacy.js"

/**
 * Before v2.1, native data was stored as `state` or `providerState`. Stored events, projected messages, and
 * exported sessions keep whichever shape they were written with; these upgrade them before decoding.
 */

const renames: Record<string, readonly [string, string]> = {
  "session.text.ended": ["state", "native"],
  "session.reasoning.started": ["state", "native"],
  "session.reasoning.ended": ["state", "native"],
  "session.tool.called": ["state", "native"],
  "session.step.ended": ["providerState", "native"],
  "session.step.failed": ["providerState", "native"],
  "session.compaction.ended": ["providerState", "native"],
}

/** Upgrades a durable event payload by event type. */
export function event(type: string, data: unknown) {
  if (!isRecord(data)) return data
  if (type === "session.message.content.updated") return content(data)
  const entry = renames[type]
  return entry ? rename(data, entry[0], entry[1]) : data
}

/** Upgrades a projected message's data by message type. */
export function message(type: unknown, data: Record<string, unknown>) {
  if (type === "assistant") return content(rename(data, "providerState", "native"))
  if (type === "compaction") return rename(data, "providerState", "native")
  return data
}

/** Upgrades an exported session (`SessionTransfer.Data`) before decoding. */
export function transfer(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.messages)) return value
  return {
    ...value,
    messages: value.messages.map((item: unknown) => (isRecord(item) ? message(item.type, item) : item)),
  }
}

function content(data: Record<string, unknown>) {
  if (!Array.isArray(data.content)) return data
  return { ...data, content: data.content.map(part) }
}

function part(value: unknown) {
  if (!isRecord(value)) return value
  if (value.type === "text" || value.type === "reasoning") return rename(value, "state", "native")
  // A tool part's own `state` is its lifecycle status, not native data.
  if (value.type === "tool") return rename(value, "providerState", "native")
  return value
}

// The current name wins when a payload carries both.
function rename(value: Record<string, unknown>, from: string, to: string) {
  if (!(from in value)) return value
  const { [from]: moved, ...rest } = value
  return to in rest ? rest : { ...rest, [to]: moved }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

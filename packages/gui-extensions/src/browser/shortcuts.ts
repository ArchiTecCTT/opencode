import type { KeyChord } from "../sdk"

/** A key press the page received, with Electron's `Input` field names. */
export type PageKey = Pick<Electron.Input, "key" | "code" | "control" | "meta" | "shift" | "alt">

// Unshifted chords with the platform's modifier that the page answers: clipboard, select all, undo, find, reload,
// history, and the pane's own address shortcut.
const pageKeys = ["c", "x", "v", "a", "z", "f", "g", "r", "[", "]", "l"]

// Shifted ones: redo, find previous, paste without formatting, and the element picker.
const pageShiftKeys = ["z", "g", "v", "c"]

// Moving and selecting by word or line in a text field, and the zoom keys the pane answers.
const pageAnyKeys = [
  "arrowleft",
  "arrowright",
  "arrowup",
  "arrowdown",
  "backspace",
  "delete",
  "home",
  "end",
  "=",
  "plus",
  "-",
  "0",
]

// Keys a keybind names in words, since its syntax joins keys with "+" and lists chords with ",".
const keyNames = [
  [",", "comma"],
  ["+", "plus"],
  [" ", "space"],
]

/**
 * Whether a key press in a page runs one of the app's keybinds instead, so main hands it to the app. Only chords with
 * Control or Command qualify: typing, Alt characters and Tab stay with the page, as do the editing, find, reload and
 * history chords the page answers itself, even when a keybind uses one.
 *
 * @param mac - Whether the platform modifier is Command (macOS) rather than Control.
 */
export function appShortcut(input: PageKey, chords: readonly KeyChord[], mac: boolean) {
  if (!input.control && !input.meta) return false
  const key = chordKey(input)

  if (pageOwned(key, input, mac)) return false

  return chords.some(
    (chord) =>
      chord.key === key &&
      chord.ctrl === input.control &&
      chord.meta === input.meta &&
      chord.shift === input.shift &&
      chord.alt === input.alt,
  )
}

/** The key as the app names it in a keybind, as its keydown handler reads a KeyboardEvent. */
function chordKey(input: PageKey) {
  const key = keyNames.find((name) => name[0] === input.key)?.[1] ?? input.key.toLowerCase()

  if (!input.alt || /^[a-z0-9]$/.test(key)) return key

  if (!input.code.startsWith("Key") || input.code.length !== 4) return key

  return input.code.slice(3).toLowerCase()
}

function pageOwned(key: string, input: PageKey, mac: boolean) {
  // macOS text fields move and edit with Control and a letter, as in Emacs.
  if (mac && input.control && !input.meta && !input.alt && /^[a-z]$/.test(key)) return true
  const mod = mac ? input.meta && !input.control : input.control && !input.meta

  if (!mod || input.alt) return false

  if (pageAnyKeys.includes(key)) return true

  if (input.shift) return pageShiftKeys.includes(key)

  // Ctrl+Y redoes outside macOS.
  return pageKeys.includes(key) || (!mac && key === "y")
}

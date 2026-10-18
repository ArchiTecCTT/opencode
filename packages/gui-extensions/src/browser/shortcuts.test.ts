import { expect, test } from "bun:test"
import { appShortcut, type PageKey } from "./shortcuts"

/** A key press with `mod` as the platform's modifier: Command on macOS, Control elsewhere. */
const press = (modifiers: string, key: string, mac: boolean, code = ""): PageKey => {
  const held = modifiers.split("+")
  const mod = held.includes("mod")

  return {
    key,
    code,
    control: held.includes("ctrl") || (mod && !mac),
    meta: mod && mac,
    shift: held.includes("shift"),
    alt: held.includes("alt"),
  }
}

test("a page hands the app its keybinds and keeps typing, editing, find, reload and history", () => {
  // [modifiers, Input.key, the key as the app's keybind names it, macOS, whether the app runs it]. Every press is also
  // registered as an app keybind, so only the page's ownership keeps it in the page.
  const cases: [modifiers: string, key: string, chord: string, mac: boolean, app: boolean, code?: string][] = [
    // App keybinds.
    ["mod+shift", "R", "r", true, true],
    ["mod+shift", "R", "r", false, true],
    ["mod", "k", "k", true, true],
    ["mod", "k", "k", false, true],
    ["mod", "w", "w", true, true],
    ["mod", "t", "t", true, true],
    ["mod", "1", "1", true, true],
    ["mod", ",", "comma", true, true],
    ["mod", "\\", "\\", false, true],
    ["mod+shift", "L", "l", true, true],
    ["mod+alt", "ArrowLeft", "arrowleft", true, true],
    ["mod+alt", "®", "r", true, true, "KeyR"],
    ["ctrl", "`", "`", true, true],
    ["ctrl", "Tab", "tab", true, true],
    // Clipboard, select all, undo and redo.
    ["mod", "c", "c", true, false],
    ["mod", "x", "x", true, false],
    ["mod", "v", "v", true, false],
    ["mod+shift", "V", "v", true, false],
    ["mod", "a", "a", true, false],
    ["mod", "z", "z", true, false],
    ["mod+shift", "Z", "z", true, false],
    ["mod", "c", "c", false, false],
    ["mod", "x", "x", false, false],
    ["mod", "v", "v", false, false],
    ["mod", "a", "a", false, false],
    ["mod", "z", "z", false, false],
    ["mod", "y", "y", false, false],
    ["mod+shift", "Z", "z", false, false],
    // Find, reload and history.
    ["mod", "f", "f", true, false],
    ["mod", "f", "f", false, false],
    ["mod", "g", "g", true, false],
    ["mod+shift", "G", "g", true, false],
    ["mod", "r", "r", true, false],
    ["mod", "r", "r", false, false],
    ["mod", "[", "[", true, false],
    ["mod", "]", "]", true, false],
    // The pane's own address, element picker and zoom keys.
    ["mod", "l", "l", true, false],
    ["mod", "l", "l", false, false],
    ["mod+shift", "C", "c", true, false],
    ["mod", "=", "=", true, false],
    ["mod+shift", "+", "plus", true, false],
    ["mod", "-", "-", true, false],
    ["mod", "0", "0", false, false],
    // Moving and selecting in a text field.
    ["mod", "ArrowLeft", "arrowleft", true, false],
    ["mod+shift", "ArrowRight", "arrowright", false, false],
    ["mod", "Backspace", "backspace", false, false],
    // macOS moves the caret with Control and a letter.
    ["ctrl", "b", "b", true, false],
    ["ctrl+shift", "E", "e", true, false],
    // Typing, Alt characters and Tab.
    ["", "k", "k", true, false],
    ["shift", "K", "k", true, false],
    ["alt", "ArrowUp", "arrowup", true, false],
    ["alt", "ArrowUp", "arrowup", false, false],
    ["shift", "Tab", "tab", true, false],
  ]

  const results = cases.map(([modifiers, key, chord, mac, , code]) => {
    const input = press(modifiers, key, mac, code)
    const registered = { key: chord, ctrl: input.control, meta: input.meta, shift: input.shift, alt: input.alt }

    return [modifiers, key, mac, appShortcut(input, [registered], mac)]
  })

  expect(results).toEqual(cases.map(([modifiers, key, , mac, app]) => [modifiers, key, mac, app]))
})

test("a page keeps a chord the app binds with other modifiers or not at all", () => {
  const chords = [{ key: "r", ctrl: false, meta: true, shift: true, alt: false }]

  expect(appShortcut(press("mod+shift", "R", true), chords, true)).toBe(true)
  expect(appShortcut(press("mod+shift", "R", false), chords, false)).toBe(false)
  expect(appShortcut(press("mod+shift+alt", "‰", true, "KeyR"), chords, true)).toBe(false)
  expect(appShortcut(press("mod", "k", true), chords, true)).toBe(false)
  expect(appShortcut(press("mod+shift", "R", true), [], true)).toBe(false)
})

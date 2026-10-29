import assert from "node:assert/strict";
import test from "node:test";
import { ZOOM_KEYS, isTextEntry, zoomedView } from "../src/keyzoom.ts";

test("the point under the mouse stays put while zooming", () => {
  const view = zoomedView(100, 200, 0.25, 0.5);
  assert.deepEqual(view, { start: 112.5, end: 162.5 });
  assert.equal(view.start + (view.end - view.start) * 0.25, 125);
  assert.deepEqual(zoomedView(0, 10, 1, 2), { start: -10, end: 10 });
});

test("W zooms in and S zooms out", () => {
  assert.equal(ZOOM_KEYS.w, -1);
  assert.equal(ZOOM_KEYS.s, 1);
});

test("typing in a field is not a shortcut", () => {
  assert.equal(isTextEntry(null), false);
  assert.equal(isTextEntry({ closest: () => ({}) }), true);
  assert.equal(isTextEntry({ closest: () => null }), false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { overlapDuration, summarizeKernels } from "../src/breakdown.ts";

const trace = {
  durationMs: 20,
  names: { 1: "matmul", 2: "matmul", 3: "reduce" },
  kernels: [
    { startMs: 0, endMs: 8, deviceId: 0, nameId: 1 },
    { startMs: 4, endMs: 10, deviceId: 1, nameId: 2 },
    { startMs: 8, endMs: 12, deviceId: 0, nameId: 3 },
    { startMs: 15, endMs: 20, deviceId: 0, nameId: 1 },
  ],
};

test("clips crossing kernels and groups exact names without double-counting wall coverage", () => {
  const result = summarizeKernels(trace, "all", { start: 5, end: 10 });
  assert.equal(result.totalGpuMs, 10);
  assert.deepEqual(result.rows.map(({ name, count, gpuMs, wallMs }) =>
    ({ name, count, gpuMs, wallMs })), [
    { name: "matmul", count: 2, gpuMs: 8, wallMs: 5 },
    { name: "reduce", count: 1, gpuMs: 2, wallMs: 2 },
  ]);
});

test("device filtering uses the same span and excludes boundary-only contact", () => {
  const result = summarizeKernels(trace, "0", { start: 8, end: 15 });
  assert.equal(result.totalGpuMs, 4);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].name, "reduce");
  assert.equal(result.rows[0].count, 1);
});

test("empty and zero-width spans produce no calls or time", () => {
  for (const span of [{ start: 12, end: 15 }, { start: 7, end: 7 }]) {
    assert.deepEqual(summarizeKernels(trace, "all", span), { rows: [], totalGpuMs: 0 });
  }
  assert.equal(overlapDuration(trace.kernels[0], { start: 8, end: 10 }), 0);
});

test("the full trace retains summed GPU time and union coverage", () => {
  const result = summarizeKernels(trace, "all", { start: 0, end: 20 });
  assert.equal(result.totalGpuMs, 23);
  assert.equal(result.rows[0].count, 3);
  assert.equal(result.rows[0].gpuMs, 19);
  assert.equal(result.rows[0].wallMs, 15);
});

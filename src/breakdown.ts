import type { KernelEvent, TraceData } from "./types";

export interface TimeSpan {
  start: number;
  end: number;
}

export interface KernelSummary {
  name: string;
  count: number;
  gpuMs: number;
  wallMs: number;
  lastEndMs: number;
}

export function overlapDuration(kernel: KernelEvent, span: TimeSpan): number {
  return Math.max(0, Math.min(kernel.endMs, span.end) - Math.max(kernel.startMs, span.start));
}

export function summarizeKernels(trace: TraceData, device: string, span: TimeSpan) {
  const byName = new Map<string, KernelSummary>();
  let totalGpuMs = 0;
  // The parser returns kernels in start-time order, so union coverage can be
  // accumulated without sorting or double-counting simultaneous launches.
  for (const kernel of trace.kernels) {
    if (kernel.startMs >= span.end) break;
    if (device !== "all" && kernel.deviceId !== Number(device)) continue;
    const duration = overlapDuration(kernel, span);
    if (duration <= 0) continue;
    const name = trace.names[kernel.nameId] ?? "Unknown kernel";
    let row = byName.get(name);
    if (!row) {
      row = { name, count: 0, gpuMs: 0, wallMs: 0, lastEndMs: -Infinity };
      byName.set(name, row);
    }
    row.count++;
    row.gpuMs += duration;
    totalGpuMs += duration;
    const start = Math.max(kernel.startMs, span.start);
    const end = Math.min(kernel.endMs, span.end);
    if (end > row.lastEndMs) {
      row.wallMs += Math.max(0, end - Math.max(start, row.lastEndMs));
      row.lastEndMs = end;
    }
  }
  return { rows: [...byName.values()], totalGpuMs };
}

/** Zoom keys of Perfetto and chrome://tracing: hold W to zoom in, S to zoom out. */
export const ZOOM_KEYS: Record<string, -1 | 1> = { w: -1, s: 1 };

/** Span factor per millisecond held: about 12x per second. */
export const ZOOM_RATE_PER_MS = 0.0025;

/**
 * The view after zooming by `factor` around the point at `anchorFraction` (0 = left edge,
 * 1 = right edge) of [start, end]: that point stays where it is on screen.
 */
export function zoomedView(start: number, end: number, anchorFraction: number,
  factor: number): { start: number; end: number } {
  const span = end - start;
  const anchor = start + span * anchorFraction;
  const next = span * factor;
  return { start: anchor - next * anchorFraction, end: anchor - next * anchorFraction + next };
}

/** True when keys typed into this target should not drive the timeline. */
export function isTextEntry(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== "function") return false;
  return !!(target as Element).closest("input, textarea, select, [contenteditable]");
}

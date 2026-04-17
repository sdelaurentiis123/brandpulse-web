// Compute a tight y-axis domain for a series of values.
// - Pads ~20% on each side (min 5 units).
// - Always shows at least a ±10 window so tiny ranges don't look flat.
// - Clamps to [absMin, absMax] (BPX scores live in [-100, 100]).
export function niceDomain(
  values: Array<number | null | undefined>,
  opts: { absMin?: number; absMax?: number; minWindow?: number } = {}
): [number, number] {
  const { absMin = -100, absMax = 100, minWindow = 20 } = opts;
  const clean = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (clean.length === 0) return [-10, 10];

  const lo = Math.min(...clean);
  const hi = Math.max(...clean);
  const pad = Math.max(5, (hi - lo) * 0.2);
  let low = Math.floor(lo - pad);
  let high = Math.ceil(hi + pad);

  if (high - low < minWindow) {
    const mid = (high + low) / 2;
    low = Math.floor(mid - minWindow / 2);
    high = Math.ceil(mid + minWindow / 2);
  }
  return [Math.max(absMin, low), Math.min(absMax, high)];
}

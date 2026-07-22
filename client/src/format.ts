/** Compact probability display: 34%, 3.4%, 0.42%. */
export function fmtLikelihood(p: number): string {
  const pct = p * 100;
  if (pct >= 99.5) return "100%";
  if (pct >= 10) return `${Math.round(pct)}%`;
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(2)}%`;
}

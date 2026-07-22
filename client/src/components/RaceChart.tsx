import { useMemo, useRef, useState } from "react";

/** The subset of GameDetail the chart needs; the live watch board synthesizes it. */
export interface RaceData {
  players: Array<{ playerId: number; name: string; seatOrder: number }>;
  turns: Array<{ playerId: number; banked: number; penalty: number }>;
}

interface Series {
  playerId: number;
  name: string;
  seatOrder: number;
  /** Cumulative score after each of the player's own turns; index 0 = start (0). */
  points: number[];
}

const W = 360;
const H = 220;
const M = { top: 10, right: 74, bottom: 26, left: 46 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

function niceStep(rough: number): number {
  const pow = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= rough) return m * pow;
  }
  return 10 * pow;
}

export default function RaceChart({ detail }: { detail: RaceData }) {
  const series = useMemo<Series[]>(() => {
    const byPlayer = new Map<number, Series>(
      detail.players.map((p) => [
        p.playerId,
        { playerId: p.playerId, name: p.name, seatOrder: p.seatOrder, points: [0] }
      ])
    );
    for (const turn of detail.turns) {
      const s = byPlayer.get(turn.playerId);
      if (!s) continue;
      const prev = s.points.at(-1) ?? 0;
      s.points.push(Math.max(0, prev + turn.banked - turn.penalty));
    }
    return [...byPlayer.values()].sort((a, b) => a.seatOrder - b.seatOrder);
  }, [detail]);

  const maxRounds = Math.max(...series.map((s) => s.points.length - 1), 1);
  const maxScore = Math.max(...series.map((s) => Math.max(...s.points)), 1);
  const yStep = niceStep(maxScore / 4);
  const yMax = Math.ceil(maxScore / yStep) * yStep;

  const x = (round: number) => M.left + (round / maxRounds) * PLOT_W;
  const y = (score: number) => M.top + PLOT_H - (score / yMax) * PLOT_H;

  const [hoverRound, setHoverRound] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const round = Math.round(((px - M.left) / PLOT_W) * maxRounds);
    setHoverRound(round >= 0 && round <= maxRounds ? round : null);
  }

  const yTicks: number[] = [];
  for (let v = 0; v <= yMax; v += yStep) yTicks.push(v);
  const direct = series.length <= 4;

  // Direct labels collide when players finish tied or close; spread them
  // to a minimum gap, then push back up if the stack ran past the bottom.
  const LABEL_GAP = 11;
  const labelYs = new Map<number, number>();
  if (direct) {
    const sorted = series
      .map((s) => ({ id: s.playerId, y: y(s.points.at(-1) ?? 0) + 3 }))
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      if (cur.y - prev.y < LABEL_GAP) cur.y = prev.y + LABEL_GAP;
    }
    for (let i = sorted.length - 1; i >= 0; i--) {
      const cap = i === sorted.length - 1 ? H - 4 : sorted[i + 1]!.y - LABEL_GAP;
      const cur = sorted[i]!;
      if (cur.y > cap) cur.y = cap;
    }
    for (const l of sorted) labelYs.set(l.id, l.y);
  }

  return (
    <div className="race-chart">
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.playerId} className="legend-item">
            <i className={`series-dot s${s.seatOrder + 1}`} />
            {s.name}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Cumulative score by round"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverRound(null)}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line
              className="chart-grid"
              x1={M.left}
              x2={W - M.right}
              y1={y(v)}
              y2={y(v)}
            />
            <text className="chart-tick" x={M.left - 6} y={y(v) + 3} textAnchor="end">
              {v >= 1000 ? `${v / 1000}k` : v}
            </text>
          </g>
        ))}
        <line
          className="chart-axis"
          x1={M.left}
          x2={W - M.right}
          y1={y(0)}
          y2={y(0)}
        />
        <text
          className="chart-tick"
          x={M.left + PLOT_W / 2}
          y={H - 6}
          textAnchor="middle"
        >
          round
        </text>

        {hoverRound != null && (
          <line
            className="chart-crosshair"
            x1={x(hoverRound)}
            x2={x(hoverRound)}
            y1={M.top}
            y2={M.top + PLOT_H}
          />
        )}

        {series.map((s) => {
          const path = s.points
            .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
            .join(" ");
          const lastIdx = s.points.length - 1;
          return (
            <g key={s.playerId} className={`series s${s.seatOrder + 1}`}>
              <path className="series-line" d={path} />
              {hoverRound != null && hoverRound <= lastIdx && (
                <circle
                  className="series-marker"
                  cx={x(hoverRound)}
                  cy={y(s.points[hoverRound] ?? 0)}
                  r={4}
                />
              )}
              <circle className="series-marker" cx={x(lastIdx)} cy={y(s.points[lastIdx] ?? 0)} r={3} />
              {direct && (
                <text
                  className="series-label"
                  x={x(lastIdx) + 6}
                  y={labelYs.get(s.playerId) ?? y(s.points[lastIdx] ?? 0) + 3}
                >
                  {s.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoverRound != null && (
        <div className="chart-tooltip" role="status">
          <strong>Round {hoverRound}</strong>
          {series
            .filter((s) => hoverRound <= s.points.length - 1)
            .map((s) => (
              <span key={s.playerId} className="tooltip-row">
                <i className={`series-dot s${s.seatOrder + 1}`} />
                {s.name}: {(s.points[hoverRound] ?? 0).toLocaleString()}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

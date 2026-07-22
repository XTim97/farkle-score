/**
 * Looping confetti field from the v3 mockup. The parent element needs
 * position:relative and overflow:hidden; pieces span its full width.
 */
const PIECES = [
  { left: 6, w: 10, h: 14, dur: 3.1, delay: 0, color: "var(--primary)" },
  { left: 16, w: 9, h: 13, dur: 2.6, delay: 0.7, color: "var(--accent)" },
  { left: 26, w: 11, h: 15, dur: 3.4, delay: 0.3, color: "var(--info)" },
  { left: 36, w: 9, h: 12, dur: 2.8, delay: 1.2, color: "var(--danger)" },
  { left: 46, w: 10, h: 14, dur: 3.0, delay: 0.5, color: "var(--series-5)" },
  { left: 56, w: 9, h: 13, dur: 2.5, delay: 1.6, color: "var(--accent)" },
  { left: 66, w: 11, h: 15, dur: 3.3, delay: 0.9, color: "var(--primary)" },
  { left: 76, w: 10, h: 13, dur: 2.7, delay: 0.2, color: "var(--info)" },
  { left: 86, w: 9, h: 14, dur: 3.2, delay: 1.4, color: "var(--series-5)" },
  { left: 94, w: 10, h: 13, dur: 2.9, delay: 0.6, color: "var(--danger)" }
];

export default function ConfettiField() {
  return (
    <>
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-loop"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.h,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </>
  );
}

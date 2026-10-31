import type { CSSProperties } from "react";

function Snowflake() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" focusable="false">
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 16 16)`}>
          <path d="M16 2v28M11 6l5 5 5-5M11 26l5-5 5 5" />
        </g>
      ))}
    </svg>
  );
}

/** Deterministic server markup; only CSS transforms animate the particles. */
export function ChristmasEffects() {
  return (
    <>
      <div className="christmas-snow" aria-hidden="true">
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} className={`snow-particle ${i % 4 === 0 ? "snow-crystal" : "snow-dot"}`} style={{
            "--x": `${(i * 37 + 2) % 100}%`,
            "--size": `${i % 4 === 0 ? 16 + i % 13 : 3 + i % 5}px`,
            "--duration": `${14 + i % 15}s`,
            "--delay": `${-((i * 3.7) % 29)}s`,
            "--drift": `${i % 2 ? -65 : 85}px`,
          } as CSSProperties}>
            {i % 4 === 0 && <Snowflake />}
          </span>
        ))}
      </div>
      <div className="christmas-lights" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <span className="light-drop" key={i} style={{
            "--bulb": ["#ffe0a0", "#eb797b", "#89d6b1", "#ffe0a0"][i % 4],
            "--delay": `${-(i % 5) * 0.7}s`,
            "--drop": `${10 + (i % 3) * 7}px`,
          } as CSSProperties}><i /></span>
        ))}
      </div>
    </>
  );
}

export function ChristmasRecord() {
  return (
    <span className="vinyl-record" aria-hidden="true">
      <svg className="vinyl-label" viewBox="0 0 100 100" focusable="false">
        <circle cx="50" cy="50" r="48" fill="#163e33" stroke="#e6c689" strokeWidth="2" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#aa955f" />
        <path d="m50 17 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="#f5d78c" />
        <path d="m50 33 18 23h-9l16 19H25l16-19h-9Z" fill="#91bca0" />
        <path d="M46 75h8v9h-8" fill="#e6c689" />
        <circle cx="42" cy="59" r="3" fill="#b63746" /><circle cx="58" cy="69" r="3" fill="#b63746" />
        <circle cx="50" cy="50" r="3.5" fill="#f5d78c" />
      </svg>
    </span>
  );
}

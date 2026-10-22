import type { CSSProperties } from "react";

/** Decorative SVGs animated by CSS; no timers or per-frame React updates. */
export function HalloweenVisitors() {
  return (
    <div className="halloween-visitors" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          className="ghost-pass"
          key={index}
          style={
            {
              "--ghost-left": `${8 + index * 30}%`,
              "--ghost-top": `${24 + index * 22}%`,
              "--ghost-size": `${64 + index * 14}px`,
              "--ghost-duration": `${34 + index * 7}s`,
              "--ghost-delay": `${2 + index * 9}s`,
              "--ghost-drift": index % 2 ? "-28vw" : "30vw",
            } as CSSProperties
          }
        >
          <svg className="ghost-shape" viewBox="0 0 90 110" focusable="false">
            <defs>
              <linearGradient id={`ghost-mist-${index}`} x2="0" y2="1">
                <stop stopColor="#effff8" stopOpacity=".95" />
                <stop offset="1" stopColor="#c2d9e2" stopOpacity=".15" />
              </linearGradient>
            </defs>
            <path
              d="M15 45C15 3 75 3 75 45c0 22 3 33 10 48-13 1-17-9-22-5-6 5-9 17-19 10-7-6-10-12-16-7-9 7-16 9-23 3 8-16 10-30 10-49Z"
              fill={`url(#ghost-mist-${index})`}
              stroke="#c6e1dd"
              strokeOpacity=".4"
            />
            <ellipse cx="33" cy="44" rx="5" ry="8" fill="#283b42" />
            <ellipse cx="57" cy="44" rx="5" ry="8" fill="#283b42" />
            <ellipse cx="45" cy="65" rx="5" ry="7" fill="#36484d" />
          </svg>
        </span>
      ))}
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={`bat-pass${index > 2 ? " bat-pass-reverse" : ""}`}
          style={
            {
              "--bat-top": `${14 + index * 13}%`,
              "--bat-size": `${42 + (index % 3) * 12}px`,
              "--bat-delay": `${index < 3 ? 5 + index * 0.65 : 21 + (index - 3) * 0.8}s`,
            } as CSSProperties
          }
        >
          <svg className="bat-shape" viewBox="0 0 120 60" focusable="false">
            <g fill="#251d2b" stroke="#987855" strokeWidth=".8">
              <path
                className="bat-wing"
                d="M60 26C42 12 22 12 3 3c6 12 4 23-1 30 12-6 18-4 22 5 9-5 16-2 19 8 7-7 12-6 17-5Z"
              />
              <g transform="translate(120 0) scale(-1 1)">
                <path
                  className="bat-wing"
                  d="M60 26C42 12 22 12 3 3c6 12 4 23-1 30 12-6 18-4 22 5 9-5 16-2 19 8 7-7 12-6 17-5Z"
                />
              </g>
              <path d="m54 24-2-13 8 7 8-7-2 13c9 9 5 22-6 29-11-7-15-20-6-29Z" />
            </g>
            <g fill="#f3b464">
              <circle cx="57" cy="28" r="1.4" />
              <circle cx="63" cy="28" r="1.4" />
            </g>
          </svg>
        </span>
      ))}
    </div>
  );
}

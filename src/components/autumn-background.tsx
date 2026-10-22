import type { CSSProperties } from "react";
import { HalloweenVisitors } from "./halloween-visitors";

const colors = ["#dc812d", "#ad451c", "#dba745", "#b66126"];

/** Static decoration: CSS animates a fixed number of leaves without React frames. */
export function AutumnBackground() {
  return (
    <>
      <div className="autumn-scene" aria-hidden="true">
        <div className="cottage-background" />
      </div>
      <div className="falling-leaves" aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => {
          const style = {
            "--leaf-x": `${(index * 37 + 4) % 104}%`,
            "--leaf-size": `${12 + (index % 5) * 5}px`,
            "--leaf-duration": `${15 + (index % 7) * 2}s`,
            "--leaf-delay": `${-((index * 7.3) % 29)}s`,
            "--leaf-drift": `${(index % 2 ? -1 : 1) * (70 + (index % 4) * 30)}px`,
            "--leaf-sway": `${3 + (index % 4)}s`,
            "--leaf-color": colors[index % colors.length],
            "--leaf-opacity": 0.5 + (index % 4) * 0.12,
          } as CSSProperties;
          return (
            <span className="falling-leaf" style={style} key={index}>
              <span className="leaf-sway">
                <svg
                  viewBox="0 0 48 56"
                  className="leaf-shape"
                  focusable="false"
                >
                  <path
                    fill="currentColor"
                    d={
                      index % 3 === 0
                        ? "M25 1C8 8 4 22 10 34c3 7 8 10 13 12 11-5 18-14 17-23C39 13 31 8 25 1Z"
                        : "m24 1 5 13 8-5-2 14 11-2-8 10 5 5-15 5-4 7-4-7-15-5 5-5L2 21l11 2-2-14 8 5Z"
                    }
                  />
                  <path
                    d="M24 12v42m0-23-9-9m9 15 11-11"
                    fill="none"
                    stroke="#693519"
                    strokeWidth="1.1"
                    opacity=".6"
                  />
                </svg>
              </span>
            </span>
          );
        })}
      </div>
      <HalloweenVisitors />
    </>
  );
}

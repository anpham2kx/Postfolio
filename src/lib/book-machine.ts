export type Direction = -1 | 1;
export type TurnPhase = "idle" | "dragging" | "settling";
export interface Turn {
  from: number;
  to: number;
  direction: Direction;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
export function spreadStart(anchor: number): number {
  return Math.floor(anchor / 2) * 2;
}
export function adjacentPage(
  anchor: number,
  direction: Direction,
  total: number,
): number {
  return clamp(spreadStart(anchor) + direction * 2, 0, spreadStart(total - 1));
}

/** Visit every intervening leaf/spread, retaining the exact requested reading page. */
export function turnPath(
  anchor: number,
  target: number,
  total: number,
): number[] {
  const destination = clamp(target, 0, total - 1);
  const start = spreadStart(anchor);
  const end = spreadStart(destination);
  if (start === end) return [destination];
  const step = end > start ? 2 : -2;
  const path: number[] = [];
  for (let page = start + step; page !== end; page += step) path.push(page);
  path.push(destination);
  return path;
}
export function gestureAxis(
  dx: number,
  dy: number,
): "pending" | "horizontal" | "vertical" {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return "pending";
  return Math.abs(dx) > Math.abs(dy) * 1.25 ? "horizontal" : "vertical";
}
export function shouldCommit(
  progress: number,
  velocity: number,
  distance: number,
): boolean {
  // Velocity is signed toward the target. An intentional reverse flick cancels.
  if (velocity < -0.35) return false;
  return progress >= 0.32 || (velocity > 0.55 && distance >= 24);
}

/** Synchronous lock: repeated input cannot create overlapping turn transactions. */
export class BookMachine {
  anchor = 0;
  phase: TurnPhase = "idle";
  turn: Turn | null = null;
  constructor(
    readonly total: number,
    initialPage = 0,
  ) {
    this.anchor = clamp(initialPage, 0, total - 1);
  }
  begin(
    direction: Direction,
    phase: "dragging" | "settling" = "settling",
    target?: number,
  ): Turn | null {
    if (this.phase !== "idle") return null;
    const from = spreadStart(this.anchor);
    const to =
      target === undefined
        ? adjacentPage(this.anchor, direction, this.total)
        : clamp(target, 0, this.total - 1);
    if (spreadStart(to) === from) {
      this.anchor = to;
      return null;
    }
    this.phase = phase;
    this.turn = { from, to, direction };
    return this.turn;
  }
  settle(): void {
    if (this.turn) this.phase = "settling";
  }
  finish(commit: boolean): void {
    if (commit && this.turn) this.anchor = this.turn.to;
    this.turn = null;
    this.phase = "idle";
  }
  focus(page: number): void {
    if (this.phase === "idle" && spreadStart(page) === spreadStart(this.anchor))
      this.anchor = page;
  }
}

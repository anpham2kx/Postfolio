export type Direction = -1 | 1;
export type PageMode = 1 | 2;
export type TurnPhase = "idle" | "dragging" | "settling";
export interface Turn {
  from: number;
  to: number;
  direction: Direction;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
export function spreadStart(anchor: number, mode: PageMode): number {
  return Math.floor(anchor / mode) * mode;
}
export function adjacentPage(
  anchor: number,
  direction: Direction,
  mode: PageMode,
  total: number,
): number {
  return clamp(
    spreadStart(anchor, mode) + direction * mode,
    0,
    Math.floor((total - 1) / mode) * mode,
  );
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
  mode: PageMode = 1;
  phase: TurnPhase = "idle";
  turn: Turn | null = null;
  constructor(readonly total: number) {}
  begin(
    direction: Direction,
    phase: "dragging" | "settling" = "settling",
    target?: number,
  ): Turn | null {
    if (this.phase !== "idle") return null;
    const from = spreadStart(this.anchor, this.mode);
    const to =
      target === undefined
        ? adjacentPage(this.anchor, direction, this.mode, this.total)
        : clamp(target, 0, this.total - 1);
    if (spreadStart(to, this.mode) === from) {
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
  resize(mode: PageMode): void {
    this.finish(false);
    this.mode = mode;
  }
  focus(page: number): void {
    if (
      this.phase === "idle" &&
      spreadStart(page, this.mode) === spreadStart(this.anchor, this.mode)
    )
      this.anchor = page;
  }
}

import { describe, expect, it } from "vitest";
import {
  adjacentPage,
  BookMachine,
  gestureAxis,
  shouldCommit,
  spreadStart,
} from "../../src/lib/book-machine";

describe("canonical reading position", () => {
  it("clamps at the first/last page in both layouts", () => {
    for (const mode of [1, 2] as const) {
      expect(adjacentPage(0, -1, mode, 8)).toBe(0);
      expect(adjacentPage(7, 1, mode, 8)).toBe(mode === 1 ? 7 : 6);
    }
  });
  it("preserves an odd reading page through repeated mode changes", () => {
    const book = new BookMachine(8);
    book.begin(1, "settling", 5);
    book.finish(true);
    for (let i = 0; i < 20; i++) {
      book.resize(2);
      expect(book.anchor).toBe(5);
      expect(spreadStart(book.anchor, 2)).toBe(4);
      book.resize(1);
      expect(book.anchor).toBe(5);
    }
  });
  it("tracks the right-hand leaf that is being read", () => {
    const book = new BookMachine(8);
    book.resize(2);
    book.focus(1);
    expect(book.anchor).toBe(1);
    book.focus(7);
    expect(book.anchor).toBe(1);
    book.resize(1);
    expect(book.anchor).toBe(1);
  });
  it("handles an odd total page count", () => {
    expect(adjacentPage(4, 1, 2, 7)).toBe(6);
    expect(adjacentPage(6, 1, 2, 7)).toBe(6);
  });
});
describe("turn transaction", () => {
  it("ignores overlapping directions and jumps, committing exactly once", () => {
    const book = new BookMachine(8);
    book.resize(2);
    expect(book.begin(1)?.to).toBe(2);
    for (let i = 0; i < 100; i++) {
      expect(book.begin(i % 2 ? 1 : -1, "settling", 7)).toBeNull();
    }
    book.finish(true);
    book.finish(true);
    expect(book.anchor).toBe(2);
    expect(book.phase).toBe("idle");
  });
  it("a cancelled drag never advances and next navigation still works", () => {
    const book = new BookMachine(8);
    book.begin(1, "dragging");
    book.settle();
    book.finish(false);
    expect(book.anchor).toBe(0);
    expect(book.phase).toBe("idle");
    book.begin(1);
    book.finish(true);
    expect(book.anchor).toBe(1);
  });
  it("resize cancels an in-flight turn without changing reading content", () => {
    const book = new BookMachine(8);
    book.begin(1, "settling", 3);
    book.finish(true);
    book.begin(1, "dragging");
    book.resize(2);
    expect(book.anchor).toBe(3);
    expect(book.turn).toBeNull();
    expect(book.phase).toBe("idle");
  });
  it("same-spread navigation changes the anchor without animating", () => {
    const book = new BookMachine(8);
    book.resize(2);
    expect(book.begin(1, "settling", 1)).toBeNull();
    expect(book.anchor).toBe(1);
    expect(book.phase).toBe("idle");
  });
  it("a long sequence stays ordered, bounded and unlocks after cancellation", () => {
    const book = new BookMachine(8);
    let seed = 23;
    for (let i = 0; i < 1000; i++) {
      seed = (seed * 16807) % 2147483647;
      const direction = seed % 2 ? 1 : -1;
      const from = book.anchor;
      const expected = adjacentPage(from, direction, book.mode, 8);
      book.begin(direction, "dragging");
      const commit = seed % 3 !== 0;
      book.finish(commit);
      expect(book.anchor).toBe(commit ? expected : from);
      expect(book.phase).toBe("idle");
      if (i % 10 === 0) book.resize(book.mode === 1 ? 2 : 1);
    }
  });
});
describe("gesture intent", () => {
  it.each([
    [4, 2, "pending"],
    [80, 9, "horizontal"],
    [10, 30, "vertical"],
    [20, 20, "vertical"],
  ] as const)("classifies %s / %s as %s", (x, y, expected) =>
    expect(gestureAxis(x, y)).toBe(expected),
  );
  it.each([
    [0.4, 0, 180, true],
    [0.1, 0.9, 40, true],
    [0.02, 2, 8, false],
    [0.12, 0, 40, false],
    [0.6, -0.8, 200, false],
  ] as const)(
    "commit decision %s / %s / %s",
    (progress, velocity, distance, expected) =>
      expect(shouldCommit(progress, velocity, distance)).toBe(expected),
  );
});

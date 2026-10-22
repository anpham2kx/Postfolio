import { describe, expect, it } from "vitest";
import {
  adjacentPage,
  BookMachine,
  gestureAxis,
  shouldCommit,
  spreadStart,
  turnPath,
} from "../../src/lib/book-machine";

describe("two-page reading and jump paths", () => {
  it("turns all three sheets to reach contact and returns in order", () => {
    expect(turnPath(1, 6, 8)).toEqual([2, 4, 6]);
    expect(turnPath(6, 1, 8)).toEqual([4, 2, 1]);
  });
  it("keeps the exact reading page when moving to the same spread", () => {
    expect(turnPath(2, 3, 8)).toEqual([3]);
    expect(turnPath(6, 7, 8)).toEqual([7]);
  });
  it("clamps jump destinations to the covers", () => {
    expect(turnPath(1, 99, 8)).toEqual([2, 4, 7]);
    expect(turnPath(5, -9, 8)).toEqual([2, 0]);
  });
  it("opens with the introduction beside the front cover", () => {
    const book = new BookMachine(8, 1);
    expect(book.anchor).toBe(1);
    expect(spreadStart(book.anchor)).toBe(0);
    expect(book.begin(-1)).toBeNull();
    expect(book.phase).toBe("idle");
  });
  it("stops at the front and back cover spreads", () => {
    expect(adjacentPage(1, -1, 8)).toBe(0);
    expect(adjacentPage(6, 1, 8)).toBe(6);
    expect(adjacentPage(7, 1, 8)).toBe(6);
  });
  it("tracks either visible leaf and ignores hidden pages", () => {
    const book = new BookMachine(8);
    book.focus(1);
    expect(book.anchor).toBe(1);
    book.focus(6);
    expect(book.anchor).toBe(1);
    book.focus(0);
    expect(book.anchor).toBe(0);
  });
  it("handles a trailing spread with an odd number of pages", () => {
    expect(adjacentPage(4, 1, 7)).toBe(6);
    expect(adjacentPage(6, 1, 7)).toBe(6);
  });
});
describe("turn transaction", () => {
  it("ignores overlapping directions and jumps, committing exactly once", () => {
    const book = new BookMachine(8);
    expect(book.begin(1)?.to).toBe(2);
    for (let i = 0; i < 100; i++)
      expect(book.begin(i % 2 ? 1 : -1, "settling", 6)).toBeNull();
    book.finish(true);
    book.finish(true);
    expect(book.anchor).toBe(2);
    expect(book.phase).toBe("idle");
  });
  it("a cancelled drag never advances and navigation remains usable", () => {
    const book = new BookMachine(8);
    book.begin(1, "dragging");
    book.settle();
    book.finish(false);
    expect(book.anchor).toBe(0);
    book.begin(1);
    book.finish(true);
    expect(book.anchor).toBe(2);
  });
  it("cancelling during resize keeps the last completed reading page", () => {
    const book = new BookMachine(8);
    book.begin(1, "settling", 3);
    book.finish(true);
    book.begin(1, "dragging");
    book.finish(false);
    expect(book.anchor).toBe(3);
    expect(book.turn).toBeNull();
    expect(book.phase).toBe("idle");
  });
  it("same-spread navigation changes the anchor without animating", () => {
    const book = new BookMachine(8);
    expect(book.begin(1, "settling", 1)).toBeNull();
    expect(book.anchor).toBe(1);
    expect(book.phase).toBe("idle");
  });
  it("a long sequence stays ordered and bounded after cancellation", () => {
    const book = new BookMachine(8);
    let seed = 23;
    for (let i = 0; i < 1000; i++) {
      seed = (seed * 16807) % 2147483647;
      const direction = seed % 2 ? 1 : -1;
      const from = book.anchor;
      const expected = adjacentPage(from, direction, 8);
      book.begin(direction, "dragging");
      const commit = seed % 3 !== 0;
      book.finish(commit);
      expect(book.anchor).toBe(commit ? expected : from);
      expect(book.phase).toBe("idle");
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

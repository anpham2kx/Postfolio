"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookMachine,
  clamp,
  gestureAxis,
  shouldCommit,
  spreadStart,
  turnPath,
  type Direction,
} from "@/lib/book-machine";

interface Gesture {
  id: number;
  x: number;
  y: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  progress: number;
  direction: Direction | null;
}

/** All frame updates go to DOM transforms. React renders only at transaction boundaries. */
export function useBook(total: number) {
  const rootRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef(new BookMachine(total, 1));
  const offsetsRef = useRef(new Map<number, number>());
  const navigateRef = useRef<(direction: Direction, target?: number) => void>(
    () => {},
  );
  const [snapshot, setSnapshot] = useState({
    anchor: 1,
    busy: false,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const machine = machineRef.current;
    const pages = Array.from(
      root.querySelectorAll<HTMLElement>(":scope > .book-page"),
    );
    const layer = root.querySelector<HTMLElement>(".turn-layer");
    if (!layer) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let gesture: Gesture | null = null;
    let frame = 0;
    let generation = 0;
    let disposed = false;
    let pendingPages: number[] = [];
    let multiTurn = false;
    let suppressDragClick = false;
    const offsets = offsetsRef.current;

    function publish() {
      if (!disposed)
        setSnapshot({
          anchor: machine.anchor,
          busy: machine.phase !== "idle",
        });
    }
    function updateScrollCues() {
      for (const page of pages) {
        if (page.hidden) continue;
        const content = page.querySelector<HTMLElement>(".page-content");
        if (content)
          page.dataset.more = String(
            content.scrollHeight - content.clientHeight - content.scrollTop >
              10,
          );
      }
    }
    function rememberScroll() {
      // Visibility/resize can run before the browser delivers its queued scroll event.
      for (const page of pages) {
        if (page.hidden) continue;
        const content = page.querySelector<HTMLElement>(".page-content");
        if (content) offsets.set(Number(page.dataset.page), content.scrollTop);
      }
    }
    function show(indices: number[]) {
      pages.forEach((page, index) => {
        const visible = indices.includes(index);
        page.hidden = !visible;
        page.inert = !visible;
        page.style.gridColumn = String((index % 2) + 1);
        page.dataset.side = index % 2 === 0 ? "left" : "right";
        if (visible) {
          const content = page.querySelector<HTMLElement>(".page-content");
          if (content) content.scrollTop = offsets.get(index) ?? 0;
        }
      });
      updateScrollCues();
    }
    function sync() {
      root!.dataset.phase = machine.phase;
      const start = spreadStart(machine.anchor);
      show([start, start + 1]);
      layer!.replaceChildren();
      layer!.hidden = true;
      publish();
    }
    function release() {
      const id = gesture?.id;
      gesture = null;
      if (id !== undefined && root!.hasPointerCapture(id))
        root!.releasePointerCapture(id);
    }
    function cancel() {
      rememberScroll();
      generation++;
      cancelAnimationFrame(frame);
      pendingPages = [];
      multiTurn = false;
      machine.finish(false);
      release();
      sync();
    }
    function clonePage(index: number, side: string) {
      const source = pages[index];
      const clone = source
        ? (source.cloneNode(true) as HTMLElement)
        : document.createElement("div");
      clone.hidden = false;
      clone.inert = true;
      clone.className = `turn-face ${side} ${source?.className.replace("book-page", "") ?? ""}`;
      clone.removeAttribute("id");
      clone
        .querySelectorAll("[id]")
        .forEach((node) => node.removeAttribute("id"));
      clone
        .querySelectorAll("[name]")
        .forEach((node) => node.removeAttribute("name"));
      clone
        .querySelectorAll("[autofocus]")
        .forEach((node) => node.removeAttribute("autofocus"));
      clone.setAttribute("aria-hidden", "true");
      return clone;
    }
    function prepare() {
      const turn = machine.turn;
      if (!turn) return;
      rememberScroll();
      const dest = spreadStart(turn.to);
      const forward = turn.direction === 1;
      const outgoing = turn.from + (forward ? 1 : 0);
      const back = dest + (forward ? 0 : 1);
      const sheet = document.createElement("div");
      sheet.className = "turn-sheet";
      sheet.append(
        clonePage(outgoing, "turn-front"),
        clonePage(back, "turn-back"),
      );
      layer!.replaceChildren(sheet);
      layer!.dataset.direction = forward ? "next" : "prev";
      layer!.hidden = false;
      // Keep the opposite old leaf, expose the destination beneath the turning leaf.
      show(forward ? [turn.from, dest + 1] : [dest, turn.from + 1]);
      [outgoing, back].forEach((index, face) => {
        const scroller =
          sheet.children[face]?.querySelector<HTMLElement>(".page-content");
        if (scroller) scroller.scrollTop = offsets.get(index) ?? 0;
      });
      root!.dataset.phase = machine.phase;
      publish();
    }
    function paint(progress: number) {
      const sheet = layer!.firstElementChild as HTMLElement | null;
      if (!sheet || !machine.turn) return;
      sheet.style.transform = `rotateY(${-machine.turn.direction * progress * 180}deg)`;
      sheet.style.setProperty(
        "--turn-shade",
        String(Math.sin(progress * Math.PI) * 0.16),
      );
    }

    function finish(commit: boolean, focus: boolean) {
      machine.finish(commit);
      const next = commit ? pendingPages.shift() : undefined;
      if (next !== undefined) {
        machine.begin(next > machine.anchor ? 1 : -1, "settling", next);
        prepare();
        paint(0);
        settle(true, 0, focus);
        return;
      }
      pendingPages = [];
      multiTurn = false;
      sync();
      if (focus && commit)
        pages[machine.anchor]?.focus({ preventScroll: true });
    }
    function settle(commit: boolean, from: number, focus = false) {
      machine.settle();
      root!.dataset.phase = machine.phase;
      publish();
      const token = ++generation;
      cancelAnimationFrame(frame);
      const target = commit ? 1 : 0;
      const duration = motion.matches
        ? 0
        : Math.max(110, Math.abs(target - from) * (multiTurn ? 320 : 480));
      if (duration === 0) {
        finish(commit, focus);
        return;
      }
      const start = performance.now();
      function tick(now: number) {
        if (token !== generation || disposed) return;
        const t = clamp((now - start) / duration, 0, 1);
        paint(from + (target - from) * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
        else finish(commit, focus);
      }
      frame = requestAnimationFrame(tick);
    }
    function navigate(direction: Direction, target?: number) {
      if (machine.phase !== "idle" || gesture) return;
      const path =
        target === undefined ? [] : turnPath(machine.anchor, target, total);
      const first = path.shift();
      const turnDirection =
        first === undefined ? direction : first > machine.anchor ? 1 : -1;
      if (!machine.begin(turnDirection, "settling", first)) {
        if (target !== undefined) {
          publish();
          pages[machine.anchor]?.focus({ preventScroll: true });
        }
        return;
      }
      pendingPages = path;
      multiTurn = path.length > 0;
      prepare();
      paint(0);
      settle(true, 0, true);
    }
    navigateRef.current = navigate;

    function down(event: PointerEvent) {
      if (event.isPrimary && event.button === 0) suppressDragClick = false;
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        machine.phase !== "idle" ||
        gesture
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest(
          "a, button, input, textarea, select, label, [contenteditable], [data-no-drag], [role='button'], [role='textbox'], [role='slider'], [role='combobox']",
        )
      )
        return;
      if (event.shiftKey) {
        // Firefox needs an initial caret for Shift-drag on a fresh document.
        // Once established, the browser extends the selection natively.
        const selection = window.getSelection();
        if (event.pointerType !== "touch" && selection?.rangeCount === 0) {
          const caret = document.caretPositionFromPoint?.(
            event.clientX,
            event.clientY,
          );
          if (caret && root!.contains(caret.offsetNode))
            selection.collapse(caret.offsetNode, caret.offset);
        }
        return;
      }
      // Keep native scrollbars usable, including when a mouse starts on the thumb.
      const scroller = target.closest<HTMLElement>(".page-content");
      if (scroller && scroller.offsetWidth > scroller.clientWidth) {
        const box = scroller.getBoundingClientRect();
        if (
          event.clientX >=
          box.left + scroller.clientLeft + scroller.clientWidth
        )
          return;
      }
      // The whole page can turn. Shift-drag and multi-click retain native text
      // selection. Do not prevent pointerdown: that would suppress mousedown,
      // including the click count needed to recognize double/triple clicks.
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        velocity: 0,
        progress: 0,
        direction: null,
      };
    }
    function selectText(event: MouseEvent) {
      if (!gesture || gesture.direction) return;
      if (event.detail > 1) release();
      // Stop native mouse selection capture before it starts. In Firefox it can
      // survive a resize when the release lands outside the resized viewport.
      // Shift and interactive controls never create a gesture, so stay native.
      else event.preventDefault();
    }
    function nativeDrag(event: DragEvent) {
      // Images and selected text otherwise start HTML drag-and-drop and cancel
      // the pointer stream before the page has a chance to follow the hand.
      if (gesture) event.preventDefault();
    }
    function dragClick(event: MouseEvent) {
      if (suppressDragClick && event.detail > 0) {
        suppressDragClick = false;
        event.preventDefault();
        event.stopPropagation();
      }
    }
    function move(event: PointerEvent) {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (event.pointerType !== "touch" && (event.buttons & 1) === 0) {
        cancel();
        return;
      }
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.direction) {
        const axis = gestureAxis(dx, dy);
        if (axis === "pending") return;
        if (axis === "vertical") {
          release();
          return;
        }
        const direction: Direction = dx < 0 ? 1 : -1;
        if (!machine.begin(direction, "dragging")) {
          release();
          return;
        }
        gesture.direction = direction;
        suppressDragClick = true;
        const selection = window.getSelection();
        if (selection?.anchorNode && root!.contains(selection.anchorNode))
          selection.removeAllRanges();
        root!.setPointerCapture(event.pointerId);
        prepare();
      }
      if (event.cancelable) event.preventDefault();
      const elapsed = event.timeStamp - gesture.lastTime;
      if (elapsed > 0)
        gesture.velocity =
          (-(event.clientX - gesture.lastX) * gesture.direction) / elapsed;
      gesture.lastX = event.clientX;
      gesture.lastTime = event.timeStamp;
      const distance = -dx * gesture.direction;
      const width = root!.clientWidth / 2;
      gesture.progress = clamp(distance / Math.max(width * 0.8, 1), 0, 1);
      cancelAnimationFrame(frame);
      const progress = gesture.progress;
      frame = requestAnimationFrame(() => paint(progress));
    }
    function up(event: PointerEvent) {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (!gesture.direction) {
        release();
        return;
      }
      const { progress, velocity, lastTime, direction, x } = gesture;
      const recentVelocity = event.timeStamp - lastTime > 100 ? 0 : velocity;
      const commit = shouldCommit(
        progress,
        recentVelocity,
        -(event.clientX - x) * direction,
      );
      // Clear before releasing capture, so lostpointercapture cannot cancel a settling turn.
      release();
      settle(commit, progress);
    }
    function pointerCancel(event: PointerEvent) {
      // Touch has implicit capture on its initial target. Transferring it to the
      // stable book root emits lostpointercapture on that old target; ignore it.
      if (
        event.type === "lostpointercapture" &&
        (event.target !== root || root!.hasPointerCapture(event.pointerId))
      )
        return;
      if (gesture?.id === event.pointerId) cancel();
    }
    function key(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        !event.isComposing &&
        (machine.phase !== "idle" || gesture)
      ) {
        event.preventDefault();
        cancel();
        return;
      }
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.isComposing
      )
        return;
      if (
        target instanceof Element &&
        target.closest(
          "input, textarea, select, [contenteditable], [role='textbox'], [role='slider'], [role='combobox']",
        )
      )
        return;
      if (window.getSelection()?.toString().trim()) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        if (!event.repeat) navigate(event.key === "ArrowRight" ? 1 : -1);
      }
    }
    function track(event: Event) {
      const element = event.target;
      if (!(element instanceof Element)) return;
      const page = element.closest<HTMLElement>(".book-page");
      if (!page) return;
      const index = Number(page.dataset.page);
      if (page.hidden) return;
      if (event.type === "scroll") offsets.set(index, element.scrollTop);
      updateScrollCues();
      const before = machine.anchor;
      machine.focus(index);
      if (before !== machine.anchor) publish();
    }
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[data-book-page]");
      if (
        !link ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      const target = Number(link.dataset.bookPage);
      navigate(target >= machine.anchor ? 1 : -1, target);
    }
    let previousWidth = -1;
    let previousHeight = -1;
    function resize() {
      const width = root!.clientWidth;
      const height = root!.clientHeight;
      if (width === previousWidth && height === previousHeight) return;
      previousWidth = width;
      previousHeight = height;
      cancel();
      // Keep focus on the actual reading page, if a hidden leaf held focus.
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest(".book-page[hidden]"))
        pages[machine.anchor]?.focus({ preventScroll: true });
    }
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    const contentObserver = new ResizeObserver(updateScrollCues);
    pages.forEach((page) => {
      const inner = page.querySelector(".page-inner");
      if (inner) contentObserver.observe(inner);
    });
    root.dataset.ready = "true";
    resize();
    root.addEventListener("pointerdown", down);
    root.addEventListener("mousedown", selectText);
    root.addEventListener("dragstart", nativeDrag);
    root.addEventListener("click", dragClick, true);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", pointerCancel);
    root.addEventListener("lostpointercapture", pointerCancel);
    root.addEventListener("focusin", track);
    root.addEventListener("pointerdown", track);
    root.addEventListener("scroll", track, true);
    root.addEventListener("click", click);
    window.addEventListener("keydown", key);
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", resize);
    const visibility = () => {
      if (document.hidden) cancel();
    };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", cancel);
    return () => {
      disposed = true;
      cancel();
      observer.disconnect();
      contentObserver.disconnect();
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("mousedown", selectText);
      root.removeEventListener("dragstart", nativeDrag);
      root.removeEventListener("click", dragClick, true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", pointerCancel);
      root.removeEventListener("lostpointercapture", pointerCancel);
      root.removeEventListener("focusin", track);
      root.removeEventListener("pointerdown", track);
      root.removeEventListener("scroll", track, true);
      root.removeEventListener("click", click);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", cancel);
    };
  }, [total]);

  const navigate = useCallback(
    (direction: Direction, target?: number) =>
      navigateRef.current(direction, target),
    [],
  );
  return { rootRef, snapshot, navigate };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookMachine,
  clamp,
  gestureAxis,
  shouldCommit,
  spreadStart,
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
export function useBook(total: number, simple: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef(new BookMachine(total));
  const offsetsRef = useRef(new Map<number, number>());
  const navigateRef = useRef<(direction: Direction, target?: number) => void>(
    () => {},
  );
  const [snapshot, setSnapshot] = useState({
    anchor: 0,
    mode: 1 as 1 | 2,
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
    const offsets = offsetsRef.current;
    const flat = simple || !CSS.supports("transform-style", "preserve-3d");
    root.dataset.simple = String(flat);

    function publish() {
      if (!disposed)
        setSnapshot({
          anchor: machine.anchor,
          mode: machine.mode,
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
    function show(indices: number[]) {
      pages.forEach((page, index) => {
        const visible = indices.includes(index);
        page.hidden = !visible;
        page.inert = !visible;
        page.style.gridColumn =
          machine.mode === 2 ? String((index % 2) + 1) : "1";
        page.dataset.side =
          machine.mode === 2 && index % 2 === 0 ? "left" : "right";
        if (visible) {
          const content = page.querySelector<HTMLElement>(".page-content");
          if (content) content.scrollTop = offsets.get(index) ?? 0;
        }
      });
      updateScrollCues();
    }
    function sync() {
      root!.dataset.mode = String(machine.mode);
      root!.dataset.phase = machine.phase;
      const start = spreadStart(machine.anchor, machine.mode);
      show(machine.mode === 2 ? [start, start + 1] : [start]);
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
      generation++;
      cancelAnimationFrame(frame);
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
      const dest = spreadStart(turn.to, machine.mode);
      const forward = turn.direction === 1;
      const outgoing = turn.from + (machine.mode === 2 && forward ? 1 : 0);
      const back = dest + (machine.mode === 2 && !forward ? 1 : 0);
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
      show(
        machine.mode === 2 && !flat
          ? forward
            ? [turn.from, dest + 1]
            : [dest, turn.from + 1]
          : machine.mode === 2
            ? [dest, dest + 1]
            : [dest],
      );
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
      if (flat) {
        sheet.style.transform = `translateX(${-machine.turn.direction * progress * 24}px)`;
        sheet.style.opacity = String(1 - progress);
      } else {
        sheet.style.transform = `rotateY(${-machine.turn.direction * progress * 180}deg)`;
        sheet.style.setProperty(
          "--turn-shade",
          String(Math.sin(progress * Math.PI) * 0.16),
        );
      }
    }
    function finish(commit: boolean, focus: boolean) {
      machine.finish(commit);
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
        : Math.max(110, Math.abs(target - from) * (flat ? 180 : 480));
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
      if (!machine.begin(direction, "settling", target)) {
        if (target !== undefined) {
          publish();
          pages[machine.anchor]?.focus({ preventScroll: true });
        }
        return;
      }
      prepare();
      paint(0);
      settle(true, 0, true);
    }
    navigateRef.current = navigate;

    function down(event: PointerEvent) {
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        machine.phase !== "idle" ||
        gesture
      )
        return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest(
          "a, button, input, textarea, select, label, [contenteditable], [data-no-drag]",
        )
      )
        return;
      // Mouse/pen use a dedicated margin. Text selection on the paper stays native.
      if (
        event.pointerType !== "touch" &&
        !target.closest("[data-drag-handle]")
      )
        return;
      if (window.getSelection()?.toString().trim()) return;
      // WebKit can start a native text selection from a margin while the leaf
      // beneath it changes. Only the dedicated mouse/pen handle prevents default.
      if (event.pointerType !== "touch") event.preventDefault();
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
    function move(event: PointerEvent) {
      if (!gesture || gesture.id !== event.pointerId) return;
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
      const width = root!.clientWidth / machine.mode;
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
      const id = gesture.id;
      gesture = null;
      if (root!.hasPointerCapture(id)) root!.releasePointerCapture(id);
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
      } else if (event.key === "Escape" && machine.phase !== "idle") cancel();
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
      machine.resize(width >= 860 ? 2 : 1);
      sync();
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
  }, [simple]);

  const navigate = useCallback(
    (direction: Direction, target?: number) =>
      navigateRef.current(direction, target),
    [],
  );
  return { rootRef, snapshot, navigate };
}

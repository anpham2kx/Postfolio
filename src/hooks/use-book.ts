"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPageSound } from "@/lib/page-sound";
import {
  computeHardCover,
  computePaperFold,
  type PeelCorner,
} from "@/lib/book-geometry";
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
  lastY: number;
  lastTime: number;
  velocity: number;
  progress: number;
  direction: Direction | null;
  corner: PeelCorner;
  liftRatio: number;
}

interface ActiveTurnDom {
  hard: boolean;
  sheet: HTMLElement;
  frontWrap: HTMLElement;
  backFlap: HTMLElement;
  backWrap: HTMLElement;
  frontShade: HTMLElement;
  backShade: HTMLElement;
  castShadow: HTMLElement;
  underShadow: HTMLElement | null;
}

/** All frame updates go to DOM transforms/clips. React renders only at transaction boundaries. */
export function useBook(total: number) {
  const rootRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef(new BookMachine(total));
  const offsetsRef = useRef(new Map<number, number>());
  const navigateRef = useRef<(direction: Direction, target?: number) => void>(
    () => {},
  );
  const [snapshot, setSnapshot] = useState({
    anchor: -1,
    busy: false,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pageSound = createPageSound();
    const machine = machineRef.current;
    const pages = Array.from(
      root.querySelectorAll<HTMLElement>(":scope > .book-page"),
    );
    const pageAt = (index: number) =>
      pages.find((page) => Number(page.dataset.page) === index);
    const centerOffset = (anchor: number) =>
      anchor < 0 ? -25 : anchor >= total ? 25 : 0;

    function stackDepths(spread: number): { left: number; right: number } {
      if (spread < 0) return { left: 0, right: 10 };
      if (spread >= total) return { left: 10, right: 0 };
      const maxSpread = Math.max(total - 2, 2);
      const ratio = clamp(spread / maxSpread, 0, 1);
      return {
        left: 4 + ratio * 6,
        right: 4 + (1 - ratio) * 6,
      };
    }

    function positionBook(anchor: number) {
      const spread = spreadStart(anchor);
      const depths = stackDepths(anchor < 0 ? -2 : anchor >= total ? total : spread);
      root!.style.setProperty("--book-shift", `${centerOffset(anchor)}%`);
      root!.dataset.cover =
        anchor < 0 ? "front" : anchor >= total ? "back" : "open";
      root!.style.setProperty("--left-stack", anchor < 0 ? "0" : "1");
      root!.style.setProperty("--right-stack", anchor >= total ? "0" : "1");
      root!.style.setProperty("--left-depth", `${depths.left.toFixed(1)}px`);
      root!.style.setProperty("--right-depth", `${depths.right.toFixed(1)}px`);
    }

    const layer = root.querySelector<HTMLElement>(".turn-layer");
    if (!layer) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let gesture: Gesture | null = null;
    let activeDom: ActiveTurnDom | null = null;
    let activeCorner: PeelCorner = "bottom";
    let activeLiftRatio: number | undefined;
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
      for (const page of pages) {
        if (page.hidden) continue;
        const content = page.querySelector<HTMLElement>(".page-content");
        if (content) offsets.set(Number(page.dataset.page), content.scrollTop);
      }
    }

    function show(indices: number[]) {
      pages.forEach((page) => {
        const index = Number(page.dataset.page);
        const visible = indices.includes(index);
        page.hidden = !visible;
        page.inert = !visible;
        page.style.gridColumn = index % 2 === 0 ? "1" : "2";
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
      positionBook(machine.anchor);
      const start = spreadStart(machine.anchor);
      show([start, start + 1]);
      activeDom = null;
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
      const source = pageAt(index);
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
      const scroller = clone.querySelector<HTMLElement>(".page-content");
      if (scroller) scroller.scrollTop = offsets.get(index) ?? 0;
      return clone;
    }

    function prepare(corner: PeelCorner = "bottom", liftRatio?: number) {
      const turn = machine.turn;
      if (!turn) return;
      rememberScroll();
      activeCorner = corner;
      activeLiftRatio = liftRatio;

      const dest = spreadStart(turn.to);
      const forward = turn.direction === 1;
      const outgoing = turn.from + (forward ? 1 : 0);
      const back = dest + (forward ? 0 : 1);
      const hard = outgoing <= 0 || outgoing >= total - 1;

      const sheet = document.createElement("div");
      sheet.className = "turn-sheet";
      sheet.dataset.hard = String(hard);
      sheet.dataset.direction = forward ? "next" : "prev";

      const frontClone = clonePage(outgoing, "turn-front");
      const backClone = clonePage(back, "turn-back");

      const frontShade = document.createElement("div");
      frontShade.className = "turn-shade-overlay turn-front-shade";
      frontClone.append(frontShade);

      const backShade = document.createElement("div");
      backShade.className = "turn-shade-overlay turn-back-shade";
      backClone.append(backShade);

      const frontWrap = document.createElement("div");
      frontWrap.className = "turn-front-wrap";
      frontWrap.append(frontClone);

      const backWrap = document.createElement("div");
      backWrap.className = "turn-back-wrap";
      backWrap.append(backClone);

      const backFlap = document.createElement("div");
      backFlap.className = "turn-back-flap";
      backFlap.append(backWrap);

      const castShadow = document.createElement("div");
      castShadow.className = "turn-cast-shadow";

      let underShadow: HTMLElement | null = null;
      if (hard) {
        const boardEdge = document.createElement("div");
        boardEdge.className = "turn-board-edge";
        sheet.append(frontWrap, backFlap, boardEdge);

        underShadow = document.createElement("div");
        underShadow.className = "turn-under-shadow";
        const frontCoverTurn = turn.from < 0 || dest < 0;
        underShadow.dataset.side = frontCoverTurn ? "right" : "left";
        layer!.replaceChildren(underShadow, sheet);
      } else {
        sheet.append(castShadow, frontWrap, backFlap);
        layer!.replaceChildren(sheet);
      }

      layer!.dataset.direction = forward ? "next" : "prev";
      layer!.dataset.hard = String(hard);
      layer!.hidden = false;

      if (turn.from < 0 || dest < 0) {
        show([1]);
      } else if (turn.from >= total || dest >= total) {
        show([total - 2]);
      } else {
        show(forward ? [turn.from, dest + 1] : [dest, turn.from + 1]);
      }

      activeDom = {
        hard,
        sheet,
        frontWrap,
        backFlap,
        backWrap,
        frontShade,
        backShade,
        castShadow,
        underShadow,
      };

      root!.dataset.phase = machine.phase;
      root!.dataset.cover = "turning";
      publish();
    }

    function paint(progress: number) {
      if (!activeDom || !machine.turn) return;
      const { from, to, direction } = machine.turn;
      const dest = spreadStart(to);
      const p = clamp(progress, 0, 1);

      const shift =
        centerOffset(from) + (centerOffset(to) - centerOffset(from)) * p;
      root!.style.setProperty("--book-shift", `${shift.toFixed(3)}%`);

      const fromDepths = stackDepths(from);
      const toDepths = stackDepths(dest);
      const leftDepth = fromDepths.left + (toDepths.left - fromDepths.left) * p;
      const rightDepth =
        fromDepths.right + (toDepths.right - fromDepths.right) * p;

      root!.style.setProperty(
        "--left-stack",
        from < 0 || to < 0 ? "0" : "1",
      );
      root!.style.setProperty(
        "--right-stack",
        from >= total || to >= total ? "0" : "1",
      );
      root!.style.setProperty("--left-depth", `${leftDepth.toFixed(1)}px`);
      root!.style.setProperty("--right-depth", `${rightDepth.toFixed(1)}px`);

      if (activeDom.hard) {
        const cover = computeHardCover(p, direction, from, dest, total);
        activeDom.sheet.style.transform = cover.sheetTransform;
        activeDom.sheet.dataset.angle = cover.angleDeg.toFixed(1);
        activeDom.frontWrap.style.zIndex = cover.frontZIndex;
        activeDom.backFlap.style.zIndex = cover.backZIndex;
        activeDom.frontShade.style.backgroundImage = cover.faceShadeGradient;
        activeDom.frontShade.style.opacity = cover.faceShadeOpacity;
        activeDom.backShade.style.backgroundImage = cover.faceShadeGradient;
        activeDom.backShade.style.opacity = cover.faceShadeOpacity;
        if (activeDom.underShadow) {
          activeDom.underShadow.style.opacity = cover.underShadowOpacity;
        }
        return;
      }

      const pageWidth = root!.clientWidth / 2;
      const pageHeight = root!.clientHeight;
      const fold = computePaperFold(
        p,
        direction,
        pageWidth,
        pageHeight,
        activeCorner,
        activeLiftRatio,
      );

      activeDom.sheet.style.transform = "translate3d(0px, 0px, 0px)";
      activeDom.sheet.dataset.foldAngle = fold.foldAngleDeg.toFixed(2);
      activeDom.frontWrap.style.clipPath = fold.frontClip;
      activeDom.backWrap.style.clipPath = fold.backClip;
      activeDom.backWrap.style.transformOrigin = fold.backOrigin;
      activeDom.backWrap.style.transform = fold.backTransform;
      activeDom.backFlap.style.filter = fold.flapDropShadow;
      activeDom.frontShade.style.backgroundImage = fold.frontShadeGradient;
      activeDom.frontShade.style.opacity = "1";
      activeDom.backShade.style.backgroundImage = fold.backShadeGradient;
      activeDom.backShade.style.opacity = "1";
      activeDom.castShadow.style.backgroundImage = fold.castShadowGradient;
    }

    function finish(commit: boolean, focus: boolean) {
      machine.finish(commit);
      const next = commit ? pendingPages.shift() : undefined;
      if (next !== undefined) {
        machine.begin(next > machine.anchor ? 1 : -1, "settling", next);
        prepare("bottom");
        paint(0);
        settle(true, 0, focus);
        return;
      }
      pendingPages = [];
      multiTurn = false;
      sync();
      if (focus && commit)
        pageAt(machine.anchor)?.focus({ preventScroll: true });
    }

    function settle(commit: boolean, from: number, focus = false) {
      if (commit) pageSound.play();
      machine.settle();
      root!.dataset.phase = machine.phase;
      publish();
      const token = ++generation;
      cancelAnimationFrame(frame);
      const target = commit ? 1 : 0;
      const duration = motion.matches
        ? 0
        : Math.max(110, Math.abs(target - from) * (multiTurn ? 340 : 680));
      if (duration === 0) {
        finish(commit, focus);
        return;
      }
      const start = performance.now();
      const releaseLift = activeLiftRatio;
      function tick(now: number) {
        if (token !== generation || disposed) return;
        const t = clamp((now - start) / duration, 0, 1);
        if (releaseLift !== undefined) activeLiftRatio = releaseLift * Math.pow(1 - t, 3);
        const eased = from + (target - from) * (1 - Math.pow(1 - t, 3));
        paint(eased);
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
          pageAt(machine.anchor)?.focus({ preventScroll: true });
        }
        return;
      }
      pendingPages = path;
      multiTurn = path.length > 0;
      prepare("bottom");
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
      if (!target.closest(".book-page:not([hidden])")) return;
      if (
        target.closest(
          "a, button, input, textarea, select, label, [contenteditable], [data-no-drag], [role='button'], [role='textbox'], [role='slider'], [role='combobox']",
        )
      )
        return;
      if (event.shiftKey) {
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
      const scroller = target.closest<HTMLElement>(".page-content");
      if (scroller && scroller.offsetWidth > scroller.clientWidth) {
        const box = scroller.getBoundingClientRect();
        if (
          event.clientX >=
          box.left + scroller.clientLeft + scroller.clientWidth
        )
          return;
      }
      const rect = root!.getBoundingClientRect();
      const relY = clamp(
        (event.clientY - rect.top) / Math.max(rect.height, 1),
        0,
        1,
      );
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        lastTime: event.timeStamp,
        velocity: 0,
        progress: 0,
        direction: null,
        corner: relY < 0.35 ? "top" : "bottom",
        liftRatio: 0,
      };
    }

    function selectText(event: MouseEvent) {
      if (!gesture || gesture.direction) return;
      if (event.detail > 1) release();
      else event.preventDefault();
    }

    function nativeDrag(event: DragEvent) {
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
        prepare(gesture.corner, 0);
      }
      if (event.cancelable) event.preventDefault();
      const elapsed = event.timeStamp - gesture.lastTime;
      if (elapsed > 0)
        gesture.velocity =
          (-(event.clientX - gesture.lastX) * gesture.direction) / elapsed;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      gesture.lastTime = event.timeStamp;

      const distance = -dx * gesture.direction;
      const width = root!.clientWidth / 2;
      const height = Math.max(root!.clientHeight, 1);
      gesture.progress = clamp(distance / Math.max(width * (activeDom?.hard ? 0.8 : 2), 1), 0, 1);
      const verticalDelta =
        gesture.corner === "bottom" ? -dy / height : dy / height;
      gesture.liftRatio = clamp(verticalDelta, 0.002, 0.95);
      activeLiftRatio = gesture.liftRatio;

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
      release();
      settle(commit, progress);
    }

    function pointerCancel(event: PointerEvent) {
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
        !link &&
        event.target.closest(".outer-cover") &&
        !window.getSelection()?.toString().trim()
      ) {
        navigate(machine.anchor < 0 ? 1 : -1);
        return;
      }
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
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active.closest(".book-page[hidden]")
      )
        pageAt(machine.anchor)?.focus({ preventScroll: true });
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
      pageSound.dispose();
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

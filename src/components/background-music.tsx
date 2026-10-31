"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Playback = "paused" | "loading" | "playing" | "error";

export function BackgroundMusic({ src, children }: { src: string; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wanted = useRef(false);
  const awaitingGesture = useRef(false);
  const request = useRef(0);
  const mounted = useRef(false);
  const [playback, setPlayback] = useState<Playback>("paused");

  const stop = useCallback(() => {
    wanted.current = false;
    awaitingGesture.current = false;
    request.current++;
    audioRef.current?.pause();
  }, []);

  const start = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const token = ++request.current;
    wanted.current = true;
    awaitingGesture.current = false;
    setPlayback("loading");
    try {
      if (audio.error) audio.load();
      await audio.play();
      if (!mounted.current || !wanted.current) {
        audio.pause();
        return;
      }
      if (token === request.current && !audio.paused) setPlayback("playing");
    } catch (error: unknown) {
      if (!mounted.current || token !== request.current) return;
      stop();
      const blocked =
        error instanceof DOMException && error.name === "NotAllowedError";
      // Retry blocked autoplay in a trusted user gesture, never after a pause.
      awaitingGesture.current = blocked;
      setPlayback(blocked ? "paused" : "error");
    }
  }, [stop]);

  useEffect(() => {
    mounted.current = true;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 1;
    const visibility = () => {
      document.documentElement.dataset.ambientPaused = String(document.hidden);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    const unlock = (event: PointerEvent | KeyboardEvent) => {
      if (!event.isTrusted || !awaitingGesture.current) return;
      // The record has its own toggle; one action must not play then pause.
      if (
        event.target instanceof Element &&
        event.target.closest(".music-player")
      )
        return;
      if (
        event instanceof KeyboardEvent &&
        (event.repeat ||
          event.ctrlKey ||
          event.altKey ||
          event.metaKey ||
          ["Shift", "Control", "Alt", "Meta", "Escape"].includes(event.key))
      )
        return;
      void start();
    };
    document.addEventListener("pointerup", unlock, true);
    document.addEventListener("keydown", unlock, true);
    // Every visit starts with playback intent; a previous visit's pause is not restored.
    void start();
    return () => {
      mounted.current = false;
      stop();
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("pointerup", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      delete document.documentElement.dataset.ambientPaused;
    };
  }, [start, stop]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    const shouldStop = wanted.current || !audio.paused;
    if (shouldStop) {
      stop();
      setPlayback("paused");
    } else void start();
  }

  const active = playback === "playing";
  const label = active
    ? "Tạm dừng nhạc nền"
    : playback === "loading"
      ? "Hủy tải nhạc nền"
      : "Bật nhạc nền";

  return (
    <div className="music-player" data-playback={playback}>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        loop
        onPlaying={() => {
          if (!wanted.current) audioRef.current?.pause();
          else setPlayback("playing");
        }}
        onPause={() => {
          if (mounted.current && audioRef.current?.paused) {
            wanted.current = false;
            setPlayback((current) =>
              current === "error" ? current : "paused",
            );
          }
        }}
        onWaiting={() => {
          if (wanted.current) setPlayback("loading");
        }}
        onError={() => {
          if (mounted.current) {
            // Firefox may leave paused=false after a failed request. Reset the
            // native element too, so the next click retries immediately.
            stop();
            setPlayback("error");
          }
        }}
      />
      <button
        className="record-button"
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={active || playback === "loading"}
        aria-busy={playback === "loading"}
      >
        {children}
      </button>
      <span
        className={playback === "error" ? "music-error" : "sr-only"}
        role="status"
      >
        {playback === "error" ? "Chưa tải được nhạc. Bấm đĩa để thử lại." : ""}
      </span>
    </div>
  );
}

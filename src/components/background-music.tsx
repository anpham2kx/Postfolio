"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Playback = "paused" | "loading" | "playing" | "error";

function HalloweenRecord() {
  return (
    <span className="vinyl-record" aria-hidden="true">
      <svg className="vinyl-label" viewBox="0 0 100 100" focusable="false">
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#b55b21"
          stroke="#e8ac60"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke="#663019"
          strokeWidth=".8"
        />
        <path
          d="m10 24 7 3 4-6 3 7 7 1-6 4-5-1-3 4-2-6Z M70 21l6 3 5-5 1 7 8 1-5 5-6-1-4 4-1-7Z"
          fill="#38231b"
        />
        <path
          d="M49 37c-7-7-24-2-24 15 0 18 12 27 25 27s25-9 25-27c0-17-17-22-24-15Z"
          fill="#f4a044"
          stroke="#6f321b"
          strokeWidth="2"
        />
        <path
          d="M49 38c-4-10 0-16 6-18l4 7c-5 1-7 5-7 11M44 39c-6 13-5 25 1 36m11-36c6 13 5 25-1 36"
          fill="none"
          stroke="#96431d"
          strokeWidth="2.5"
        />
        <path
          d="m34 48 11 7-12 2Zm32 0-11 7 12 2ZM35 63l8 3 3-4 5 5 5-5 3 4 8-3c-5 12-25 12-32 0Z"
          fill="#3d241b"
        />
        <circle
          cx="50"
          cy="50"
          r="3.5"
          fill="#f9dca3"
          stroke="#4c2c20"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

export function BackgroundMusic() {
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
    audio.volume = 0.35;
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
        src="/audio/autumn-halloween.mp3"
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
        <HalloweenRecord />
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

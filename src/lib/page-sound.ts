/** Trimmed recording supplied by the user; independent of background music. */
export function createPageSound() {
  const audio = new Audio("/audio/page-turn-v2.mp3");
  audio.preload = "auto";
  audio.volume = 1;
  let disposed = false;
  return {
    play() {
      if (disposed) return;
      // One voice prevents rapid jumps from stacking loud overlapping sounds.
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch(() => {
        // Audio policy or a missing asset must never block book navigation.
      });
    },
    dispose() {
      disposed = true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}

import { expect, test } from "@playwright/test";

test("recorded page sound loads, plays on a turn and does not loop", async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalAudio = window.Audio;
    window.Audio = class extends OriginalAudio {
      constructor(src?: string) {
        super(src);
        if (src === "/audio/page-turn-v2.mp3") {
          this.id = "test-page-sound";
          document.body.append(this);
        }
      }
    };
  });
  await page.goto("/");
  const peak = await page.evaluate(async () => {
    const context = new AudioContext();
    try {
      const response = await fetch("/audio/page-turn-v2.mp3");
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      let maximum = 0;
      for (const value of buffer.getChannelData(0)) maximum = Math.max(maximum, Math.abs(value));
      return maximum;
    } finally { await context.close(); }
  });
  expect(peak).toBeGreaterThan(0.05);
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  const sound = page.locator("#test-page-sound");
  await expect.poll(() => sound.evaluate((node: HTMLAudioElement) => node.currentTime)).toBeGreaterThan(0);
  await expect.poll(() => sound.evaluate((node: HTMLAudioElement) => node.ended)).toBe(true);
  expect(await sound.evaluate((node: HTMLAudioElement) => node.duration)).toBeLessThan(0.8);
  expect(await sound.evaluate((node: HTMLAudioElement) => node.loop)).toBe(false);
});

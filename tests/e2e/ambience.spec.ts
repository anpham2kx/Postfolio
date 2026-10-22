import { expect, test, type Page } from "@playwright/test";

// Avoid competing media clocks in multiple contexts of one headless browser.
test.describe.configure({ mode: "default" });

const musicPath = "/audio/autumn-halloween.mp3";
const player = (page: Page) => page.locator(".music-player");
const record = (page: Page) => page.locator(".record-button");
const time = (page: Page) =>
  page
    .locator("audio")
    .evaluate((audio: HTMLAudioElement) => audio.currentTime);

async function openPaused(page: Page) {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) {
        first = false;
        return Promise.reject(
          new DOMException("Autoplay blocked", "NotAllowedError"),
        );
      }
      return play.call(this);
    };
  });
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
}

test("cottage image, Halloween record and decorative leaves fit without intercepting the book", async ({
  page,
  request,
}) => {
  let mediaRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith(musicPath)) mediaRequests++;
  });
  await openPaused(page);
  const background = await request.get(
    "/images/Background_Halloween_Cozy_Cottage.jpg",
  );
  expect(background.ok()).toBe(true);
  expect(background.headers()["content-type"]).toContain("image/jpeg");
  await expect(page.locator(".cottage-background")).toHaveCSS(
    "background-image",
    /Background_Halloween_Cozy_Cottage\.jpg/,
  );
  await expect(page.locator(".autumn-scene")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await expect(page.locator(".falling-leaf")).toHaveCount(20);
  await expect(page.locator(".vinyl-label")).toBeVisible();
  await expect(page.locator(".record-badge, .music-tooltip")).toHaveCount(0);
  await expect(record(page)).not.toHaveAttribute("title");
  await expect(record(page)).toHaveAccessibleName("Bật nhạc nền");
  await record(page).focus();
  await expect(record(page)).toHaveCSS("outline-style", "solid");
  expect(mediaRequests).toBe(0);
  for (const viewport of [page.viewportSize(), { width: 320, height: 568 }]) {
    if (!viewport) throw new Error("Viewport missing");
    await page.setViewportSize(viewport);
    const box = await record(page).boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThan(viewport.width / 2);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      viewport.height,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Trang sau", exact: true }).click();
    await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  }
});

test("real MP3 streams, plays, pauses and resumes with the disc synchronized", async ({
  page,
  request,
}) => {
  const range = await request.get(musicPath, {
    headers: { Range: "bytes=0-1023" },
  });
  expect(range.status()).toBe(206);
  expect(range.headers()["content-type"]).toContain("audio/mpeg");
  expect((await range.body()).length).toBe(1024);
  await openPaused(page);
  await record(page).focus();
  await page.keyboard.press("Enter");
  await expect(player(page)).toHaveAttribute("data-playback", "playing", {
    timeout: 15000,
  });
  await expect(page.locator(".vinyl-record")).toHaveCSS(
    "animation-play-state",
    "running",
  );
  expect(
    await page
      .locator("audio")
      .evaluate(
        (audio: HTMLAudioElement) =>
          audio.loop && !audio.muted && audio.volume > 0,
      ),
  ).toBe(true);
  await expect.poll(() => time(page)).toBeGreaterThan(0.2);
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
  const stopped = await time(page);
  const angle = await page
    .locator(".vinyl-record")
    .evaluate((node) => getComputedStyle(node).transform);
  await page.waitForTimeout(250); // Verify both audio and the current disc angle remain paused.
  expect(await time(page)).toBeCloseTo(stopped, 1);
  await expect(page.locator(".vinyl-record")).toHaveCSS("transform", angle);
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "playing");
  await expect.poll(() => time(page)).toBeGreaterThan(stopped + 0.1);
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
  expect(
    await page
      .locator("audio")
      .evaluate((audio: HTMLAudioElement) => audio.paused),
  ).toBe(true);
});

test("each visit attempts autoplay; the first gesture unlocks it and later gestures respect pause", async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.addInitScript(() => {
    // Old stored preferences must not suppress autoplay on a new visit.
    sessionStorage.setItem("an-book-music", "paused");
    const play = HTMLMediaElement.prototype.play;
    let attempts = 0;
    HTMLMediaElement.prototype.play = function () {
      document.documentElement.dataset.playAttempts = String(++attempts);
      if (attempts === 1)
        return Promise.reject(
          new DOMException("Autoplay blocked", "NotAllowedError"),
        );
      return play.call(this);
    };
  });
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("html")).toHaveAttribute("data-play-attempts", "1");
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
  await page.locator(".brand").click();
  await expect(player(page)).toHaveAttribute("data-playback", "playing", {
    timeout: 15000,
  });
  await record(page).click();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
  await expect(page.locator("html")).toHaveAttribute("data-play-attempts", "2");
  await page.reload();
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("html")).toHaveAttribute("data-play-attempts", "1");
  await page.keyboard.press("ArrowRight");
  await expect(player(page)).toHaveAttribute("data-playback", "playing", {
    timeout: 15000,
  });
  await record(page).click();
});

test("blocked autoplay leaves a working play button instead of a spinning silent record", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) {
        first = false;
        return Promise.reject(
          new DOMException("Autoplay blocked", "NotAllowedError"),
        );
      }
      return play.call(this);
    };
  });
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
  await expect(page.locator(".vinyl-record")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await expect(page.locator(".music-error")).toHaveCount(0);
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "playing", {
    timeout: 15000,
  });
  await record(page).click();
});

test("canceling a pending play promise and rapid toggles cannot restart music after pause", async ({
  page,
}) => {
  // Hold only the first play promise. WebKit's native media networking does not
  // consistently pass through page.route on Windows, so use an explicit gate.
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = async function () {
      if (!first) return play.call(this);
      first = false;
      await new Promise<void>((resolve) =>
        window.addEventListener("test-release-play", () => resolve(), {
          once: true,
        }),
      );
      try {
        await play.call(this);
      } finally {
        document.documentElement.dataset.playSettled = "true";
      }
    };
  });
  await openPaused(page);
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "loading");
  await record(page).click();
  await page.evaluate(() =>
    window.dispatchEvent(new Event("test-release-play")),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-play-settled",
    "true",
  );
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "playing", {
    timeout: 15000,
  });
  // Native synchronous click burst exercises intent refs before React can render.
  await record(page).evaluate((button) => {
    for (let index = 0; index < 7; index++)
      (button as HTMLButtonElement).click();
  });
  await page.waitForTimeout(300);
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
  expect(
    await page
      .locator("audio")
      .evaluate((audio: HTMLAudioElement) => audio.paused),
  ).toBe(true);
  await expect(page.locator(".vinyl-record")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
});

test("media load errors stop the disc and allow a successful retry", async ({
  page,
}) => {
  await openPaused(page);
  // A real missing resource exercises the native error on every engine.
  await page.locator("audio").evaluate((audio: HTMLAudioElement) => {
    audio.src = "/audio/missing-test-track.mp3";
  });
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "error");
  expect(
    await page
      .locator("audio")
      .evaluate((audio: HTMLAudioElement) => audio.paused),
  ).toBe(true);
  await expect(page.locator(".music-error")).toBeVisible();
  await expect(page.locator(".vinyl-record")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await page.locator("audio").evaluate((audio: HTMLAudioElement, src) => {
    audio.src = src;
  }, musicPath);
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "playing", {
    timeout: 15000,
  });
  await expect(page.locator(".music-error")).toHaveCount(0);
  await record(page).click();
});

test("reduced motion hides leaves and stops disc animation while music stays controllable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPaused(page);
  await expect(page.locator(".falling-leaves")).toBeHidden();
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "playing", {
    timeout: 15000,
  });
  await expect(page.locator(".vinyl-record")).toHaveCSS(
    "animation-name",
    "none",
  );
  await record(page).click();
  await expect(player(page)).toHaveAttribute("data-playback", "paused");
});

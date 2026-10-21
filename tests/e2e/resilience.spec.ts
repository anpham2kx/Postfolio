import { expect, test } from "@playwright/test";

test.beforeEach(async ({}, info) => {
  test.skip(
    info.project.name !== "chromium-desktop",
    "Additional targeted Chromium checks; primary suite runs on all six projects.",
  );
});

test("320px phone and short landscape layouts retain accessible scrollable pages", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
    await page.getByRole("link", { name: "Liên hệ với An" }).click();
    await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
    await expect(page.locator("#page-7")).toBeVisible();
    await page
      .getByRole("button", { name: "Gửi tin nhắn" })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Gửi tin nhắn" }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/compact-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
  }
});

test("no JavaScript still exposes every source section as a linear document", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000");
  await expect(page.locator(".book-page")).toHaveCount(8);
  for (const section of await page.locator(".book-page").all())
    await expect(section).toBeVisible();
  await expect(page.locator(".noscript-note")).toBeVisible();
  await expect(page.locator("#page-4")).toContainText("3.2/4.0");
  await context.close();
});

test("pen input follows, reverses to cancel, then commits", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-mode", "2");
  const client = await context.newCDPSession(page);
  const box = await page.locator(".book").boundingBox();
  if (!box) throw new Error("Book not found");
  const x = box.x + box.width - 7;
  const y = box.y + 250;
  const move = (nextX: number) =>
    client.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: nextX,
      y,
      button: "left",
      buttons: 1,
      pointerType: "pen",
    });
  const press = () =>
    client.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      buttons: 1,
      clickCount: 1,
      pointerType: "pen",
    });
  const release = (nextX: number) =>
    client.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: nextX,
      y,
      button: "left",
      buttons: 0,
      clickCount: 1,
      pointerType: "pen",
    });
  await press();
  await move(x - 250);
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "dragging");
  await move(x - 12);
  await release(x - 12);
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-0")).toBeVisible();
  await press();
  await move(x - 300);
  await release(x - 300);
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-2")).toBeVisible();
  await client.detach();
});

test("rapid alternating gestures, Escape and blur cancel without stale callbacks", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("button", { name: "Trang sau", exact: true })
    .dispatchEvent("click");
  await page.keyboard.press("Escape");
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-0")).toBeVisible();
  await page
    .getByRole("button", { name: "Trang sau", exact: true })
    .dispatchEvent("click");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-0")).toBeVisible();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-2")).toBeVisible();
  await page.getByRole("button", { name: "Trang trước", exact: true }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-0")).toBeVisible();
});

test("automatic flat fallback and unavailable storage do not break navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = CSS.supports.bind(CSS);
    CSS.supports = (property: string, value?: string) =>
      property === "transform-style"
        ? false
        : value
          ? original(property, value)
          : original(property);
    Storage.prototype.getItem = () => {
      throw new Error("Storage disabled");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage disabled");
    };
  });
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-simple", "true");
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-2")).toBeVisible();
  await page.getByRole("button", { name: "Chuyển sang chế độ tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("a backward mobile turn does not create horizontal document overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-mode", "1");
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  const box = await page.locator(".book").boundingBox();
  if (!box) throw new Error("Book not found");
  await page.mouse.move(box.x + 6, box.y + 220);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + 220, { steps: 15 });
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "dragging");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.mouse.up();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#page-0")).toBeVisible();
});

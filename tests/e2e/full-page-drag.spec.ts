import { expect, test, type Page } from "@playwright/test";
import { blockBackgroundMusic } from "./media-helpers";

async function idle(page: Page) {
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
}

test.beforeEach(async ({ page }) => {
  await blockBackgroundMusic(page);
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await idle(page);
  await page.evaluate(() => document.fonts.ready);
});

test("mouse turns from cover text, body text, image, whitespace and footer", async ({
  page,
}) => {
  for (const selector of [
    "#page-0 .cover-author",
    "#page-1 .cover-bio",
    "#page-1 img",
    "#page-1 .page-inner",
    "#page-1 .paper-footer",
  ]) {
    const surface = await page.locator(selector).boundingBox();
    const book = await page.locator(".book").boundingBox();
    if (!surface || !book) throw new Error(`Missing surface: ${selector}`);
    // page-inner starts in the top padding, away from the old edge handles.
    const x =
      surface.x +
      surface.width * (selector.endsWith(".page-inner") ? 0.8 : 0.5);
    const y = surface.y + Math.min(8, surface.height / 2);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - book.width * 0.23, y, { steps: 15 });
    await expect(page.locator(".book")).toHaveAttribute(
      "data-phase",
      "dragging",
    );
    await expect(page.locator(".turn-sheet")).toHaveCSS(
      "transform",
      /matrix3d/,
    );
    await page.mouse.up();
    await idle(page);
    await expect(page.locator("#page-2")).toBeVisible();
    await page
      .getByRole("button", { name: "Phạm Thanh An — về trang đầu" })
      .click();
    await idle(page);
  }
  await expect(page.locator("[data-drag-handle]")).toHaveCount(0);
});

test("Shift drag and double click select real text; selection does not lock later drags", async ({
  page,
}) => {
  const bio = page.locator(".cover-bio");
  const line = await bio.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getClientRects()[0];
    if (!rect) throw new Error("Missing text line");
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const y = line.y + line.height / 2;
  await page.keyboard.down("Shift");
  await page.mouse.move(line.x + 1, y);
  await page.mouse.down();
  await page.mouse.move(line.x + line.width - 2, y, { steps: 15 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  expect(
    await page.evaluate(() => window.getSelection()?.toString().trim()),
  ).toBeTruthy();
  await idle(page);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#page-1")).toBeVisible();
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await page.mouse.dblclick(line.x + 3, y);
  expect(
    await page.evaluate(() => window.getSelection()?.toString().trim()),
  ).toBeTruthy();
  await idle(page);

  // An existing selection used to disable dragging anywhere on the book.
  const box = await page.locator("#page-0 .cover-border").boundingBox();
  const book = await page.locator(".book").boundingBox();
  if (!box || !book) throw new Error("Missing book");
  const x = box.x + box.width * 0.7;
  await page.mouse.move(x, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(x - book.width * 0.23, box.y + 30, { steps: 15 });
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page-2")).toBeVisible();
});

test("central drag cancels cleanly; contact links and native form selection remain usable", async ({
  page,
}) => {
  const box = await page.locator(".cover-bio").boundingBox();
  if (!box) throw new Error("Missing biography");
  const x = box.x + box.width / 2;
  const y = box.y + 8;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 18, y, { steps: 12 });
  await page.waitForTimeout(150); // Remove flick velocity before a short release.
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();

  await page.getByRole("link", { name: "Liên hệ", exact: true }).click();
  await idle(page);
  const message = page.getByLabel("Nội dung *", { exact: true });
  await message.fill("Keep this text while selecting with the mouse.");
  await message.scrollIntoViewIfNeeded();
  const field = await message.boundingBox();
  if (!field) throw new Error("Missing textarea");
  await page.mouse.move(field.x + 8, field.y + 15);
  await page.mouse.down();
  await page.mouse.move(field.x + field.width - 8, field.y + 15, { steps: 15 });
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page-6")).toBeVisible();
  await expect(message).toHaveValue(
    "Keep this text while selecting with the mouse.",
  );
  expect(
    await message.evaluate(
      (node) =>
        (node as HTMLTextAreaElement).selectionEnd -
        (node as HTMLTextAreaElement).selectionStart,
    ),
  ).toBeGreaterThan(0);
});

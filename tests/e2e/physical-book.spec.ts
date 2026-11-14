import { expect, test, type Page } from "@playwright/test";
import { blockBackgroundMusic } from "./media-helpers";

const idle = async (page: Page) => expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
const next = (page: Page) => page.getByRole("button", { name: "Trang sau", exact: true });
const prev = (page: Page) => page.getByRole("button", { name: "Trang trước", exact: true });

test.beforeEach(async ({ page }) => {
  await blockBackgroundMusic(page);
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
});

test("single centered covers open into two pages and close at either boundary", async ({ page }, info) => {
  await expect(page.locator(".book > .book-page:visible")).toHaveCount(1);
  await expect(prev(page)).toBeDisabled();
  const cover = await page.locator("#page--1").boundingBox();
  const shell = await page.locator(".book-shell").boundingBox();
  if (!cover || !shell) throw Error("Missing cover geometry");
  expect(Math.abs(cover.x + cover.width / 2 - shell.x - shell.width / 2)).toBeLessThan(2);
  expect(cover.width / shell.width).toBeLessThan(.51);
  await page.screenshot({path: info.outputPath("front.png")});
  await page.locator("#page--1").click();
  await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  await expect(page.locator(".book > .book-page:visible")).toHaveCount(2);
  await page.screenshot({path: info.outputPath("open.png")});
  for (const index of [2, 4, 6, 8]) {
    await next(page).click();
    await idle(page);
    await expect(page.locator(`#page-${index}`)).toBeVisible();
  }
  await expect(next(page)).toBeDisabled();
  await expect(page.locator(".book > .book-page:visible")).toHaveCount(1);
  const back = await page.locator("#page-8").boundingBox();
  expect(Math.abs(back!.x + back!.width / 2 - shell.x - shell.width / 2)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path: info.outputPath("back.png")});
  for (const index of [6, 4, 2, 0, -1]) {
    await prev(page).click();
    await idle(page);
    await expect(page.locator(`#page-${index}`)).toBeVisible();
  }
  await expect(prev(page)).toBeDisabled();
});

test("dragged cover follows the hand, cancels, and opens once outside the book", async ({ page }, info) => {
  const cover = await page.locator("#page--1").boundingBox();
  if (!cover) throw Error("Missing cover");
  const x = cover.x + cover.width * .8;
  const y = cover.y + cover.height * .4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - cover.width * .3, y, {steps: 10});
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "dragging");
  await expect(page.locator(".turn-sheet")).toHaveAttribute("data-hard", "true");
  await page.screenshot({path: info.outputPath("opening-midway.png")});
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page--1")).toBeVisible();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 17, y, {steps: 6});
  await page.waitForTimeout(150);
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page--1")).toBeVisible();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(1, y, {steps: 15});
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await idle(page);
  await expect(page.locator("#page-2")).toBeVisible();
});

test("paper bends during drag; resize cancels and keeps the current spread", async ({ page }, info) => {
  await next(page).click(); await idle(page);
  const right = await page.locator("#page-1 .cover-bio").boundingBox();
  const book = await page.locator(".book").boundingBox();
  if (!right || !book) throw Error("Missing pages");
  const x = right.x + right.width * .8, y = right.y + 10;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x - book.width * .2, y, {steps: 12});
  await expect(page.locator(".turn-sheet")).toHaveAttribute("data-hard", "false");
  await expect(page.locator(".turn-strip")).toHaveCount(0);
  await expect(page.locator(".turn-front-wrap")).toHaveCSS("clip-path", /polygon\(/);
  await expect(page.locator(".turn-back-wrap")).toHaveCSS("clip-path", /polygon\(/);
  await expect(page.locator(".turn-back-wrap")).toHaveCSS("transform", /matrix/);
  await page.screenshot({path: info.outputPath("paper-midway.png")});
  const size = page.viewportSize()!;
  await page.setViewportSize({width: Math.min(900, size.width - 40), height: size.height - 50});
  await page.mouse.up(); await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  await expect(page.locator(".turn-sheet")).toHaveCount(0);
});

test("rapid input, jump sequences and back cover preserve a contact draft", async ({ page }) => {
  await next(page).evaluate(button => {
    for(let i=0;i<10;i++) (button as HTMLButtonElement).click();
  });
  await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  await page.getByRole("link", { name: "Liên hệ", exact: true }).click();
  await idle(page);
  const field = page.getByLabel("Nội dung *", {exact:true});
  await field.fill("Nội dung vẫn còn sau khi khép sách.");
  await field.press("ArrowLeft");
  await expect(page.locator("#page-6")).toBeVisible();
  await next(page).click(); await idle(page);
  await prev(page).click(); await idle(page);
  await expect(field).toHaveValue("Nội dung vẫn còn sau khi khép sách.");
  await page.getByRole("link",{name:"Quay về trang đầu"}).click(); await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  await prev(page).click(); await idle(page);
  await expect(page.locator("#page--1")).toBeVisible();
});

test("reduced motion still opens and closes the actual covers", async ({ page }) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await next(page).click(); await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  await prev(page).click(); await idle(page);
  await expect(page.locator("#page--1")).toBeVisible();
  await expect(page.locator(".turn-sheet")).toHaveCount(0);
});

test("native touch swipes open and close the front board", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Native CDP touch injection requires Chromium");
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  async function swipe(selector: string, direction: number) {
    const box = await page.locator(selector).boundingBox();
    if (!box) throw Error("Missing touch surface");
    const x = box.x + box.width * (direction < 0 ? .85 : .15), y = box.y + box.height * .4;
    await client.send("Input.dispatchTouchEvent", {type:"touchStart", touchPoints:[{x,y}]});
    for(let i=1;i<=12;i++) await client.send("Input.dispatchTouchEvent", {
      type:"touchMove", touchPoints:[{x:x + direction * box.width * .6 * i / 12,y:y+2}],
    });
    await client.send("Input.dispatchTouchEvent", {type:"touchEnd",touchPoints:[]});
    await idle(page);
  }
  await swipe("#page--1", -1);
  await expect(page.locator("#page-1")).toBeVisible();
  await swipe("#page-0", 1);
  await expect(page.locator("#page--1")).toBeVisible();
  await client.detach();
});

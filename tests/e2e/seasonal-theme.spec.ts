import { test, expect } from "@playwright/test";
import { blockBackgroundMusic } from "./media-helpers";

test("seasonal decoration preserves reading, light/dark and reduced motion", async ({ page }, info) => {
  const halloween = process.env.NEXT_PUBLIC_SITE_THEME === "halloween";
  await blockBackgroundMusic(page);
  const requested: string[] = [];
  page.on("request", request => requested.push(request.url()));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-site-theme", halloween ? "halloween" : "christmas");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".book > .book-page:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-cover", "open");
  await expect(page.locator(".book > .book-page:visible")).toHaveCount(2);
  await expect(page.locator(".cottage-background")).toHaveCount(1);
  if (!halloween) {
    await expect(page.locator(".falling-leaves, .halloween-visitors")).toHaveCount(0);
    await expect(page.locator(".christmas-lights")).toHaveCSS("pointer-events", "none");
    await expect(page.locator(".christmas-snow")).toHaveCSS("pointer-events", "none");
    await expect(page.locator(".snow-crystal")).toHaveCount(9);
    expect(requested.some(url => /halloween|Halloween/.test(url))).toBe(false);
  }
  await page.screenshot({ path: info.outputPath("open-book.png"), fullPage: true });
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator("#page-2")).toBeVisible();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
  await page.getByRole("button", { name: "Chuyển sang chế độ tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (!halloween) {
    await expect(page.locator(".christmas-snow")).toBeHidden();
    await expect(page.locator(".light-drop i").first()).toHaveCSS("animation-name", "none");
  }
});

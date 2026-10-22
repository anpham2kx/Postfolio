import { expect, test, type Page } from "@playwright/test";
import { blockBackgroundMusic } from "./media-helpers";

async function idle(page: Page) {
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
}

async function recordSheets(page: Page) {
  await page.locator(".turn-layer").evaluate((layer) => {
    const sheets: number[] = [];
    const observer = new MutationObserver(() => {
      const front = layer.querySelector<HTMLElement>(".turn-front");
      if (front) sheets.push(Number(front.dataset.page));
      layer.setAttribute("data-test-sheets", JSON.stringify(sheets));
    });
    observer.observe(layer, { childList: true });
  });
}

test.beforeEach(async ({ page }) => {
  await blockBackgroundMusic(page);
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await idle(page);
});

test("compact white paper, brown cover, one-line name and arrow navigation", async ({
  page,
}) => {
  await expect(page.locator("#page-1")).toBeVisible();
  await expect(page.locator(".book")).toHaveAttribute("data-mode", "2");
  await expect(page.locator(".book-page:not([hidden])")).toHaveCount(2);
  await expect(page.locator(".view-toggle")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Kết nối", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".book-cover .paper-footer")).toHaveCount(0);
  expect(
    await page
      .locator(".book-shell")
      .evaluate((node) => getComputedStyle(node, "::after").content),
  ).toBe("none");
  await expect(page.locator(".chapter-tabs")).toHaveCount(0);
  await expect(page.getByText("Một cuốn sách.", { exact: false })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Không cần đọc theo thứ tự.", { exact: false }),
  ).toHaveCount(0);
  const geometry = await page.locator("h1").evaluate((heading) => {
    const range = document.createRange();
    range.selectNodeContents(heading);
    return {
      lines: range.getClientRects().length,
      fits: heading.scrollWidth <= heading.clientWidth,
    };
  });
  expect(geometry).toEqual({ lines: 1, fits: true });
  const book = await page.locator(".book").boundingBox();
  expect(book?.width).toBeLessThanOrEqual(944);
  expect(book?.height).toBeLessThanOrEqual(560);
  if ((await page.locator(".book").getAttribute("data-mode")) === "2") {
    const cover = await page.locator("#page-0").boundingBox();
    const intro = await page.locator("#page-1").boundingBox();
    expect(cover?.x).toBeLessThan(intro?.x ?? 0);
  }
  for (const dark of [false, true]) {
    if (dark)
      await page
        .getByRole("button", { name: "Chuyển sang chế độ tối" })
        .click();
    expect(
      await page
        .locator("#page-1")
        .evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe("rgb(255, 255, 255)");
  }
  await page.getByRole("link", { name: "Liên hệ", exact: true }).click();
  await idle(page);
  const contact = await page.locator("#page-6").boundingBox();
  const backCover = await page.locator("#page-7").boundingBox();
  expect(contact?.x).toBeLessThan(backCover?.x ?? 0);
  await expect(page.locator("#page-7")).toHaveClass(/book-cover/);
  await expect(page.locator("#page-6 form")).toBeVisible();
  await expect(page.locator(".page-count")).toHaveText("06 / 06");
});

test("far jumps turn every intermediate sheet in both directions with one input lock", async ({
  page,
}) => {
  await recordSheets(page);
  await page.getByRole("link", { name: "Liên hệ", exact: true }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "settling");
  await page
    .getByRole("button", { name: "Phạm Thanh An — về trang đầu" })
    .dispatchEvent("click");
  await page.keyboard.press("ArrowLeft");
  await idle(page);
  await expect(page.locator("#page-6")).toBeVisible();
  expect(
    JSON.parse(
      (await page.locator(".turn-layer").getAttribute("data-test-sheets")) ??
        "[]",
    ),
  ).toEqual([1, 3, 5]);
  await page
    .getByRole("button", { name: "Phạm Thanh An — về trang đầu" })
    .click();
  await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  expect(
    JSON.parse(
      (await page.locator(".turn-layer").getAttribute("data-test-sheets")) ??
        "[]",
    ),
  ).toEqual([1, 3, 5, 6, 4, 2]);
});

test("Escape or resize cancels a jump queue at the last completed sheet", async ({
  page,
}) => {
  // Freeze between physical sheets so browser-driver latency cannot let the
  // whole animation finish before Escape/resize is delivered (notably Firefox).
  await page.clock.install({ time: 0 });
  await page.reload();
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await idle(page);
  await page.clock.pauseAt(60000);
  await page.getByRole("link", { name: "Liên hệ", exact: true }).click();
  // The second animated sheet proves that one turn has already committed.
  await page.clock.runFor(360);
  await expect(page.locator(".turn-front")).toHaveAttribute("data-page", "3");
  await page.keyboard.press("Escape");
  await idle(page);
  await expect(page.locator("#page-2")).toBeVisible();
  await page
    .getByRole("button", { name: "Phạm Thanh An — về trang đầu" })
    .click();
  await page.clock.runFor(600);
  await idle(page);
  await page.getByRole("link", { name: "Liên hệ", exact: true }).click();
  await page.clock.runFor(360);
  await expect(page.locator(".turn-front")).toHaveAttribute("data-page", "3");
  await page.setViewportSize({ width: 320, height: 568 });
  await idle(page);
  await expect(page.locator("#page-2")).toBeVisible();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await page.clock.runFor(600);
  await idle(page);
  await expect(page.locator("#page-4")).toBeVisible();
});

test("contact accepts one character and 5000 characters, rejects whitespace", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("link", { name: "Liên hệ", exact: true }).click();
  await idle(page);
  const messages: string[] = [];
  await page.route("https://api.emailjs.com/**", async (route) => {
    const body = route.request().postDataJSON() as {
      template_params: { message: string };
    };
    messages.push(body.template_params.message);
    await route.fulfill({ status: 200, body: "OK" });
  });
  for (const message of [" ", "a", "x".repeat(5000)]) {
    await page.getByLabel("Họ tên", { exact: false }).fill("Test User");
    await page.getByLabel("Email *", { exact: true }).fill("test@example.com");
    await page.getByLabel("Nội dung *", { exact: true }).fill(message);
    await page.getByRole("button", { name: "Gửi tin nhắn" }).click();
    if (message.trim())
      await expect(page.getByLabel("Nội dung *", { exact: true })).toHaveValue(
        "",
      );
    else
      await expect(page.locator("#message-error")).toHaveText(
        "Nội dung cần từ 1 đến 5.000 ký tự.",
      );
  }
  expect(messages).toEqual(["a", "x".repeat(5000)]);
});

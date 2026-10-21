import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(".book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
}
async function idle(page: Page) {
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
}
async function mode(page: Page) {
  return Number(await page.locator(".book").getAttribute("data-mode"));
}
async function goContact(page: Page) {
  await page.getByRole("link", { name: "Liên hệ với An" }).click();
  await idle(page);
  await expect(page.locator("#page-7")).toBeVisible();
}
async function drag(page: Page, distance: number, pause = 0) {
  const box = await page.locator(".book").boundingBox();
  if (!box) throw new Error("No book box");
  const x = box.x + box.width - 6;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - distance, y, { steps: 12 });
  if (pause) await page.waitForTimeout(pause); // Intentional dwell to remove flick velocity.
  return { x, y, box };
}

test.beforeEach(async ({ page }) => {
  await ready(page);
});

test("source content, local assets, empty projects, and original links are retained", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(
    page.getByRole("heading", { name: "Pham Thanh An." }),
  ).toBeVisible();
  await expect(page.locator(".cover-bio")).toContainText(
    "Hi, I'm An, a passionate Software Engineer",
  );
  const links = await page
    .locator("#page-0 .social-links a")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  expect(links).toEqual([
    "https://www.facebook.com/pham.thanh.an.2550",
    "https://t.me",
    "https://zalo.me/0375480845",
    "https://github.com/AnPham1820",
  ]);
  await expect(page.locator("#page-4")).toContainText("85/150");
  await expect(page.locator("#page-5")).toContainText(
    "Website gốc hiện chưa đăng nội dung dự án.",
  );
  expect(
    await page
      .locator(".avatar-frame img")
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
  ).toBe(true);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [
      document.fonts.check('400 16px "Manrope"'),
      document.fonts.check('400 16px "Lora"'),
    ];
  });
  expect(fonts).toEqual([true, true]);
  expect(errors).toEqual([]);
});

test("buttons reach both boundaries in order; rapid inputs do not double-turn", async ({
  page,
}) => {
  const step = await mode(page);
  await expect(
    page.getByRole("button", { name: "Trang trước", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Trang sau", exact: true })
    .evaluate((button) => {
      for (let index = 0; index < 8; index++)
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  await idle(page);
  await expect(page.locator(`#page-${step}`)).toBeVisible();
  for (let index = step * 2; index < 8; index += step) {
    await page.getByRole("button", { name: "Trang sau", exact: true }).click();
    await idle(page);
    await expect(page.locator(`#page-${index}`)).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "Trang sau", exact: true }),
  ).toBeDisabled();
  for (
    let index = Math.floor(7 / step) * step - step;
    index >= 0;
    index -= step
  ) {
    await page
      .getByRole("button", { name: "Trang trước", exact: true })
      .click();
    await idle(page);
    await expect(page.locator(`#page-${index}`)).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "Trang trước", exact: true }),
  ).toBeDisabled();
});

test("keyboard works, ignores typing, and form drafts survive page changes", async ({
  page,
}) => {
  const step = await mode(page);
  await page.keyboard.press("ArrowRight");
  await idle(page);
  await expect(page.locator(`#page-${step}`)).toBeVisible();
  await page
    .getByRole("button", { name: "Phạm Thanh An — về trang đầu" })
    .click();
  await idle(page);
  await goContact(page);
  await page.getByLabel("Họ tên", { exact: false }).fill("Test User");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#page-7")).toBeVisible();
  await page.getByRole("button", { name: "Trang trước", exact: true }).click();
  await idle(page);
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await idle(page);
  await expect(page.getByLabel("Họ tên", { exact: false })).toHaveValue(
    "Test User",
  );
});

test("drag follows the pointer, short drag cancels, outside release commits", async ({
  page,
}, testInfo) => {
  await page.evaluate(() => {
    const events: unknown[] = [];
    Object.assign(window, { bookPointerTrace: events });
    for (const type of [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "lostpointercapture",
      "gotpointercapture",
      "resize",
      "blur",
    ]) {
      window.addEventListener(type, (event) => {
        const pointer = event as PointerEvent;
        events.push({
          type,
          x: pointer.clientX,
          id: pointer.pointerId,
          target: (event.target as Element)?.className,
          phase: document.querySelector<HTMLElement>(".book")?.dataset.phase,
          selected: window.getSelection()?.toString(),
        });
      });
    }
  });
  const step = await mode(page);
  await drag(page, 18, 150);
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "dragging");
  const transform = await page
    .locator(".turn-sheet")
    .evaluate((node) => (node as HTMLElement).style.transform);
  expect(transform).toContain("rotateY");
  expect(transform).not.toBe("rotateY(0deg)");
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page-0")).toBeVisible();
  const { y } = await drag(page, 80);
  await page.mouse.move(1, y, { steps: 15 });
  await page.mouse.up();
  await idle(page);
  await testInfo.attach("pointer-events", {
    body: JSON.stringify(
      await page.evaluate(
        () =>
          (window as unknown as { bookPointerTrace: unknown[] })
            .bookPointerTrace,
      ),
    ),
    contentType: "application/json",
  });
  await expect(page.locator(`#page-${step}`)).toBeVisible();
});

test("pointer cancel, lost capture and resize never leave a locked turn", async ({
  page,
}) => {
  for (const event of ["pointercancel", "lostpointercapture"]) {
    await drag(page, 80);
    if (event === "lostpointercapture")
      await page.locator(".book").evaluate((node) => {
        if (node.hasPointerCapture(1)) node.releasePointerCapture(1);
      });
    else await page.locator(".book").dispatchEvent(event, { pointerId: 1 });
    await page.mouse.up();
    await idle(page);
    await expect(page.locator("#page-0")).toBeVisible();
  }
  await drag(page, 80);
  const current = page.viewportSize();
  // Cross the book's actual sizing range; a viewport change above max-width
  // leaves the paper geometry unchanged and should not cancel a valid turn.
  await page.setViewportSize({
    width: (current?.width ?? 1440) >= 900 ? 640 : 320,
    height: current?.height ?? 1024,
  });
  await idle(page);
  await page.mouse.up();
  await idle(page);
  await expect(page.locator("#page-0")).toBeVisible();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await idle(page);
  await expect(page.locator(`#page-${await mode(page)}`)).toBeVisible();
});

test("one/two-page resize preserves the exact reading leaf and scroll offset", async ({
  page,
}) => {
  await goContact(page);
  await page
    .getByLabel("Nội dung *", { exact: true })
    .fill("Draft survives a responsive layout change.");
  await page.setViewportSize({ width: 1440, height: 1024 });
  await expect(page.locator(".book")).toHaveAttribute("data-mode", "2");
  await page.getByLabel("Nội dung *", { exact: true }).focus();
  await page.setViewportSize({ width: 390, height: 650 });
  await expect(page.locator(".book")).toHaveAttribute("data-mode", "1");
  await expect(page.locator("#page-7")).toBeVisible();
  await expect(page.getByLabel("Nội dung *", { exact: true })).toHaveValue(
    "Draft survives a responsive layout change.",
  );
  const content = page.locator("#page-7 .page-content");
  await content.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect
    .poll(() => content.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0);
  const old = await content.evaluate((node) => node.scrollTop);
  await page.getByRole("button", { name: "Trang trước", exact: true }).click();
  await idle(page);
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await idle(page);
  expect(
    await content.evaluate((node) => node.scrollTop),
  ).toBeGreaterThanOrEqual(old - 2);
});

test("form validates, preserves failure, locks concurrent sends, clears only on success", async ({
  page,
}) => {
  await goContact(page);
  let requests = 0;
  let respond: (() => void) | undefined;
  await page.route("https://api.emailjs.com/**", async (route) => {
    requests++;
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    expect(payload).toEqual({
      service_id: "service_hzhh52o",
      template_id: "template_j5k4p8q",
      user_id: "QCLgOuRqCwyGGQ2hW",
      template_params: {
        from_name: "Test User",
        from_email: "test@example.com",
        message: "This is a mocked test message.",
      },
    });
    if (requests === 1) {
      await route.fulfill({ status: 500, body: "Test failure" });
      return;
    }
    await new Promise<void>((resolve) => {
      respond = resolve;
    });
    await route.fulfill({ status: 200, contentType: "text/plain", body: "OK" });
  });
  await page.getByRole("button", { name: "Gửi tin nhắn" }).click();
  await expect(page.getByText("Họ tên cần từ 2 đến 100 ký tự.")).toBeVisible();
  expect(requests).toBe(0);
  await page.getByLabel("Họ tên", { exact: false }).fill("Test User");
  await page.getByLabel("Email *", { exact: true }).fill("test@example.com");
  await page
    .getByLabel("Nội dung *", { exact: true })
    .fill("This is a mocked test message.");
  await page.getByRole("button", { name: "Gửi tin nhắn" }).click();
  await expect(page.locator(".form-notice")).toContainText(
    "Chưa gửi được tin nhắn",
  );
  await expect(page.getByLabel("Họ tên", { exact: false })).toHaveValue(
    "Test User",
  );
  await page.getByRole("button", { name: "Gửi tin nhắn" }).click();
  await expect(
    page.getByRole("button", { name: "Đang gửi..." }),
  ).toBeDisabled();
  await page.locator(".contact-form").dispatchEvent("submit");
  await expect.poll(() => requests).toBe(2);
  await expect.poll(() => Boolean(respond)).toBe(true);
  respond?.();
  await expect(page.locator(".form-notice")).toContainText(
    "đã được gửi thành công",
  );
  for (const field of ["from_name", "from_email", "message"])
    await expect(page.locator(`[name='${field}']`)).toHaveValue("");
  expect(requests).toBe(2);
});

test("simple mode, reduced motion and theme preferences remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Trải nghiệm sách 3D" }).click();
  await expect(page.locator(".book")).toHaveAttribute("data-simple", "true");
  await page.getByRole("button", { name: "Chuyển sang chế độ tối" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await goContact(page);
  await expect(page.locator(".turn-layer")).toBeHidden();
  await page.reload();
  await idle(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".book")).toHaveAttribute("data-simple", "true");
});

test("text selection is native; links are not captured by the drag gesture", async ({
  page,
}) => {
  await page.locator(".cover-bio").evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#page-0")).toBeVisible();
  expect(
    await page.evaluate(() => window.getSelection()?.toString()),
  ).toContain("Hi, I'm An");
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await page
    .locator("#page-0 .social-links a")
    .first()
    .dispatchEvent("pointerdown", {
      pointerId: 10,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: 250,
      clientY: 400,
    });
  await expect(page.locator(".book")).toHaveAttribute("data-phase", "idle");
});

test("all content stays within the book, long form scrolls, and no horizontal overflow", async ({
  page,
}) => {
  for (let index = 0; index < 8; index += await mode(page)) {
    const dimensions = await page
      .locator(".book-page:not([hidden]) .page-content")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          client: node.clientWidth,
          scroll: node.scrollWidth,
          height: node.clientHeight,
          scrollHeight: node.scrollHeight,
          overflow: getComputedStyle(node).overflowY,
        })),
      );
    for (const item of dimensions) {
      expect(item.scroll).toBeLessThanOrEqual(item.client + 1);
      expect(item.overflow).toBe("auto");
      expect(item.height).toBeGreaterThan(300);
    }
    if (index + (await mode(page)) < 8) {
      await page
        .getByRole("button", { name: "Trang sau", exact: true })
        .click();
      await idle(page);
    }
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByLabel("Nội dung *", { exact: true })
    .fill("A long message. ".repeat(300));
  await expect(
    page.getByRole("button", { name: "Gửi tin nhắn" }),
  ).toBeEnabled();
});

test("accessibility audit: cover, content, contact, and dark theme", async ({
  page,
}) => {
  for (const stage of ["cover", "content", "contact", "dark"] as const) {
    if (stage === "content") {
      await page
        .getByRole("button", { name: "Trang sau", exact: true })
        .click();
      await idle(page);
    }
    if (stage === "contact") {
      await page
        .getByRole("button", { name: "Phạm Thanh An — về trang đầu" })
        .click();
      await idle(page);
      await goContact(page);
    }
    if (stage === "dark")
      await page
        .getByRole("button", { name: "Chuyển sang chế độ tối" })
        .click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      `${stage}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
    ).toEqual([]);
  }
});

test("capture desktop/tablet/phone light and dark views", async ({
  page,
}, testInfo) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-light.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Chuyển sang chế độ tối" }).click();
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-dark.png`,
    fullPage: true,
  });
  await goContact(page);
  await page.screenshot({
    path: `docs/screenshots/${testInfo.project.name}-contact.png`,
    fullPage: true,
  });
});

test("real Chromium touch: vertical pans scroll; horizontal swipe turns", async ({
  page,
  browserName,
  context,
}) => {
  test.skip(
    browserName !== "chromium",
    "CDP touch injection is Chromium-specific; other engines cover pointer and layout tests.",
  );
  await page.setViewportSize({ width: 390, height: 650 });
  await expect(page.locator(".book")).toHaveAttribute("data-mode", "1");
  const client = await context.newCDPSession(page);
  const box = await page.locator("#page-0 .page-content").boundingBox();
  if (!box) throw new Error("Missing content");
  const x = box.x + box.width / 2;
  const y = box.y + box.height - 80;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 8; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + 3, y: y - i * 25 }],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator("#page-0")).toBeVisible();
  await expect
    .poll(() =>
      page.locator("#page-0 .page-content").evaluate((node) => node.scrollTop),
    )
    .toBeGreaterThan(0);
  const startX = box.x + box.width - 30;
  const startY = box.y + 100;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: startX, y: startY }],
  });
  for (let i = 1; i <= 9; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: startX - i * 25, y: startY + 2 }],
    });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await idle(page);
  await expect(page.locator("#page-1")).toBeVisible();
  await client.detach();
});

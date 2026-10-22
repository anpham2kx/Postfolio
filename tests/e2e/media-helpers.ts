import type { Page } from "@playwright/test";

/** Book-only tests do not need to stream the user's 84 MB track. */
export function blockBackgroundMusic(page: Page) {
  return page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(
        new DOMException(
          "Audio disabled in book-only tests",
          "NotAllowedError",
        ),
      );
  });
}

import { christmas } from "./christmas";
import { halloween } from "./halloween";

export const themes = { christmas, halloween } as const;
export type ThemeId = keyof typeof themes;

/** Resolve on the server: only the selected decorations reach the page. */
export function getSiteTheme(value = process.env.NEXT_PUBLIC_SITE_THEME) {
  return value && Object.hasOwn(themes, value)
    ? themes[value as ThemeId]
    : themes.christmas;
}

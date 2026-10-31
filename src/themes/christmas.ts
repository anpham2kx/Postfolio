import { ChristmasEffects, ChristmasRecord } from "@/components/christmas-effects";
import type { SiteTheme } from "./types";

export const christmas: SiteTheme = {
  id: "christmas",
  name: "Giáng sinh",
  background: "/themes/christmas/background.webp",
  music: "/themes/christmas/music.mp3",
  colors: {
    "--cover": "#153d33",
    "--accent": "#943b40",
    "--accent-hover": "#72282e",
    "--accent-soft": "#f8eeee",
    "--paper": "#fffdf7",
    "--paper-alt": "#f5f3ea",
    "--input": "#faf9f4",
    "--text": "#243d35",
    "--muted": "#626c61",
    "--line": "#dadccf",
  },
  Effects: ChristmasEffects,
  Record: ChristmasRecord,
};

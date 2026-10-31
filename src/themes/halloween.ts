import { AutumnBackground } from "@/components/autumn-background";
import { HalloweenRecord } from "@/components/halloween-record";
import type { SiteTheme } from "./types";

export const halloween: SiteTheme = {
  id: "halloween",
  name: "Halloween",
  background: "/images/Background_Halloween_Cozy_Cottage.jpg",
  music: "/audio/autumn-halloween.mp3",
  colors: {},
  Effects: AutumnBackground,
  Record: HalloweenRecord,
};

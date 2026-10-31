import type { CSSProperties, ComponentType } from "react";

export interface SiteTheme {
  id: string;
  name: string;
  background: string;
  music: string;
  colors: CSSProperties & Record<`--${string}`, string>;
  Effects: ComponentType;
  Record: ComponentType;
}

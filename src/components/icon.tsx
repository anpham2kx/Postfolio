import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Facebook,
  Gamepad2,
  Github,
  GraduationCap,
  Headphones,
  LayoutList,
  Mail,
  Moon,
  Phone,
  Send,
  Sun,
} from "lucide-react";

const icons = {
  arrowDown: ArrowDown,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  external: ArrowUpRight,
  book: BookOpen,
  check: Check,
  code: Code2,
  facebook: Facebook,
  gamepad: Gamepad2,
  github: Github,
  graduation: GraduationCap,
  headphones: Headphones,
  list: LayoutList,
  mail: Mail,
  moon: Moon,
  phone: Phone,
  send: Send,
  sun: Sun,
};
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return (
    <Component
      size={size}
      strokeWidth={1.6}
      className={className}
      aria-hidden="true"
    />
  );
}

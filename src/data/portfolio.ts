/** Transcribed from the public source bundle on 2026-10-21. See reference/CONTENT-AUDIT.md. */
export const profile = {
  name: "Pham Thanh An",
  fullName: "Phạm Thanh An",
  role: "Software Engineer",
  avatar: "/images/avatar.webp",
  bio: "Hi, I'm An, a passionate Software Engineer with a strong foundation in full-stack development. I love creating elegant, user-friendly applications and am always eager to learn new technologies that push the boundaries of what's possible on the web.",
  source: "https://www.anpham2kx.io.vn/",
} as const;

export const socialLinks = [
  {
    name: "Facebook",
    label: "Facebook",
    href: "https://www.facebook.com/pham.thanh.an.2550",
    icon: "facebook",
  },
  {
    name: "Telegram",
    label: "Telegram",
    href: "https://t.me/anpham2kx",
    icon: "send",
  },
  {
    name: "Điện thoại",
    label: "Điện thoại · Zalo",
    href: "https://zalo.me/0375480845",
    icon: "phone",
  },
  {
    name: "GitHub",
    label: "GitHub",
    href: "https://github.com/anpham2kx",
    icon: "github",
  },
] as const;

export const hobbies = [
  {
    title: "Lập trình web/app",
    description:
      "Yêu thích code các ứng dụng, website, mobile app để giải quyết các vấn đề thực tế trong cuộc sống.",
    icon: "code",
  },
  {
    title: "Chơi Game",
    description: "Thích chơi các tựa game chiến thuật, giải trí để xả stress.",
    icon: "gamepad",
  },
  {
    title: "Nghe nhạc",
    description:
      "Thích nghe nhạc, đặc biệt là nhạc Lofi, giúp tăng hiệu suất tập trung cao khi làm việc và học tập.",
    icon: "headphones",
  },
] as const;

export const skillGroups = [
  {
    title: "Frontend Development",
    skills: [
      { name: "HTML5 / CSS3 / JavaScript", level: 90 },
      { name: "ReactJS", level: 85 },
      { name: "Tailwind CSS / Sass", level: 80 },
    ],
  },
  {
    title: "Backend Development",
    skills: [
      { name: "Node.js / Express.js", level: 75 },
      { name: "MongoDB / PostgreSQL", level: 70 },
    ],
  },
] as const;

export const otherTools = [
  "Git / GitHub",
  "Docker",
  "Vite",
  "REST API",
  "Figma",
  "VS Code",
] as const;
export const education = {
  period: "2023 - Hiện tại",
  institution: "Học Viện Công Nghệ Bưu Chính Viễn Thông (PTIT)",
  major: "Chuyên ngành Công Nghệ Phần Mềm",
  gpa: "Điểm trung bình tích lũy hiện tại (GPA): 3.2/4.0.",
  credits: "Số tín chỉ đã tích lũy: 85/150.",
} as const;

export interface Project {
  title: string;
  description: string;
  image?: string;
  href: string;
}
// The original DỰ ÁN section has no entries. Do not replace this with fictional projects.
export const projects: readonly Project[] = [];

export const chapters = [
  {
    id: "gioi-thieu",
    title: "Giới thiệu",
    page: 1,
  },
  {
    id: "so-thich",
    title: "Sở thích",
    page: 2,
  },
  { id: "ky-nang", title: "Kỹ năng", page: 3 },
  { id: "hoc-van", title: "Học vấn", page: 4 },
  { id: "du-an", title: "Dự án", page: 5 },
  {
    id: "lien-he",
    title: "Liên hệ",
    page: 6,
  },
] as const;
export const pageTitles = [
  "Bìa trước",
  "Giới thiệu",
  "Sở thích",
  "Kỹ năng",
  "Học vấn",
  "Dự án",
  "Liên hệ",
  "Bìa sau",
] as const;

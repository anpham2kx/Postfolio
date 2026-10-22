import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "Pham Thanh An — The Portfolio Book",
  description:
    "Portfolio của Phạm Thanh An, Software Engineer. Khám phá giới thiệu, sở thích, kỹ năng, học vấn và liên hệ qua trải nghiệm sách 3D.",
  icons: { icon: "/icon.png" },
  openGraph: {
    title: "Pham Thanh An — The Portfolio Book",
    description: "Portfolio của Phạm Thanh An, Software Engineer.",
    images: [
      {
        url: "/images/avatar.webp",
        width: 640,
        height: 960,
        alt: "Ảnh đại diện Phạm Thanh An",
      },
    ],
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('an-book-theme');document.documentElement.dataset.theme=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Đi đến nội dung
        </a>
        {children}
        <noscript>
          <style>{`.book-page{display:flex!important;position:relative!important;height:auto!important;min-height:500px}.book{display:block!important;height:auto!important}.page-content{overflow:visible!important}.book-controls,.music-player{display:none!important}`}</style>
          <p className="noscript-note">
            JavaScript đang tắt. Bạn vẫn có thể đọc đầy đủ nội dung theo chiều
            dọc; form, nhạc nền và hiệu ứng lật sách cần JavaScript.
          </p>
        </noscript>
      </body>
    </html>
  );
}

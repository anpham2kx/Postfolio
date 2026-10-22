"use client";

import { useEffect, useState, type ReactNode } from "react";
import { pageTitles } from "@/data/portfolio";
import { spreadStart } from "@/lib/book-machine";
import { useBook } from "@/hooks/use-book";
import { Icon } from "./icon";

export function Book({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const { rootRef, snapshot, navigate } = useBook(pageTitles.length);
  const start = spreadStart(snapshot.anchor);
  const last = Math.min(start + 2, pageTitles.length);
  const contentTotal = pageTitles.length - 2;
  const firstContent = Math.max(1, start);
  const lastContent = Math.min(last - 1, contentTotal);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    function readPreferences() {
      try {
        setDark(document.documentElement.dataset.theme === "dark");
      } catch {
        setDark(query.matches);
      }
    }
    function systemChanged() {
      try {
        if (localStorage.getItem("an-book-theme")) return;
      } catch {
        /* Storage is optional. */
      }
      document.documentElement.dataset.theme = query.matches ? "dark" : "light";
      setDark(query.matches);
    }
    readPreferences();
    query.addEventListener("change", systemChanged);
    return () => query.removeEventListener("change", systemChanged);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("an-book-theme", next ? "dark" : "light");
    } catch {
      /* Keep working without storage. */
    }
  }
  return (
    <>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate(-1, 1)}
          aria-label="Phạm Thanh An — về trang đầu"
        >
          <span className="brand-mark">
            a<span>.</span>
          </span>
          <span>AN PHAM</span>
        </button>
        <div className="header-right">
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={
              dark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
            }
          >
            <Icon name={dark ? "sun" : "moon"} />
          </button>
        </div>
      </header>
      <main id="main-content">
        <div className="book-stage">
          <div className="book-shell">
            <div
              ref={rootRef}
              className="book"
              data-mode="2"
              role="region"
              aria-label="Sách portfolio Phạm Thanh An"
              aria-describedby="book-instructions"
              title="Kéo ngang để lật sách. Giữ Shift và kéo để chọn chữ."
            >
              {children}
              <div className="turn-layer" aria-hidden="true" inert hidden />
            </div>
          </div>
          <div className="book-controls">
            <button
              className="page-arrow page-arrow-prev"
              onClick={() => navigate(-1)}
              disabled={start === 0 || snapshot.busy}
              aria-label="Trang trước"
            >
              <Icon name="arrowLeft" />
            </button>
            <div className="reading-progress">
              <span
                aria-live="polite"
                aria-atomic="true"
                className="page-count"
              >
                {String(firstContent).padStart(2, "0")}
                {lastContent > firstContent && (
                  <> — {String(lastContent).padStart(2, "0")}</>
                )}
                <span> / {String(contentTotal).padStart(2, "0")}</span>
              </span>
              <div className="progress-track" aria-hidden="true">
                <span
                  style={{ width: `${(lastContent / contentTotal) * 100}%` }}
                />
              </div>
            </div>
            <button
              className="page-arrow page-arrow-next"
              onClick={() => navigate(1)}
              disabled={last === pageTitles.length || snapshot.busy}
              aria-label="Trang sau"
            >
              <Icon name="arrowRight" />
            </button>
          </div>
        </div>
        <p className="sr-only" id="book-instructions">
          Dùng phím mũi tên, vuốt hoặc kéo ngang trên sách để lật trang. Giữ
          Shift và kéo hoặc nhấp đúp để chọn chữ. Liên kết, nút bấm và ô nhập
          liệu hoạt động bình thường. Nhấn Escape để hủy.
        </p>
      </main>
      <footer className="site-footer">
        <span>
          © Pham Thanh An<span className="footer-dot">·</span>Software Engineer
        </span>
      </footer>
    </>
  );
}

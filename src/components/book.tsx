"use client";

import { useEffect, useState, type ReactNode } from "react";
import { chapters, pageTitles } from "@/data/portfolio";
import { spreadStart } from "@/lib/book-machine";
import { useBook } from "@/hooks/use-book";
import { Icon } from "./icon";

export function Book({ children }: { children: ReactNode }) {
  const [simple, setSimple] = useState(false);
  const [dark, setDark] = useState(false);
  const { rootRef, snapshot, navigate } = useBook(pageTitles.length, simple);
  const start = spreadStart(snapshot.anchor, snapshot.mode);
  const last = Math.min(start + snapshot.mode, pageTitles.length);
  const activeChapter =
    [...chapters]
      .reverse()
      .find((chapter) => chapter.page <= snapshot.anchor) ?? chapters[0];

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    function readPreferences() {
      try {
        setDark(document.documentElement.dataset.theme === "dark");
        const saved = localStorage.getItem("an-book-simple");
        setSimple(
          saved === "true" ||
            (saved === null && navigator.hardwareConcurrency <= 2),
        );
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
  function toggleSimple() {
    setSimple(!simple);
    try {
      localStorage.setItem("an-book-simple", String(!simple));
    } catch {
      /* Optional preference. */
    }
  }
  return (
    <>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate(-1, 0)}
          aria-label="Phạm Thanh An — về trang đầu"
        >
          <span className="brand-mark">
            a<span>.</span>
          </span>
          <span>
            AN PHAM<span className="brand-caption">A PERSONAL PORTFOLIO</span>
          </span>
        </button>
        <div className="header-right">
          <span className="header-note">Một góc nhỏ của An.</span>
          <span className="header-divider" />
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
        <div className="reading-toolbar">
          <div className="breadcrumb">
            <Icon name="book" size={16} />
            <span>THE PORTFOLIO BOOK</span>
            <span className="breadcrumb-slash">/</span>
            <span className="current-chapter">{activeChapter.title}</span>
          </div>
          <button
            className="view-toggle"
            aria-pressed={simple}
            onClick={toggleSimple}
          >
            <Icon name={simple ? "list" : "book"} size={16} />
            <span>{simple ? "Hiển thị đơn giản" : "Trải nghiệm sách 3D"}</span>
          </button>
        </div>
        <div className="book-stage">
          <div className="book-shell">
            <div
              ref={rootRef}
              className="book"
              role="region"
              aria-label="Sách portfolio Phạm Thanh An"
              aria-describedby="book-instructions"
            >
              {children}
              <div className="turn-layer" aria-hidden="true" inert hidden />
              <div
                className="drag-margin drag-left"
                data-drag-handle
                aria-hidden="true"
                title="Giữ và kéo mép sách để lật trang"
              />
              <div
                className="drag-margin drag-right"
                data-drag-handle
                aria-hidden="true"
                title="Giữ và kéo mép sách để lật trang"
              />
            </div>
          </div>
          <nav className="chapter-tabs" aria-label="Chuyển nhanh đến chương">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                className={activeChapter.id === chapter.id ? "active" : ""}
                onClick={() =>
                  navigate(
                    chapter.page >= snapshot.anchor ? 1 : -1,
                    chapter.page,
                  )
                }
                disabled={snapshot.busy}
                aria-label={chapter.title}
                aria-current={
                  activeChapter.id === chapter.id ? "page" : undefined
                }
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className="tab-tooltip">{chapter.title}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="book-controls">
          <button
            className="page-arrow"
            onClick={() => navigate(-1)}
            disabled={start === 0 || snapshot.busy}
            aria-label="Trang trước"
          >
            <Icon name="arrowLeft" />
            <span>Trang trước</span>
          </button>
          <div className="reading-progress">
            <span aria-live="polite" aria-atomic="true" className="page-count">
              {String(start + 1).padStart(2, "0")}
              {snapshot.mode === 2 && <> — {String(last).padStart(2, "0")}</>}
              <span> / {String(pageTitles.length).padStart(2, "0")}</span>
            </span>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${(last / pageTitles.length) * 100}%` }} />
            </div>
          </div>
          <button
            className="page-arrow"
            onClick={() => navigate(1)}
            disabled={last === pageTitles.length || snapshot.busy}
            aria-label="Trang sau"
          >
            <span>Trang sau</span>
            <Icon name="arrowRight" />
          </button>
        </div>
        <p className="reading-hint" id="book-instructions">
          <span className="keycap">←</span>
          <span className="keycap">→</span>
          <span>
            Dùng phím mũi tên, vuốt ngang hoặc kéo mép sách để khám phá.
          </span>
        </p>
      </main>
      <footer className="site-footer">
        <span>
          © Pham Thanh An<span className="footer-dot">·</span>Software Engineer
        </span>
        <span className="footer-note">
          Từng trang, một câu chuyện.
          <Icon name="book" size={14} />
        </span>
      </footer>
    </>
  );
}

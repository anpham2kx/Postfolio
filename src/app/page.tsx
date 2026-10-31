import { Book } from "@/components/book";
import { BookPages } from "@/components/book-pages";
import { BackgroundMusic } from "@/components/background-music";
import { getSiteTheme } from "@/themes/registry";

export default function Home() {
  const theme = getSiteTheme();
  return (
    <>
      <div className="autumn-scene" aria-hidden="true">
        <div className="cottage-background" />
      </div>
      <theme.Effects />
      <Book>
        <BookPages />
      </Book>
      <BackgroundMusic src={theme.music}><theme.Record /></BackgroundMusic>
    </>
  );
}

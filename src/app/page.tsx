import { Book } from "@/components/book";
import { BookPages } from "@/components/book-pages";
import { AutumnBackground } from "@/components/autumn-background";
import { BackgroundMusic } from "@/components/background-music";

export default function Home() {
  return (
    <>
      <AutumnBackground />
      <Book>
        <BookPages />
      </Book>
      <BackgroundMusic />
    </>
  );
}

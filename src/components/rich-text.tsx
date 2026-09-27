import { Fragment } from "react";
import { Link } from "@/i18n/navigation";
import { INLINE_MARKUP_RE } from "@/lib/inline-markup";

type LinkHref = Parameters<typeof Link>[0]["href"];

/** Rendert Fließtext mit `[Text](url)`-Links und `**Text**`-Hervorhebungen. */
export function RichText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  // matchAll arbeitet auf einer Kopie des Regex – kein geteilter lastIndex.
  for (const m of text.matchAll(INLINE_MARKUP_RE)) {
    const index = m.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    if (m[3] !== undefined) {
      // Rekursiv, damit ein Link fett sein darf: **[Text](/pfad)**.
      out.push(
        <strong className="font-semibold text-navy">
          <RichText text={m[3]} />
        </strong>,
      );
    } else if (m[2].startsWith("/")) {
      // Interne Links über next-intl, damit /en/… in der Sprache bleibt. Die
      // Pfade stammen aus unserem Inhalt; der Cast überbrückt nur die Typisierung.
      out.push(
        <Link href={m[2] as LinkHref} className="text-royal underline hover:no-underline">
          {m[1]}
        </Link>,
      );
    } else {
      out.push(
        <a
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-royal underline hover:no-underline"
        >
          {m[1]}
        </a>,
      );
    }
    last = index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return (
    <>
      {out.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  );
}

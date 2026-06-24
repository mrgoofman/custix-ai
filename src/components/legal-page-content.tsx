"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";

const pageMap = {
  imprint: { titleKey: "imprintTitle", contentKey: "imprintContent" },
  privacy: { titleKey: "privacyTitle", contentKey: "privacyContent" },
  terms: { titleKey: "termsTitle", contentKey: "termsContent" },
} as const;

// Legal text is plain text with \n line breaks. We additionally support
// Markdown-style links — [label](https://…) — so e.g. the Cloudflare DPA can
// be linked inline. Everything else stays literal (no full Markdown parsing).
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g;

function renderWithLinks(text: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a
        key={`lnk-${i++}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-royal underline hover:no-underline"
      >
        {m[1]}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.map((n, idx) => <Fragment key={idx}>{n}</Fragment>);
}

export function LegalPageContent({
  pageKey,
}: {
  pageKey: keyof typeof pageMap;
}) {
  const t = useTranslations("legal");
  const { titleKey, contentKey } = pageMap[pageKey];

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-navy mb-8">
          {t(titleKey)}
        </h1>
        <div className="prose prose-slate max-w-none">
          {/* Plain text with \n line breaks + inline [label](url) links. */}
          <p className="text-slate-text/80 whitespace-pre-line">
            {renderWithLinks(t(contentKey))}
          </p>
        </div>
      </div>
    </section>
  );
}

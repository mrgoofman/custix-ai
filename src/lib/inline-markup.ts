/**
 * Die zwei Auszeichnungen, die Fließtext aus src/content enthalten darf:
 * `[Text](url)` für Links und `**Text**` für Hervorhebungen. Bewusst kein
 * Markdown-Parser – der Inhalt kommt aus dem Repo, nicht von Nutzern.
 * Gerendert wird in components/rich-text.tsx; hier liegt, was auch ohne
 * React gebraucht wird (strukturierte Daten, Meta-Texte).
 */
export const INLINE_MARKUP_RE =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;

/** Auszeichnungen entfernen – für strukturierte Daten und Meta-Texte. */
export function plainText(text: string): string {
  let out = text;
  // Mehrere Durchläufe, weil Auszeichnungen verschachtelt sein dürfen
  // (**[Text](/pfad)**); mehr als zwei Ebenen gibt es nicht.
  for (let pass = 0; pass < 3; pass++) {
    const next = out.replace(
      INLINE_MARKUP_RE,
      (_m, label, _url, bold) => label ?? bold ?? "",
    );
    if (next === out) break;
    out = next;
  }
  return out;
}

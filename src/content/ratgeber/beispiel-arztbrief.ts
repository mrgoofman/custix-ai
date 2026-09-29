import letter from "./beispiel-arztbrief.json";

/**
 * Der Beispiel-Arztbrief des Ratgebers „Arztbrief schreiben mit KI"
 * (mrgoofman/custix-ai#10). Eine Quelle für drei Ausgaben: die Darstellung im
 * Ratgeber (Vorlage und Platzhalter-Fassung) und die Downloads unter
 * /ratgeber/… (scripts/build-beispiel-arztbrief.py, Word und PDF).
 *
 * Personenbezogene Angaben stehen im JSON als `{{TYP:Wert}}`. Die
 * Platzhalter-Fassung ersetzt sie so, wie custix es tut: pro Typ und Wert ein
 * Platzhalter `[TYP_n]`, gleicher Wert → gleicher Platzhalter. Alle Daten sind
 * erfunden.
 */
export type LetterBlock =
  | { kind: "header" | "recipient" | "closing"; lines: string[] }
  | { kind: "date" | "subject" | "salutation" | "paragraph"; text: string }
  | { kind: "section"; heading: string; lines: string[] };

export type LetterVariant = "template" | "placeholders";

export type LetterSegment = { text: string; placeholder: boolean };

const MARKUP_RE = /\{\{([A-Z]+):([^}]+)\}\}/g;

export const BEISPIEL_ARZTBRIEF = letter as {
  title: string;
  notice: string;
  blocks: LetterBlock[];
};

/**
 * Nummeriert die Platzhalter über den ganzen Brief in Reihenfolge des ersten
 * Auftretens – so bleibt „[PERSON_2]" im Betreff dieselbe Person wie in der
 * Epikrise.
 */
export function letterSegments(variant: LetterVariant): Map<string, LetterSegment[]> {
  const ids = new Map<string, string>();
  const counters = new Map<string, number>();
  const placeholderFor = (type: string, value: string) => {
    const key = `${type}:${value}`;
    let id = ids.get(key);
    if (!id) {
      const n = (counters.get(type) ?? 0) + 1;
      counters.set(type, n);
      id = `[${type}_${n}]`;
      ids.set(key, id);
    }
    return id;
  };

  const out = new Map<string, LetterSegment[]>();
  const render = (text: string): LetterSegment[] => {
    const segments: LetterSegment[] = [];
    let last = 0;
    for (const m of text.matchAll(MARKUP_RE)) {
      const index = m.index ?? 0;
      if (index > last) segments.push({ text: text.slice(last, index), placeholder: false });
      const [, type, value] = m;
      segments.push(
        variant === "placeholders"
          ? { text: placeholderFor(type, value), placeholder: true }
          : { text: value, placeholder: false },
      );
      last = index + m[0].length;
    }
    if (last < text.length) segments.push({ text: text.slice(last), placeholder: false });
    return segments;
  };

  // Reihenfolge der Nummerierung = Lesereihenfolge des Briefs.
  BEISPIEL_ARZTBRIEF.blocks.forEach((block, b) => {
    const texts = "lines" in block ? block.lines : [block.text];
    texts.forEach((text, i) => out.set(`${b}:${i}`, render(text)));
  });
  return out;
}

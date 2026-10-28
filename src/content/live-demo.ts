/**
 * Beispiel-Akte der Live-Demo auf der Startseite (mrgoofman/custix-ai#15).
 *
 * Vorbereitete Vorher/Nachher-Ansicht, keine Erkennung im Browser (Entscheidung
 * Lorenz, 28.10.2026). Alles erfunden – keine echten Personen, Firmen oder
 * Verfahren. Die IBAN ist die übliche österreichische Beispiel-IBAN.
 *
 * Zwei Dokumente einer Akte, weil mehrere Dokumente der Normalfall sind
 * (znerol74/custix#43): Dieselbe Mandantin, dieselbe Firma, dieselbe Adresse
 * tragen in beiden Dokumenten denselben Platzhalter – so wie custix sie für
 * eine Akte vergibt. Platzhalter wie die Engine sie schreibt
 * (core/src/domain/entity.rs: PERSON, ORG, ADRESSE, AKTENZEICHEN, DATUM, IBAN),
 * die Geschäftszahl im österreichischen Format, das custix erkennt.
 *
 * Titel (Bauleiter, Mandantin) bleiben bewusst außerhalb der Fundstellen.
 */

export type DemoKind = "person" | "org" | "addr" | "id";

/** Text oder Fundstelle: `t` ist das Original, `ph` der Platzhalter. */
export type DemoSegment = string | { t: string; k: DemoKind; ph: string };

export type DemoDocument = { file: string; segments: DemoSegment[] };

const HUBER = { t: "Anna Huber", k: "person", ph: "[PERSON_1]" } as const;
const BERGER = { t: "Berger Bau GmbH", k: "org", ph: "[ORG_1]" } as const;
const ADRESSE = {
  t: "Mariahilfer Straße 45, 1060 Wien",
  k: "addr",
  ph: "[ADRESSE_1]",
} as const;
const GZ = { t: "12 Cg 45/26k", k: "id", ph: "[AKTENZEICHEN_1]" } as const;
const IBAN = { t: "AT61 1904 3002 3457 3201", k: "id", ph: "[IBAN_1]" } as const;
const GRUBER = { t: "Martin Gruber", k: "person", ph: "[PERSON_2]" } as const;

export const DEMO_DOCUMENTS: Record<"de" | "en", DemoDocument[]> = {
  de: [
    {
      file: "Stellungnahme.pdf",
      segments: [
        "In der Rechtssache ",
        HUBER,
        " gegen ",
        BERGER,
        ", ",
        GZ,
        ", nehmen wir zum Schreiben vom ",
        { t: "2. Oktober 2026", k: "id", ph: "[DATUM_1]" },
        " Stellung. Unsere Mandantin, wohnhaft ",
        ADRESSE,
        ", hat die Rechnung fristgerecht auf das Konto ",
        IBAN,
        " überwiesen.",
      ],
    },
    {
      file: "Gutachten.pdf",
      segments: [
        "Befund: Am ",
        { t: "21. Oktober 2026", k: "id", ph: "[DATUM_2]" },
        " wurde die Wohnung von ",
        HUBER,
        ", ",
        ADRESSE,
        ", besichtigt. Für die ",
        BERGER,
        " war Bauleiter ",
        GRUBER,
        " anwesend. Die Feuchtigkeit im Bad geht auf eine mangelhafte Abdichtung zurück.",
      ],
    },
  ],
  en: [
    {
      file: "Statement.pdf",
      segments: [
        "In the matter of ",
        HUBER,
        " v. ",
        BERGER,
        ", ",
        GZ,
        ", we respond to the letter of ",
        { t: "2 October 2026", k: "id", ph: "[DATUM_1]" },
        ". Our client, residing at ",
        ADRESSE,
        ", paid the invoice on time to the account ",
        IBAN,
        ".",
      ],
    },
    {
      file: "Expert_report.pdf",
      segments: [
        "Findings: On ",
        { t: "21 October 2026", k: "id", ph: "[DATUM_2]" },
        " the flat of ",
        HUBER,
        ", ",
        ADRESSE,
        ", was inspected. Site manager ",
        GRUBER,
        " attended for ",
        BERGER,
        ". The damp in the bathroom is due to faulty sealing.",
      ],
    },
  ],
};

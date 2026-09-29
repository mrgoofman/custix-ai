import type { Guide } from "./types";

/**
 * Ratgeber 7.1 (mrgoofman/custix-ai#6, #10). Kern-Keywords laut
 * docs/marketing/seo-keywords-aerzte.md, Abschnitt 1: „arztbrief schreiben“
 * (260/Monat, SD 14), „arztbrief vorlage“ (260, 11), „arztbrief beispiel(e)“
 * (320–480), „textbausteine arztbrief“ (110, 5), „formulierungshilfen
 * arztbrief", „epikrise schreiben“, „chatgpt arztbrief“.
 *
 * `hidden: true` bis zum Ärzte-Go-live (mrgoofman/custix-ai#11): Der Ablauf
 * „mehrere Befunde → ein Arztbrief“ braucht den Stapel der Web-App. Der
 * Beispiel-Arztbrief kommt aus beispiel-arztbrief.json (auch Downloads).
 * Leitplanken: Beispieldaten erfunden und so markiert, keine Diagnose- oder
 * Therapieaussagen als Rat, KI-Anbieter neutral, „pseudonymisiert“ bei custix.
 */
const DL = "/ratgeber";

export const arztbriefSchreibenMitKi: Guide = {
  routeKey: "/ratgeber/arztbrief-schreiben-mit-ki",
  hidden: true,
  title: "Arztbrief schreiben mit KI: Vorlage, Textbausteine und Beispiel – ohne Patientendaten preiszugeben",
  metaTitle: "Arztbrief schreiben mit KI: Vorlage, Beispiel, Textbausteine | custix",
  description:
    "Arztbrief schreiben mit KI, ohne Patientendaten preiszugeben: Ablauf mit Pseudonymisierung, Aufbau, Textbausteine und Formulierungshilfen, Beispiel-Arztbrief als Vorlage (Word und PDF) zum Download.",
  teaser:
    "Wie Sie Befunde pseudonymisieren, den Entwurf von ChatGPT, Claude oder Gemini schreiben lassen und die Namen wieder einsetzen. Mit Aufbau, Textbausteinen, Formulierungshilfen und einem kostenlosen Beispiel-Arztbrief zum Download.",
  published: "2026-09-29",
  updated: "2026-09-29",
  readingMinutes: 12,
  intro: [
    "Der Arztbrief ist die Stelle, an der Zeit fehlt: Befunde liegen vor, der Verlauf ist klar, aber der Text muss erst geschrieben werden. KI-Werkzeuge können daraus in Sekunden einen brauchbaren Entwurf machen. Nur: Ein Befund mit Namen, Geburtsdatum und Versicherungsnummer darf nicht in ChatGPT & Co., das verbietet die [ärztliche Schweigepflicht](/ratgeber/aerztliche-schweigepflicht-und-ki).",
    "Dieser Ratgeber zeigt den Weg, der beides verbindet: Befunde pseudonymisieren, den Entwurf von der KI schreiben lassen, Namen wieder einsetzen. Dazu der Aufbau eines Arztbriefs, Textbausteine und Formulierungshilfen für jeden Abschnitt und ein **Beispiel-Arztbrief als Vorlage** – als Word und PDF, frei verwendbar, mit erfundenen Daten.",
  ],
  sections: [
    {
      id: "kurzantwort",
      heading: "Die Kurzantwort",
      blocks: [
        {
          type: "callout",
          title: "Arztbrief mit KI in vier Schritten",
          text: "1. Befunde in custix ablegen – custix ersetzt Namen, Daten, Nummern, Adressen und Behandler durch Platzhalter. 2. Den pseudonymisierten Text mit einem klaren Auftrag an die KI Ihrer Wahl geben. 3. Den Entwurf fachlich prüfen und korrigieren. 4. Den Entwurf in custix einfügen – die Platzhalter werden lokal wieder durch die echten Angaben ersetzt.",
        },
      ],
    },
    {
      id: "warum",
      heading: "Warum der Befund nicht einfach in ChatGPT darf",
      blocks: [
        {
          type: "p",
          text: "Alles, was Sie in einen KI-Dienst eingeben, verlässt Ihre Praxis und wird auf fremden Servern verarbeitet. Bei Patientendaten ist das ein Offenbaren gegenüber einem Dritten – und damit ein Fall für die Schweigepflicht (§ 54 ÄrzteG in Österreich, § 203 StGB in Deutschland) und für Art. 9 DSGVO, der Gesundheitsdaten besonders schützt. Eine Einwilligung der Patientin für jeden Arztbrief einzuholen, ist im Alltag nicht praktikabel.",
        },
        {
          type: "p",
          text: "Der Ausweg: Die KI braucht die Person gar nicht. Für einen guten Entwurf genügen Diagnosen, Befunde, Verlauf und Empfehlungen. Namen, Geburtsdatum, Versicherungsnummer, Adresse und Behandler können durch Platzhalter ersetzt werden – **pseudonymisiert**, mit der Zuordnung bei Ihnen. Was das rechtlich bedeutet, erklärt der Ratgeber [Pseudonymisierung vs. Anonymisierung](/ratgeber/pseudonymisierung-vs-anonymisierung).",
        },
      ],
    },
    {
      id: "ablauf",
      heading: "Der Ablauf mit custix: vom Befund zum Arztbrief",
      blocks: [
        {
          type: "ol",
          items: [
            "**Befunde ablegen.** Öffnen Sie custix im Browser und legen Sie die Befunde des Aufenthalts ab – ein Dokument oder mehrere auf einmal, PDF, Word oder Scan. custix liest sie nacheinander ein und erkennt Namen, Geburtsdaten, Versicherungs- und Aktennummern, Adressen, Behandler und Einrichtungen.",
            "**Prüfen.** In der Prüfansicht sehen Sie, was ersetzt wurde. Markieren Sie Stellen nach, die custix nicht erkennen kann – eine seltene Diagnose, ein ungewöhnlicher Verlauf, ein Hinweis auf den Arbeitgeber.",
            "**Exportieren.** Die pseudonymisierten Fassungen laden Sie einzeln oder als ZIP herunter. Statt „Maria Huber, geb. 12.03.1968“ steht dort „[PERSON_1], geb. [DATUM_1]“; Diagnosen, Werte und Verlauf bleiben vollständig.",
            "**Entwurf von der KI.** Geben Sie den pseudonymisierten Text mit einem klaren Auftrag an ChatGPT, Claude, Gemini oder ein anderes Werkzeug (Vorlage unten). Die KI sieht nur Platzhalter.",
            "**Namen zurück.** Den Entwurf kopieren Sie in custix; die Platzhalter werden lokal wieder durch die echten Angaben ersetzt. Dann folgt das Wichtigste: die fachliche Prüfung durch Sie.",
          ],
        },
        {
          type: "h3",
          text: "Prompt-Vorlage für den Arztbrief",
        },
        {
          type: "callout",
          title: "Auftrag an die KI (mit Platzhaltern, so wie custix sie setzt)",
          text: "„Erstelle aus den folgenden pseudonymisierten Befunden den Entwurf eines Arztbriefs an die zuweisende Ärztin. Aufbau: Diagnosen (nach Relevanz), Anamnese, Befunde bei Aufnahme, Therapie und Verlauf, Epikrise, Medikation bei Entlassung, Procedere und Empfehlungen. Sachlich, in der dritten Person, ohne Wertungen. Behalte alle Platzhalter wie [PERSON_1] oder [DATUM_2] unverändert bei und erfinde keine Werte, die nicht in den Befunden stehen. Kennzeichne Stellen, an denen Angaben fehlen, mit [ERGÄNZEN].“ Danach die Befunde einfügen.",
        },
        {
          type: "p",
          text: "Zwei Regeln haben sich bewährt: Verlangen Sie ausdrücklich, dass Platzhalter unverändert bleiben – sonst „glättet“ die KI sie manchmal weg. Und verbieten Sie das Erfinden von Werten; wo etwas fehlt, soll die KI es markieren, nicht raten.",
        },
      ],
    },
    {
      id: "aufbau",
      heading: "Aufbau eines Arztbriefs",
      blocks: [
        {
          type: "p",
          text: "Der Aufbau ist zwischen Häusern und Fächern ähnlich, die Reihenfolge variiert. Entscheidend ist, dass die Leserin in dreißig Sekunden findet, was sie braucht: Diagnosen, Medikation, offene Punkte.",
        },
        {
          type: "table",
          head: ["Abschnitt", "Inhalt", "Umfang"],
          rows: [
            ["Briefkopf und Empfänger", "Einrichtung, Abteilung, Kontakt; zuweisende oder weiterbehandelnde Ärztin", "je 3–4 Zeilen"],
            ["Betreff", "Patient, Geburtsdatum, Versicherungsnummer, Aufenthaltszeitraum", "1–2 Zeilen"],
            ["Diagnosen", "Hauptdiagnose zuerst, dann Nebendiagnosen; Relevanz vor Vollständigkeit", "Liste"],
            ["Anamnese", "Anlass der Vorstellung, Beschwerden mit Dauer, Vorerkrankungen, Medikation, Allergien, Risikofaktoren", "3–6 Sätze"],
            ["Befunde", "Klinischer Befund, Labor, Bildgebung, Funktionsdiagnostik; nur das, was die Diagnose trägt oder den Verlauf erklärt", "3–8 Sätze"],
            ["Therapie und Verlauf", "Was wurde getan, wie hat die Patientin reagiert, Komplikationen", "3–6 Sätze"],
            ["Epikrise", "Zusammenfassende Beurteilung: Was war, warum, was folgt daraus", "3–6 Sätze"],
            ["Medikation bei Entlassung", "Vollständig mit Dosierung, Änderungen gegenüber vorher kennzeichnen", "Liste"],
            ["Procedere und Empfehlungen", "Kontrollen mit Zeitangabe, offene Befunde, Warnzeichen für Wiedervorstellung", "Liste"],
            ["Grußformel", "Kollegial, mit Namen und Funktion der Unterzeichnenden", "2–3 Zeilen"],
          ],
        },
      ],
    },
    {
      id: "textbausteine",
      heading: "Textbausteine und Formulierungshilfen",
      blocks: [
        {
          type: "p",
          text: "Textbausteine sparen Zeit und machen Briefe lesbar, weil die Struktur vertraut ist. Sie ersetzen nicht den Inhalt: Jeder Satz muss zum konkreten Fall passen. Die folgenden Formulierungen sind bewusst neutral gehalten und lassen sich als Vorgabe an die KI mitgeben.",
        },
        { type: "h3", text: "Einleitung" },
        {
          type: "ul",
          items: [
            "„Wir berichten über die oben genannte Patientin, die sich vom … bis … in unserer stationären Behandlung befand.“",
            "„Herr … stellte sich am … auf Zuweisung von … in unserer Ambulanz vor.“",
            "„Vielen Dank für die Zuweisung von …, den wir am … erstmals gesehen haben.“",
          ],
        },
        { type: "h3", text: "Anamnese" },
        {
          type: "ul",
          items: [
            "„Die Patientin berichtete über seit … bestehende …, begleitet von ….“",
            "„An Vorerkrankungen sind … bekannt. Die Dauermedikation umfasst ….“",
            "„Allergien: keine bekannt. Nikotin: …. Alkohol: …. Familienanamnese: ….“",
          ],
        },
        { type: "h3", text: "Befunde" },
        {
          type: "ul",
          items: [
            "„Bei Aufnahme zeigte sich ein … Allgemeinzustand; Blutdruck …, Herzfrequenz …, Temperatur ….“",
            "„Laborchemisch fanden sich … bei ansonsten unauffälligen Routineparametern.“",
            "„In der … vom … zeigte sich …; kein Hinweis auf ….“",
          ],
        },
        { type: "h3", text: "Therapie und Verlauf" },
        {
          type: "ul",
          items: [
            "„Wir begannen eine … Therapie mit …; hierunter kam es zu einer raschen Besserung von ….“",
            "„Der weitere Verlauf gestaltete sich komplikationslos.“",
            "„Am … konnte die Patientin in gutem Allgemeinzustand in Ihre weitere Betreuung entlassen werden.“",
          ],
        },
        { type: "h3", text: "Epikrise" },
        {
          type: "ul",
          items: [
            "„Zusammenfassend bestand bei … eine …, die wir auf … zurückführen.“",
            "„Differenzialdiagnostisch wurde … erwogen und durch … ausgeschlossen.“",
            "„Die Symptomatik ist unter der eingeleiteten Therapie rückläufig; eine … ist derzeit nicht erforderlich.“",
          ],
        },
        { type: "h3", text: "Procedere und Empfehlungen" },
        {
          type: "ul",
          items: [
            "„Wir empfehlen eine klinische Kontrolle in … Wochen sowie eine Kontrolle von … am ….“",
            "„Bei … bitten wir um umgehende Wiedervorstellung.“",
            "„Die Patientin wurde über … aufgeklärt und ist damit einverstanden.“",
          ],
        },
        {
          type: "p",
          text: "Ein Tipp für den KI-Entwurf: Geben Sie zwei oder drei dieser Bausteine als Stilvorgabe mit. Der Entwurf klingt dann so, wie Ihre Briefe klingen, und nicht wie ein Lehrbuch.",
        },
      ],
    },
    {
      id: "epikrise",
      heading: "Epikrise schreiben: die fünf Fragen",
      blocks: [
        {
          type: "p",
          text: "Die Epikrise ist der Teil, den Kolleginnen wirklich lesen. Sie ist keine Wiederholung der Befunde, sondern deren Deutung. Fünf Fragen genügen als Gerüst:",
        },
        {
          type: "ol",
          items: [
            "**Was war das Problem?** Leitsymptom und Anlass in einem Satz.",
            "**Was haben wir gefunden?** Die Befunde, die die Diagnose tragen – nicht alle.",
            "**Wie erklären wir es?** Diagnose und, wenn relevant, ausgeschlossene Alternativen.",
            "**Was haben wir getan und wie hat es gewirkt?** Therapie und Ansprechen.",
            "**Was folgt daraus?** Offene Punkte, Kontrollen, Änderungen der Medikation.",
          ],
        },
        {
          type: "p",
          text: "Genau diese fünf Fragen können Sie der KI als Struktur vorgeben. Der Entwurf wird dadurch kürzer und brauchbarer als eine freie Zusammenfassung.",
        },
      ],
    },
    {
      id: "beispiel",
      heading: "Beispiel-Arztbrief als Vorlage",
      blocks: [
        {
          type: "p",
          text: "Ein vollständiger Entlassungsbrief aus der Inneren Medizin mit allen Abschnitten. Alle Personen, Einrichtungen, Daten und Befunde sind erfunden; der Brief ist eine Vorlage für Aufbau und Formulierungen, kein Behandlungsstandard. Sie dürfen ihn frei verwenden und anpassen.",
        },
        { type: "letter", variant: "template" },
        {
          type: "downloads",
          items: [
            { label: "Beispiel-Arztbrief (Vorlage)", href: `${DL}/beispiel-arztbrief-vorlage.docx`, format: "Word" },
            { label: "Beispiel-Arztbrief (Vorlage)", href: `${DL}/beispiel-arztbrief-vorlage.pdf`, format: "PDF" },
          ],
        },
      ],
    },
    {
      id: "platzhalter",
      heading: "So sieht derselbe Brief mit Platzhaltern aus",
      blocks: [
        {
          type: "p",
          text: "Das ist die Fassung, die an die KI geht: Namen, Geburtsdatum, Versicherungsnummer, Adressen, Behandler und Einrichtung sind durch Platzhalter im Schema von custix ersetzt, gleiche Angabe gleicher Platzhalter. Diagnosen, Werte, Verlauf und Empfehlungen sind unverändert – die KI hat alles, was sie für den Entwurf braucht, und nichts, was die Person verrät.",
        },
        { type: "letter", variant: "placeholders" },
        {
          type: "downloads",
          items: [
            { label: "Beispiel-Arztbrief (mit Platzhaltern)", href: `${DL}/beispiel-arztbrief-platzhalter.docx`, format: "Word" },
            { label: "Beispiel-Arztbrief (mit Platzhaltern)", href: `${DL}/beispiel-arztbrief-platzhalter.pdf`, format: "PDF" },
          ],
        },
        {
          type: "p",
          text: "Beachten Sie die Zeile „Musterstadt, [DATUM_1]“ im Briefkopf: Der Ortsname bleibt stehen, weil er allein keine Person identifiziert. Kombiniert mit einer seltenen Diagnose könnte er es aber. Genau solche Stellen prüfen Sie in der Prüfansicht und ersetzen sie bei Bedarf zusätzlich.",
        },
      ],
    },
    {
      id: "checkliste",
      heading: "Checkliste vor dem Versand",
      blocks: [
        {
          type: "ol",
          items: [
            "**Alle Platzhalter zurückgesetzt?** custix ersetzt sie automatisch; prüfen Sie trotzdem, ob im Entwurf keiner mehr steht und die KI keinen verändert hat.",
            "**Stimmen die Werte?** Jede Zahl im Entwurf gegen den Befund prüfen. KI-Werkzeuge runden, verwechseln Einheiten oder ergänzen Plausibles.",
            "**Ist etwas erfunden?** Alles, was nicht in den Befunden stand, streichen oder belegen – insbesondere Zeitangaben und Medikamente.",
            "**Medikation vollständig?** Mit Dosierung, Änderungen gekennzeichnet, Enddaten für zeitlich begrenzte Therapien.",
            "**Empfehlungen konkret?** Wer macht was bis wann; Warnzeichen für die Wiedervorstellung.",
            "**Freigabe.** Der Brief geht erst mit der Unterschrift der verantwortlichen Ärztin oder des verantwortlichen Arztes hinaus – die KI ist Entwurf, nicht Autor.",
          ],
        },
      ],
    },
    {
      id: "ausbildung",
      heading: "Für Ausbildung und Fachsprachprüfung",
      blocks: [
        {
          type: "p",
          text: "Wer den Arztbrief lernt – im klinischen Jahr, in der Ausbildung oder für die Fachsprachprüfung – kann KI als Trainingspartner nutzen: eigenen Entwurf schreiben, dann die KI um Korrektur von Struktur und Fachsprache bitten. Auch dafür gilt: nur mit erfundenen oder pseudonymisierten Fällen. Der Beispiel-Arztbrief oben eignet sich als Übungsmaterial; verändern Sie Diagnose und Verlauf und schreiben Sie die Epikrise neu.",
        },
      ],
    },
    {
      id: "custix",
      heading: "Was custix dabei übernimmt",
      blocks: [
        {
          type: "p",
          text: "custix läuft im Browser, ohne Installation. Es erkennt und ersetzt identifizierende Angaben in Befunden, Arztbriefen und Scans, verarbeitet mehrere Dateien nacheinander und liefert sie als ZIP. Die Zuordnung zwischen Platzhaltern und echten Angaben bleibt auf Ihrem Gerät; an die KI geht nur der Text mit Platzhaltern, und die Antwort setzen Sie mit custix wieder zurück. Den fachlichen Blick auf den Brief ersetzt es nicht – das bleibt Ihre Aufgabe.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "Darf ich einen Arztbrief mit ChatGPT schreiben?",
      a: "Den Entwurf ja – wenn keine Patientendaten übermittelt werden. Pseudonymisieren Sie den Befund vorher (Namen, Geburtsdatum, Nummern, Adressen, Behandler durch Platzhalter ersetzt) und prüfen Sie den Entwurf fachlich. Mit Klartext-Patientendaten wäre es ein Verstoß gegen die Schweigepflicht, siehe Ratgeber Ärztliche Schweigepflicht und KI.",
    },
    {
      q: "Gibt es eine Arztbrief-Vorlage für Word?",
      a: "Ja, oben zum Herunterladen: der Beispiel-Arztbrief als Word- und PDF-Datei, mit allen Abschnitten und erfundenen Daten. Sie dürfen ihn frei verwenden und an Ihr Haus anpassen.",
    },
    {
      q: "Was gehört in die Epikrise?",
      a: "Die zusammenfassende Beurteilung: Leitsymptom, tragende Befunde, Diagnose mit Begründung, Therapie und Ansprechen, offene Punkte. Keine Wiederholung aller Befunde, sondern deren Deutung in drei bis sechs Sätzen.",
    },
    {
      q: "Wie lange darf ein Arztbrief sein?",
      a: "So kurz wie möglich, so vollständig wie nötig. Eine bis zwei Seiten reichen für die meisten stationären Aufenthalte. Was die Leserin braucht, steht vorne: Diagnosen, Medikation, Empfehlungen.",
    },
    {
      q: "Kann die KI im Arztbrief Fehler machen?",
      a: "Ja. Typisch sind erfundene oder gerundete Werte, vertauschte Einheiten, plausibel klingende Ergänzungen und stillschweigend veränderte Platzhalter. Deshalb: Werte gegen den Befund prüfen, nichts Unbelegtes übernehmen, und der Brief geht erst mit ärztlicher Freigabe hinaus.",
    },
    {
      q: "Wie schreibe ich einen Arztbrief für die Fachsprachprüfung?",
      a: "Nach demselben Aufbau wie im Alltag: Diagnosen, Anamnese, Befunde, Therapie und Verlauf, Epikrise, Empfehlungen – in klarer Fachsprache, dritte Person, ohne Wertungen. Üben Sie mit dem Beispiel-Arztbrief oben: Diagnose und Verlauf verändern, Epikrise neu schreiben, dann von einer KI Struktur und Sprache korrigieren lassen – nur mit erfundenen Fällen.",
    },
  ],
};

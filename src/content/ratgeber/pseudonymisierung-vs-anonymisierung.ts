import type { Guide } from "./types";

/**
 * Ratgeber 7.3 (mrgoofman/custix-ai#6, #8). Kern-Keywords laut
 * docs/marketing/seo-keywords-aerzte.md, Abschnitt 3: „pseudonymisierung vs
 * anonymisierung", „unterschied anonymisierung und pseudonymisierung“,
 * „anonymisierung und pseudonymisierung“, „pseudonymisierung beispiel“,
 * langfristig „pseudonymisierung“.
 *
 * Leitplanken: keine absolute DSGVO-Konformitätsaussage, keine Rechtsberatung
 * im Einzelfall, custix ehrlich als Pseudonymisierung eingeordnet,
 * KI-Anbieter neutral benannt.
 *
 * Rechtliche Aussagen (Art. 4 Nr. 5, Erwägungsgrund 26, Art. 25/32/89, Art. 9,
 * EuGH C‑413/23 P vom 04.09.2025) sind allgemein gehalten; eine Gegenprüfung
 * durch Laurenz vor dem Deploy ist sinnvoll, auch wenn die Spec sie nur für
 * den Schweigepflicht-Ratgeber verlangt.
 */
export const pseudonymisierungVsAnonymisierung: Guide = {
  routeKey: "/ratgeber/pseudonymisierung-vs-anonymisierung",
  title: "Pseudonymisierung vs. Anonymisierung: der Unterschied einfach erklärt",
  metaTitle: "Pseudonymisierung vs. Anonymisierung: der Unterschied | custix",
  description:
    "Unterschied Anonymisierung und Pseudonymisierung einfach erklärt: Definitionen nach DSGVO, Beispiele aus Praxis und Kanzlei – und was custix davon tut.",
  teaser:
    "Beide Begriffe werden oft gleichgesetzt, rechtlich liegen Welten dazwischen. Mit Beispielen aus Arztpraxis und Kanzlei – und einer ehrlichen Antwort, was custix macht.",
  published: "2026-09-27",
  updated: "2026-09-27",
  readingMinutes: 8,
  intro: [
    "Wer Befunde, Schriftsätze oder Personalakten an ein KI-Werkzeug wie ChatGPT, Claude oder Gemini gibt, stolpert früh über zwei Wörter: **anonymisieren** und **pseudonymisieren**. Im Alltag werden sie synonym gebraucht. Für den Datenschutz ist der Unterschied aber entscheidend: Pseudonymisierte Daten sind weiterhin personenbezogen, anonymisierte Daten fallen aus der DSGVO heraus.",
    "Dieser Ratgeber erklärt beide Begriffe mit den Definitionen aus der DSGVO, zeigt den Unterschied an konkreten Beispielen aus Praxis und Kanzlei und sagt offen, in welche Kategorie custix gehört.",
  ],
  sections: [
    {
      id: "kurzantwort",
      heading: "Die Kurzantwort",
      blocks: [
        {
          type: "callout",
          title: "Unterschied in einem Satz",
          text: "**Pseudonymisierung** ersetzt identifizierende Merkmale durch Platzhalter, die Zuordnung bleibt getrennt aufbewahrt bestehen. **Anonymisierung** entfernt den Personenbezug so, dass sich die Person auch mit Zusatzwissen nicht mehr mit vertretbarem Aufwand erkennen lässt.",
        },
        {
          type: "p",
          text: "Der Unterschied liegt also nicht darin, **wie viel** entfernt wird, sondern ob es einen Rückweg gibt. Gibt es irgendwo eine Liste, einen Schlüssel oder ein Zusatzwissen, mit dem sich die Person wieder zuordnen lässt, ist es Pseudonymisierung.",
        },
      ],
    },
    {
      id: "pseudonymisierung",
      heading: "Was ist Pseudonymisierung?",
      blocks: [
        {
          type: "p",
          text: "Die DSGVO definiert den Begriff in **Art. 4 Nr. 5**: Personenbezogene Daten werden so verarbeitet, dass sie ohne Hinzuziehung zusätzlicher Informationen keiner bestimmten Person mehr zugeordnet werden können. Diese zusätzlichen Informationen müssen gesondert aufbewahrt und durch technische und organisatorische Maßnahmen geschützt sein.",
        },
        {
          type: "example",
          title: "Beispiel: Befund vor und nach der Pseudonymisierung",
          before:
            "Patientin Maria Huber, geb. 12.03.1968, SV-Nr. 1234 120368, stellt sich mit seit drei Wochen bestehendem Husten vor. Überweisung durch Dr. Peter Gruber, Graz.",
          after:
            "Patientin [Person 1], geb. [Datum 1], SV-Nr. [Nummer 1], stellt sich mit seit drei Wochen bestehendem Husten vor. Überweisung durch [Person 2], [Ort 1].",
          note: "Der medizinische Inhalt bleibt vollständig erhalten. Die Zuordnungsliste (Person 1 = Maria Huber) liegt getrennt vom Text. Wer sie hat, kann den Befund wieder zuordnen – deshalb ist das Pseudonymisierung, nicht Anonymisierung. Alle Namen sind erfunden.",
        },
        {
          type: "p",
          text: "Die Folge: Für die Stelle, die den Schlüssel hat, bleiben pseudonymisierte Daten **personenbezogene Daten**. Erwägungsgrund 26 der DSGVO sagt das ausdrücklich. Die Datenschutzregeln gelten weiter, etwa die Pflicht zu einer Rechtsgrundlage und zu Verträgen mit Dienstleistern. Wie es für einen Empfänger ohne Schlüssel aussieht, steht weiter unten im Abschnitt zu KI-Diensten.",
        },
        {
          type: "p",
          text: "Trotzdem ist Pseudonymisierung kein Feigenblatt. Die DSGVO nennt sie als Schutzmaßnahme in **Art. 25** (Datenschutz durch Technikgestaltung) und **Art. 32** (Sicherheit der Verarbeitung) und honoriert sie in **Art. 89** für Forschung und Statistik. Wer pseudonymisiert, senkt das Risiko für die Betroffenen erheblich: Ein Empfänger ohne Schlüssel sieht keine Namen, keine Adressen, keine Versicherungsnummern.",
        },
      ],
    },
    {
      id: "anonymisierung",
      heading: "Was ist Anonymisierung?",
      blocks: [
        {
          type: "p",
          text: "Für Anonymisierung gibt es in der DSGVO keine eigene Definition. Erwägungsgrund 26 beschreibt aber, wann Daten anonym sind: wenn sie sich nicht auf eine identifizierte oder identifizierbare Person beziehen. Maßstab dafür sind alle Mittel, die „nach allgemeinem Ermessen wahrscheinlich“ eingesetzt werden, um die Person zu bestimmen – unter Berücksichtigung von Kosten, Zeitaufwand und verfügbarer Technik.",
        },
        {
          type: "example",
          title: "Beispiel: anonyme Auswertung",
          before:
            "Drei Befunde von Maria Huber, Josef Bauer und Anna Steiner mit Diagnosen, Geburtsdaten und Behandlern.",
          after:
            "„Von 120 Patientinnen und Patienten zwischen 50 und 60 Jahren erhielten 37 % im letzten Quartal eine Lungenfunktionsprüfung.“",
          note: "Aus der Zahl lässt sich kein einzelner Fall mehr herauslesen. Es gibt keine Liste, die zurückführt. Das ist anonym – solange die Gruppe groß genug ist.",
        },
        {
          type: "p",
          text: "Die Folge: Auf anonyme Daten ist die DSGVO **nicht anwendbar**. Genau deshalb ist die Messlatte hoch. Anonymität ist keine Eigenschaft eines einzelnen Dokuments, sondern hängt davon ab, welche anderen Informationen es auf der Welt gibt. Ein Befund ohne Namen, aber mit einer seltenen Diagnose, dem Datum und der Klinik kann für Eingeweihte eindeutig sein. Es gibt gut dokumentierte Fälle, in denen scheinbar anonyme Datensätze über Zusatzwissen wieder Personen zugeordnet wurden.",
        },
      ],
    },
    {
      id: "unterschied",
      heading: "Anonymisierung und Pseudonymisierung im Vergleich",
      blocks: [
        {
          type: "table",
          head: ["", "Pseudonymisierung", "Anonymisierung"],
          rows: [
            ["Personenbezug", "bleibt bestehen", "entfällt"],
            [
              "Zuordnung zur Person",
              "möglich mit gesondert aufbewahrtem Schlüssel",
              "für niemanden mit vertretbarem Aufwand möglich",
            ],
            ["Umkehrbar", "ja, mit dem Schlüssel", "nein"],
            [
              "DSGVO",
              "gilt weiter, Pseudonymisierung ist eine Schutzmaßnahme",
              "gilt nicht",
            ],
            [
              "Typischer Einsatz",
              "Weitergabe an Dienstleister oder KI, Forschung mit Rückweg, Fallbesprechung",
              "Statistik, Veröffentlichung, Schulungsmaterial",
            ],
            [
              "Was übrig bleibt",
              "der vollständige Inhalt mit Platzhaltern",
              "meist nur Zusammenfassungen oder vergröberte Angaben",
            ],
          ],
        },
        {
          type: "p",
          text: "Der praktische Unterschied: Pseudonymisierung erhält den Einzelfall und damit den Nutzen des Dokuments – man kann weiter mit dem Befund, dem Schriftsatz oder der Akte arbeiten. Anonymisierung opfert den Einzelfall, um jeden Rückweg auszuschließen.",
        },
      ],
    },
    {
      id: "beispiele",
      heading: "Beispiele aus Praxis, Kanzlei und Personalabteilung",
      blocks: [
        {
          type: "ul",
          items: [
            "**[Arztpraxis](/fuer-gesundheitswesen):** Ein Befund soll von einer KI in einen Entwurf für den Arztbrief übersetzt werden. Name, Geburtsdatum, Sozialversicherungs- oder Krankenversichertennummer, Adresse, Behandler und Klinik werden durch Platzhalter ersetzt, Diagnosen und Laborwerte bleiben. Die Zuordnung bleibt in der Praxis. **Pseudonymisierung.**",
            "**[Kanzlei](/fuer-anwaelte):** Ein Schriftsatz soll von einer KI auf Argumentationslücken geprüft werden. Mandant wird zu [Person 1], die Gegenseite zu [Person 2], das Aktenzeichen zu [Aktenzeichen 1]. Der Sachverhalt bleibt lesbar. **Pseudonymisierung.**",
            "**[Personalabteilung](/fuer-hr):** Für den Jahresbericht wird die durchschnittliche Krankenstandsdauer pro Abteilung berechnet, nur für Abteilungen, in denen sich aus dem Durchschnitt niemand herauslesen lässt. Kein Rückweg zum Einzelnen. **Anonymisierung.**",
            "**Grauzone:** Ein einzelner Befund ohne Namen, aber mit seltener Diagnose, exaktem Datum und Klinik geht an eine KI. Für Außenstehende wirkt er anonym, für Kolleginnen und Kollegen in der Klinik ist die Person erkennbar. Rechtlich ist das **nicht anonym**. Solche Stellen sollte man zusätzlich entschärfen: Datum vergröbern, Klinik weglassen, seltene Merkmale prüfen.",
          ],
        },
      ],
    },
    {
      id: "ki",
      heading: "Warum der Unterschied bei KI-Diensten entscheidet",
      blocks: [
        {
          type: "p",
          text: "Wer einen Text in ChatGPT, Claude, Gemini oder ein anderes KI-Werkzeug einfügt, übermittelt ihn an einen Dritten. Enthält der Text personenbezogene Daten, braucht das eine Rechtsgrundlage und in der Regel einen Vertrag zur Auftragsverarbeitung. Bei Gesundheitsdaten kommt **Art. 9 DSGVO** hinzu, bei Ärztinnen, Anwälten und anderen Berufsgeheimnisträgern zusätzlich die berufliche Schweigepflicht.",
        },
        {
          type: "p",
          text: "Pseudonymisierung löst dieses Problem nicht vollständig, aber sie verändert es grundlegend. Der KI-Anbieter erhält keine Namen, Adressen oder Nummern, sondern Platzhalter. Ob solche Daten auch für einen Empfänger personenbezogen sind, der den Schlüssel weder hat noch mit vertretbarem Aufwand bekommen kann, hat der Europäische Gerichtshof im September 2025 geklärt (Rs. C‑413/23 P): Pseudonymisierte Daten sind nicht in jedem Fall und für jede Person personenbezogen; es kommt auf die Umstände des Einzelfalls an. Für die Stelle mit dem Schlüssel bleiben sie es. Ein Empfänger, den die Pseudonymisierung tatsächlich an der Zuordnung hindert, muss sie nicht als personenbezogen behandeln.",
        },
        {
          type: "p",
          text: "Ein Freibrief ist das nicht. Ob ein KI-Dienst, der Texte speichert und mit anderen Daten verknüpfen kann, wirklich an der Zuordnung gehindert ist, muss man für den konkreten Anbieter und Vertrag prüfen – und die eigenen Pflichten als Stelle, die die Daten erhebt und weitergibt, bleiben bestehen. Sicher ist: Das Risiko für die Betroffenen sinkt drastisch, und man kann nachweisen, eine anerkannte Schutzmaßnahme ergriffen zu haben.",
        },
        {
          type: "callout",
          title: "Faustregel",
          text: "Brauchen Sie die Antwort der KI später wieder für den konkreten Fall, kommen Sie um Pseudonymisierung nicht herum – eine anonymisierte Anfrage ließe sich nicht mehr zuordnen. Geben Sie dafür so wenig wie möglich weiter: Namen, Daten und Nummern raus, und prüfen Sie, was der Text danach noch verrät.",
        },
      ],
    },
    {
      id: "custix",
      heading: "Was custix macht: pseudonymisieren, mit dem Schlüssel bei Ihnen",
      blocks: [
        {
          type: "p",
          text: "Auf unserer Website steht oft „anonymisieren“, weil das der Begriff ist, nach dem Menschen suchen und den sie im Alltag verwenden. Technisch und rechtlich präzise macht custix Folgendes: Es **pseudonymisiert**.",
        },
        {
          type: "ul",
          items: [
            "custix erkennt Namen, Adressen, Geburtsdaten, Aktenzeichen, Steuernummern und weitere identifizierende Angaben und ersetzt sie durch Platzhalter wie [Person 1] oder [Datum 1].",
            "Die Zuordnungstabelle zwischen Platzhaltern und Originaldaten entsteht und bleibt **auf Ihrem Gerät** – in der Desktop-App auf Ihrem Rechner, in der Web-App im lokalen Speicher Ihres Browsers. Sie wird nicht an uns und nicht an den KI-Anbieter übertragen (siehe [Datenschutzerklärung](/datenschutz)).",
            "An die KI Ihrer Wahl geht nur der Text mit Platzhaltern. Die Antwort setzen Sie mit custix lokal wieder in den Klartext zurück.",
          ],
        },
        {
          type: "p",
          text: "Für den KI-Anbieter ist der Text damit ohne Schlüssel. Für Sie bleibt er zuordenbar, und genau das wollen Sie ja: Der Arztbrief soll am Ende wieder den richtigen Namen tragen. Deshalb ist custix Pseudonymisierung – und wir nennen es auch so, wo es um die rechtliche Einordnung geht.",
        },
        {
          type: "p",
          text: "Was custix nicht kann: erkennen, ob der übrige Inhalt eine Person verrät. Eine seltene Diagnose, ein einzigartiger Sachverhalt oder eine Kombination aus Ort und Zeit lassen sich nicht automatisch als identifizierend einstufen. Deshalb zeigt custix vor dem Export, was ersetzt wurde, und Sie können weitere Stellen selbst markieren; Datumsangaben werden standardmäßig mit ersetzt.",
        },
      ],
    },
    {
      id: "checkliste",
      heading: "Checkliste: pseudonymisieren oder anonymisieren?",
      blocks: [
        {
          type: "ol",
          items: [
            "**Brauche ich den Rückweg?** Soll die Antwort oder Auswertung wieder einem konkreten Fall zugeordnet werden, ist Pseudonymisierung der richtige Weg.",
            "**Geht der Text dauerhaft aus dem Haus?** Bei Veröffentlichung, Schulungsunterlagen oder Statistik sollte man Anonymisierung anstreben: aggregieren, vergröbern, Einzelfälle weglassen.",
            "**Sind besondere Kategorien betroffen?** Gesundheitsdaten, Religion, Gewerkschaftszugehörigkeit oder Strafsachen verlangen einen strengeren Maßstab – und Berufsgeheimnisträger müssen zusätzlich ihre Schweigepflicht prüfen.",
            "**Was bleibt nach dem Ersetzen identifizierend?** Seltene Merkmale, exakte Daten, Orte und Kombinationen daraus einzeln prüfen und gegebenenfalls zusätzlich entschärfen.",
            "**Wo liegt der Schlüssel?** Die Zuordnung getrennt vom Text aufbewahren und schützen. Liegt sie beim selben Empfänger wie der Text, ist nichts gewonnen.",
          ],
        },
        {
          type: "p",
          text: "Diese Punkte ersetzen keine Prüfung des Einzelfalls durch Ihre Datenschutzbeauftragte oder Ihren Rechtsbeistand. Sie helfen aber, die richtige Frage zu stellen, bevor ein Dokument den Rechner verlässt.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "Sind pseudonymisierte Daten personenbezogene Daten?",
      a: "Für die Stelle, die den Schlüssel hat: ja. Solange sich die Daten wieder einer Person zuordnen lassen, bleiben sie personenbezogen (Erwägungsgrund 26 DSGVO), und die DSGVO gilt weiter. Für einen Empfänger, den die Pseudonymisierung tatsächlich an der Zuordnung hindert, kann es nach dem EuGH-Urteil vom September 2025 (Rs. C‑413/23 P) anders sein – das hängt vom Einzelfall ab.",
    },
    {
      q: "Ist Pseudonymisierung nach der DSGVO Pflicht?",
      a: "Nicht generell. Die DSGVO nennt Pseudonymisierung als geeignete Maßnahme für Datenschutz durch Technikgestaltung (Art. 25) und für die Sicherheit der Verarbeitung (Art. 32). Ob sie im konkreten Fall erforderlich ist, hängt vom Risiko der Verarbeitung ab.",
    },
    {
      q: "Reicht es, den Namen zu schwärzen?",
      a: "Meist nicht. Geburtsdatum, Adresse, Aktenzeichen, Versicherungsnummer oder eine Kombination seltener Merkmale können eine Person genauso eindeutig machen wie der Name. Pseudonymisierung muss alle identifizierenden Angaben erfassen.",
    },
    {
      q: "Was ist der Unterschied zwischen Pseudonymisierung und Verschlüsselung?",
      a: "Verschlüsselung macht den gesamten Inhalt unlesbar und muss zum Arbeiten wieder aufgehoben werden. Pseudonymisierung ersetzt nur die identifizierenden Angaben; der Inhalt bleibt lesbar und nutzbar, etwa für eine KI.",
    },
    {
      q: "Anonymisiert oder pseudonymisiert custix?",
      a: "custix pseudonymisiert. Namen, Adressen, Daten und Nummern werden durch Platzhalter ersetzt; die Zuordnung bleibt ausschließlich auf Ihrem Gerät. An die KI geht nur der Text mit Platzhaltern, die Antwort wird lokal wieder zugeordnet.",
    },
    {
      q: "Darf ich pseudonymisierte Befunde oder Akten an ChatGPT und Co. geben?",
      a: "Das hängt von Rechtsgrundlage, Verträgen und – bei Ärztinnen, Anwälten und anderen Berufsgeheimnisträgern – von der Schweigepflicht ab. Pseudonymisierung senkt das Risiko erheblich und ist eine anerkannte Schutzmaßnahme, ersetzt diese Prüfung aber nicht. Im Zweifel fragen Sie Ihre Datenschutzbeauftragte oder Ihren Rechtsbeistand.",
    },
  ],
};

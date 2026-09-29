import type { Guide } from "./types";

/**
 * Ratgeber 7.2 (mrgoofman/custix-ai#6, #10). Kern-Keywords laut
 * docs/marketing/seo-keywords-aerzte.md, Abschnitt 2: „ärztliche
 * schweigepflicht" (720/Monat), „schweigepflicht arzt“, „203 stgb
 * schweigepflicht", „ärztliche schweigepflicht ausnahmen“, „dsgvo
 * schweigepflicht".
 *
 * Rechtstext: `hidden: true`, bis Laurenz (Jurist im Team) den Text im Pull
 * Request freigegeben hat. Danach `hidden` entfernen und – wenn er
 * einverstanden ist – die Autorenzeile auf „Geprüft von Laurenz …“ stellen.
 * Leitplanken: keine Rechtsberatung im Einzelfall (Hinweis im Text und in der
 * Fußzeile jedes Ratgebers), keine Diagnose- oder Therapieaussagen,
 * KI-Anbieter neutral benannt, „pseudonymisiert“ wo es um custix geht.
 */
export const aerztlicheSchweigepflichtUndKi: Guide = {
  routeKey: "/ratgeber/aerztliche-schweigepflicht-und-ki",
  hidden: true,
  byline: "Vom custix-Team · Juristische Prüfung: ausstehend",
  title: "Ärztliche Schweigepflicht und KI: Was Sie ChatGPT & Co. geben dürfen – und was nicht",
  metaTitle: "Ärztliche Schweigepflicht und KI: Was erlaubt ist | custix",
  description:
    "Ärztliche Schweigepflicht (§ 54 ÄrzteG, § 203 StGB) und Art. 9 DSGVO bei KI-Diensten: was erlaubt ist, welche Ausnahmen gelten und wie Pseudonymisierung hilft. Für Österreich und Deutschland.",
  teaser:
    "Befund in ChatGPT kopieren, Arztbrief entwerfen lassen: praktisch, aber was sagt die Schweigepflicht dazu? Die Rechtslage in Österreich und Deutschland, die Ausnahmen – und der Weg, der ohne Patientendaten auskommt.",
  published: "2026-09-29",
  updated: "2026-09-29",
  readingMinutes: 9,
  intro: [
    "KI-Werkzeuge wie ChatGPT, Claude oder Gemini können Arztbriefe entwerfen, Befunde zusammenfassen und Differenzialdiagnosen sortieren. Der Haken: Alles, was Sie eingeben, verlässt Ihre Praxis. Für Patientendaten ist das kein technisches Detail, sondern eine Frage der **ärztlichen Schweigepflicht** – und zusätzlich des Datenschutzrechts.",
    "Dieser Ratgeber erklärt, was die Schweigepflicht in Österreich und Deutschland umfasst, welche Ausnahmen es gibt, was Art. 9 DSGVO dazu sagt und wie Sie KI nutzen können, ohne Patientendaten preiszugeben. Er informiert allgemein und ersetzt keine Rechtsberatung im Einzelfall.",
  ],
  sections: [
    {
      id: "kurzantwort",
      heading: "Die Kurzantwort",
      blocks: [
        {
          type: "callout",
          title: "In drei Sätzen",
          text: "Patientendaten in einen KI-Dienst einzugeben, ist ein **Offenbaren gegenüber einem Dritten**. Ohne Einwilligung der Patientin oder eine gesetzliche Ausnahme verletzt das die Schweigepflicht, unabhängig davon, wie sicher der Anbieter wirbt. Erlaubt bleibt, was kein Geheimnis mehr transportiert: Text, aus dem sich die Person nicht mehr erkennen lässt.",
        },
        {
          type: "p",
          text: "Deshalb lautet die praktische Antwort für den Alltag: KI ja, aber nur mit **pseudonymisierten** Dokumenten, bei denen Namen, Geburtsdaten, Versicherungsnummern, Adressen und Behandler durch Platzhalter ersetzt sind und die Zuordnung in der Praxis bleibt. Was das genau heißt und wo die Grenzen liegen, steht im Ratgeber [Pseudonymisierung vs. Anonymisierung](/ratgeber/pseudonymisierung-vs-anonymisierung).",
        },
      ],
    },
    {
      id: "umfang",
      heading: "Was die ärztliche Schweigepflicht umfasst",
      blocks: [
        {
          type: "p",
          text: "Die Schweigepflicht schützt alles, was Ihnen in Ausübung des Berufs anvertraut oder bekannt wird: Diagnosen, Befunde, Behandlungsverläufe, Lebensumstände – und schon die Tatsache, dass jemand bei Ihnen in Behandlung ist. Sie gilt gegenüber allen Dritten, auch gegenüber Angehörigen, Arbeitgebern, Versicherungen und Dienstleistern, und sie endet nicht mit dem Tod der Patientin.",
        },
        {
          type: "p",
          text: "Verpflichtet sind nicht nur Ärztinnen und Ärzte, sondern auch ihre Hilfspersonen: Ordinationsassistenz, Medizinische Fachangestellte, Auszubildende. Wer in der Praxis mit Patientendaten arbeitet, muss die Schweigepflicht kennen und einhalten. Das schließt den Umgang mit Software ein: Ein KI-Dienst, in den eine Mitarbeiterin einen Befund kopiert, ist rechtlich dasselbe Problem, wie wenn Sie es selbst tun.",
        },
      ],
    },
    {
      id: "oesterreich",
      heading: "Österreich: § 54 ÄrzteG",
      blocks: [
        {
          type: "p",
          text: "In Österreich regelt **§ 54 Ärztegesetz 1998** die Verschwiegenheitspflicht. Ärztinnen und Ärzte sowie ihre Hilfspersonen sind zur Verschwiegenheit über alle ihnen in Ausübung des Berufes anvertrauten oder bekannt gewordenen Geheimnisse verpflichtet. Die Verletzung ist gerichtlich strafbar (§ 121 StGB, Verletzung von Berufsgeheimnissen) und kann disziplinarrechtliche Folgen durch die Ärztekammer haben.",
        },
        {
          type: "p",
          text: "Ausnahmen kennt das Gesetz nur eng umgrenzt, etwa gesetzliche Melde- und Auskunftspflichten, Mitteilungen an Sozialversicherungsträger und Krankenanstalten im gesetzlich vorgesehenen Umfang, die Entbindung durch die Patientin oder den Patienten und den Schutz überwiegender Interessen, wenn die Offenbarung dafür erforderlich ist. Die Nutzung eines KI-Dienstes zur Arbeitserleichterung fällt unter keine dieser Ausnahmen.",
        },
        {
          type: "p",
          text: "Für die Weitergabe an Dienstleister gilt in Österreich ein strenger Maßstab: Ein Auftragsverarbeitungsvertrag nach DSGVO regelt den Datenschutz, entbindet aber nicht von der ärztlichen Verschwiegenheit. Wer Patientendaten an einen Dienstleister gibt, muss sicherstellen, dass dieser als Hilfsperson in den Behandlungsbetrieb eingebunden ist und die Weitergabe für die Behandlung oder Verwaltung erforderlich ist. Bei einem allgemeinen KI-Chatdienst ist beides zweifelhaft.",
        },
      ],
    },
    {
      id: "deutschland",
      heading: "Deutschland: § 203 StGB und Berufsordnung",
      blocks: [
        {
          type: "p",
          text: "In Deutschland stellt **§ 203 Abs. 1 Nr. 1 StGB** das unbefugte Offenbaren eines fremden Geheimnisses durch Ärztinnen und Ärzte unter Strafe: Freiheitsstrafe bis zu einem Jahr oder Geldstrafe. Dazu kommt die berufsrechtliche Schweigepflicht nach § 9 der (Muster-)Berufsordnung, die die Landesärztekammern in ihre Berufsordnungen übernommen haben.",
        },
        {
          type: "p",
          text: "Seit der Reform 2017 erlaubt § 203 Abs. 3 StGB, Geheimnisse gegenüber „sonstigen mitwirkenden Personen“ zu offenbaren, soweit das für deren Tätigkeit erforderlich ist – gemeint sind etwa IT-Dienstleister, die Praxissoftware warten. Voraussetzung ist, dass die mitwirkende Person zur Geheimhaltung verpflichtet wird (§ 203 Abs. 4 StGB) und die Offenbarung wirklich erforderlich ist.",
        },
        {
          type: "p",
          text: "Ob ein KI-Dienst eine solche mitwirkende Person sein kann, ist umstritten. Gegen die Einordnung sprechen vor allem Dienste, die Eingaben speichern, zum Training verwenden oder außerhalb der EU verarbeiten, und die nicht weisungsgebunden für Ihre Praxis tätig sind. Selbst bei Unternehmensverträgen mit Trainingsausschluss bleibt die Frage der Erforderlichkeit: Ein Arztbrief lässt sich auch ohne Übermittlung der Patientendaten entwerfen – siehe unten.",
        },
      ],
    },
    {
      id: "dsgvo",
      heading: "Dazu kommt die DSGVO: Art. 9 für Gesundheitsdaten",
      blocks: [
        {
          type: "p",
          text: "Schweigepflicht und Datenschutzrecht gelten nebeneinander. Gesundheitsdaten sind **besondere Kategorien personenbezogener Daten** (Art. 9 Abs. 1 DSGVO); ihre Verarbeitung ist grundsätzlich verboten und nur mit einer der Ausnahmen aus Art. 9 Abs. 2 erlaubt. Für die Behandlung ist das in der Regel Art. 9 Abs. 2 lit. h in Verbindung mit Abs. 3 – Verarbeitung durch Personen, die dem Berufsgeheimnis unterliegen. Ein externer KI-Dienst ist keine solche Person.",
        },
        {
          type: "p",
          text: "Wer Patientendaten an einen Dienstleister gibt, braucht außerdem einen Auftragsverarbeitungsvertrag (Art. 28 DSGVO), muss bei Anbietern außerhalb der EU die Regeln für Drittlandübermittlungen einhalten (Art. 44 ff.) und die Betroffenen informieren. Die DSGVO nennt Pseudonymisierung ausdrücklich als Schutzmaßnahme (Art. 25, Art. 32) – sie hebt die Pflichten nicht auf, senkt aber das Risiko und den Prüfaufwand erheblich.",
        },
        {
          type: "callout",
          title: "Zwei Hürden, nicht eine",
          text: "Ein Auftragsverarbeitungsvertrag löst die datenschutzrechtliche Frage, nicht die Schweigepflicht. Und eine Einwilligung der Patientin löst beide, ist im Praxisalltag aber aufwendig: Sie muss freiwillig, informiert und dokumentiert sein und kann jederzeit widerrufen werden.",
        },
      ],
    },
    {
      id: "ki-dienste",
      heading: "Was das für ChatGPT, Claude und andere KI-Dienste heißt",
      blocks: [
        {
          type: "table",
          head: ["Was Sie eingeben", "Schweigepflicht", "DSGVO"],
          rows: [
            [
              "Befund oder Arztbrief im Klartext, mit Namen",
              "Offenbaren gegenüber einem Dritten – ohne Einwilligung oder Ausnahme unzulässig",
              "Verarbeitung von Gesundheitsdaten durch einen Dritten; Vertrag, Rechtsgrundlage und Drittlandprüfung nötig",
            ],
            [
              "Dasselbe mit ausdrücklicher Einwilligung der Patientin",
              "Zulässig, soweit die Einwilligung reicht; dokumentieren",
              "Art. 9 Abs. 2 lit. a; Vertrag mit dem Anbieter bleibt nötig",
            ],
            [
              "Pseudonymisierter Text: Namen, Daten, Nummern, Adressen und Behandler durch Platzhalter ersetzt, Zuordnung bleibt in der Praxis",
              "Kein Geheimnis wird offenbart, solange der Empfänger die Person nicht erkennen kann – seltene Merkmale prüfen",
              "Deutlich geringeres Risiko; ob für den Anbieter noch ein Personenbezug besteht, hängt vom Einzelfall ab (EuGH C‑413/23 P)",
            ],
            [
              "Allgemeine Frage ohne Fallbezug („Wie ist der Aufbau eines Arztbriefs?“)",
              "Unproblematisch",
              "Unproblematisch",
            ],
          ],
        },
        {
          type: "p",
          text: "Die Zeile, die im Alltag zählt, ist die dritte: Der Arztbrief lässt sich aus einem Befund entwerfen, in dem statt „Maria Huber, geb. 12.03.1968“ nur „[PERSON_1], geb. [DATUM_1]“ steht. Der medizinische Inhalt bleibt, das Geheimnis – wer die Person ist – bleibt bei Ihnen. Wie das konkret geht, zeigt der Ratgeber [Arztbrief schreiben mit KI](/ratgeber/arztbrief-schreiben-mit-ki).",
        },
        {
          type: "p",
          text: "Eine Grenze bleibt: Auch ohne Namen kann ein Text eine Person verraten, wenn eine seltene Diagnose, ein ungewöhnlicher Verlauf, ein genaues Datum und eine kleine Einrichtung zusammenkommen. Solche Stellen müssen Sie selbst erkennen und zusätzlich entschärfen. Pseudonymisierung ist eine Methode, keine Entbindung von der eigenen Prüfung.",
        },
      ],
    },
    {
      id: "checkliste",
      heading: "Checkliste für die Praxis",
      blocks: [
        {
          type: "ol",
          items: [
            "**Keine Klartext-Patientendaten in KI-Dienste.** Weder in kostenlose Chatdienste noch in Unternehmensversionen, solange nicht Einwilligung oder eine geprüfte Rechtsgrundlage vorliegen.",
            "**Vor der Eingabe pseudonymisieren.** Namen, Geburtsdaten, Versicherungs- und Aktennummern, Adressen, Behandler und Einrichtungen durch Platzhalter ersetzen; die Zuordnung bleibt in der Praxis.",
            "**Prüfen, was übrig bleibt.** Seltene Diagnosen, genaue Daten, kleine Orte: im Zweifel vergröbern oder weglassen.",
            "**Anbieter bewusst wählen.** Keine Nutzung der Eingaben zum Training, Vertrag zur Auftragsverarbeitung, Speicherort in der EU wo möglich – auch für pseudonymisierte Texte eine gute Praxis.",
            "**Team einweisen.** Die Schweigepflicht gilt für alle in der Praxis; eine kurze schriftliche Regel, welche Werkzeuge wie genutzt werden dürfen, verhindert Zufallsentscheidungen.",
            "**Dokumentieren.** Welche Werkzeuge im Einsatz sind, was hineingeht und warum – das ist im Fall einer Anfrage der Kammer oder der Datenschutzbehörde Gold wert.",
            "**Im Zweifel fragen.** Ärztekammer, Datenschutzbeauftragte oder Rechtsbeistand – bevor der erste Befund den Rechner verlässt, nicht danach.",
          ],
        },
      ],
    },
    {
      id: "custix",
      heading: "Was custix dabei leistet – und was nicht",
      blocks: [
        {
          type: "p",
          text: "custix pseudonymisiert Befunde, Arztbriefe und andere Dokumente direkt in Ihrem Browser: Es erkennt Namen, Geburtsdaten, Versicherungs- und Aktennummern, Adressen, Behandler und Einrichtungen und ersetzt sie durch Platzhalter wie [PERSON_1] oder [DATUM_1]. Die Zuordnung bleibt auf Ihrem Gerät und wird weder an uns noch an einen KI-Anbieter übertragen. Die Antwort der KI setzen Sie mit custix lokal wieder in den Klartext zurück.",
        },
        {
          type: "p",
          text: "Was custix nicht kann: die rechtliche Prüfung Ihres Einzelfalls abnehmen oder erkennen, ob der verbleibende Inhalt eine Person verrät. Dafür gibt es die Prüfansicht, in der Sie weitere Stellen markieren, und diesen Ratgeber, der die Fragen benennt, die Sie sich vorher stellen sollten.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "Darf ich ChatGPT für Arztbriefe nutzen?",
      a: "Ja, wenn keine Patientendaten übermittelt werden: Entweder Sie geben nur allgemeine Fragen ein, oder Sie pseudonymisieren den Befund vorher, sodass Namen, Daten, Nummern und Adressen durch Platzhalter ersetzt sind. Mit Klartext-Patientendaten brauchen Sie eine Einwilligung oder eine geprüfte Rechtsgrundlage – für den Alltag ist das selten praktikabel. Anleitung: Arztbrief schreiben mit KI.",
    },
    {
      q: "Gilt die Schweigepflicht auch gegenüber einem KI-Anbieter mit Auftragsverarbeitungsvertrag?",
      a: "Ja. Der Vertrag regelt den Datenschutz (Art. 28 DSGVO), nicht die Schweigepflicht. In Deutschland kann ein Dienstleister unter engen Voraussetzungen „mitwirkende Person“ nach § 203 Abs. 3 StGB sein; ob das für einen allgemeinen KI-Dienst gilt, ist umstritten. In Österreich ist der Maßstab noch strenger. Im Zweifel: keine Patientendaten übermitteln.",
    },
    {
      q: "Welche Ausnahmen von der ärztlichen Schweigepflicht gibt es?",
      a: "Gesetzliche Melde- und Auskunftspflichten (etwa nach Epidemie- oder Infektionsschutzrecht), die Entbindung durch die Patientin oder den Patienten, Mitteilungen an Sozialversicherung und mitbehandelnde Einrichtungen im gesetzlich vorgesehenen Umfang sowie der Schutz überwiegender Interessen. Arbeitserleichterung durch Software gehört nicht dazu.",
    },
    {
      q: "Was droht bei einer Verletzung der Schweigepflicht?",
      a: "In Österreich ist die Verletzung von Berufsgeheimnissen nach § 121 StGB gerichtlich strafbar und kann disziplinarrechtliche Folgen haben. In Deutschland droht nach § 203 StGB Freiheitsstrafe bis zu einem Jahr oder Geldstrafe, dazu berufsrechtliche Maßnahmen. Unabhängig davon können Datenschutzbehörden Bußgelder verhängen und Betroffene Schadenersatz verlangen.",
    },
    {
      q: "Ist Pseudonymisierung eine Entbindung von der Schweigepflicht?",
      a: "Nein. Sie sorgt dafür, dass kein Geheimnis offenbart wird, weil der Empfänger die Person nicht erkennen kann. Das setzt voraus, dass wirklich alle identifizierenden Angaben ersetzt sind und der Rest keine Rückschlüsse erlaubt. Die Zuordnung bleibt bei Ihnen und unterliegt weiter der Schweigepflicht.",
    },
    {
      q: "Was ist der Unterschied zwischen Schweigepflicht und Datenschutz?",
      a: "Die Schweigepflicht schützt das anvertraute Geheimnis und richtet sich an Sie als Ärztin oder Arzt; sie gilt auch für Informationen ohne Datenbezug, etwa ein Gespräch. Die DSGVO schützt personenbezogene Daten bei jeder Verarbeitung und richtet sich an alle Verantwortlichen. Bei KI-Diensten müssen Sie beide Hürden nehmen.",
    },
  ],
};

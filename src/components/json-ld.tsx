type JsonLdProps = {
  data: Record<string, unknown>;
};

function JsonLdScript({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "custix.ai",
        url: "https://custix.ai",
        logo: "https://custix.ai/icon.png",
        description:
          "Document anonymization software for AI. 100% local, GDPR-compliant.",
        founders: [
          { "@type": "Person", name: "Laurenz Lettner" },
          { "@type": "Person", name: "Lorenz Kutschka" },
          { "@type": "Person", name: "Moritz Lumetsberger" },
        ],
        contactPoint: {
          "@type": "ContactPoint",
          email: "kontakt@custix.ai",
          contactType: "customer support",
          availableLanguage: ["German", "English"],
        },
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "custix.ai",
        url: "https://custix.ai",
        inLanguage: ["de", "en"],
      }}
    />
  );
}

export function FAQJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      }}
    />
  );
}

export function SoftwareApplicationJsonLd({ locale }: { locale: string }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "custix.ai",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Windows, macOS",
        description:
          locale === "de"
            ? "Dokumenten-Anonymisierung für KI. 100% lokal, DSGVO-konform."
            : "Document anonymization for AI. 100% local, GDPR-compliant.",
        offers: [
          {
            "@type": "Offer",
            name: locale === "de" ? "Einzelplatz" : "Individual",
            price: "49",
            priceCurrency: "EUR",
            priceValidUntil: "2027-12-31",
          },
          {
            "@type": "Offer",
            name: "Team",
            price: "39",
            priceCurrency: "EUR",
            priceValidUntil: "2027-12-31",
            eligibleQuantity: {
              "@type": "QuantitativeValue",
              minValue: 3,
            },
          },
        ],
      }}
    />
  );
}

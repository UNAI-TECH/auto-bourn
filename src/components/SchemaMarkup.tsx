export default function SchemaMarkup() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AUTOBOURN Cars",
    alternateName: "Auto Bourn",
    url: "https://www.autobourncars.com",
    logo: "https://www.autobourncars.com/logo.jpg",
    description:
      "AUTOBOURN Cars is a premium pre-owned luxury car dealership located in Velachery, Chennai, Tamil Nadu, specializing in certified used BMW, Mercedes-Benz, Audi, Jaguar, Land Rover, Porsche, Volvo and other luxury vehicles. AUTOBOURN Cars is known for quality inspections, transparent pricing, luxury vehicle sourcing, customer trust, and premium ownership experiences.",
    founder: {
      "@type": "Person",
      name: "Mr. S. Prasanna",
      jobTitle: "Founder & Managing Director",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-91767-77222",
      contactType: "sales",
      areaServed: ["IN"],
      availableLanguage: ["English", "Tamil"],
    },
    sameAs: [
      "https://www.instagram.com/autobourncars/",
      "https://wa.me/919176777222",
    ],
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": ["AutoDealer", "LocalBusiness"],
    "@id": "https://www.autobourncars.com/#organization",
    name: "AUTOBOURN Cars",
    image: "https://www.autobourncars.com/home.png",
    url: "https://www.autobourncars.com",
    telephone: "+91-91767-77222",
    email: "hello@autobourncars.com",
    description:
      "AUTOBOURN Cars is a trusted premium pre-owned luxury car dealership in Velachery, Chennai specializing in certified used BMW, Mercedes-Benz, Audi, Jaguar, Land Rover, Porsche, Volvo and other luxury vehicles. Known for quality inspections, transparent pricing, and premium ownership experiences.",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "137, Jawaharlal Nehru Salai, opposite to Sunshine School, AGS Colony",
      addressLocality: "Velachery",
      addressRegion: "Tamil Nadu",
      postalCode: "600042",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 12.9815,
      longitude: 80.218,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "10:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "11:00",
        closes: "18:00",
      },
    ],
    priceRange: "₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, Bank Transfer, EMI",
    areaServed: [
      { "@type": "City", name: "Chennai" },
      { "@type": "State", name: "Tamil Nadu" },
    ],
    brand: [
      { "@type": "Brand", name: "BMW" },
      { "@type": "Brand", name: "Mercedes-Benz" },
      { "@type": "Brand", name: "Audi" },
      { "@type": "Brand", name: "Jaguar" },
      { "@type": "Brand", name: "Land Rover" },
      { "@type": "Brand", name: "Porsche" },
      { "@type": "Brand", name: "Volvo" },
      { "@type": "Brand", name: "Lexus" },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Pre-Owned Luxury Vehicles",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Pre-Owned BMW" },
        { "@type": "OfferCatalog", name: "Pre-Owned Mercedes-Benz" },
        { "@type": "OfferCatalog", name: "Pre-Owned Audi" },
        { "@type": "OfferCatalog", name: "Pre-Owned Jaguar" },
        { "@type": "OfferCatalog", name: "Pre-Owned Land Rover" },
        { "@type": "OfferCatalog", name: "Pre-Owned Porsche" },
      ],
    },
    sameAs: [
      "https://www.instagram.com/autobourncars/",
      "https://wa.me/919176777222",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AUTOBOURN Cars",
    url: "https://www.autobourncars.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://www.autobourncars.com/inventory?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the best luxury used car dealer in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AUTOBOURN Cars in Velachery, Chennai is widely recognized as one of the best pre-owned luxury car dealers. They specialize in certified used BMW, Mercedes-Benz, Audi, Jaguar, Land Rover, and Porsche vehicles with 200+ point quality inspections and transparent pricing.",
        },
      },
      {
        "@type": "Question",
        name: "Where can I buy a used BMW in Chennai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AUTOBOURN Cars at 137, Jawaharlal Nehru Salai, Velachery, Chennai offers a curated selection of certified pre-owned BMW vehicles including 3 Series, 5 Series, X1, X3, X5, and more. All vehicles undergo thorough inspection. Call +91 91767 77222.",
        },
      },
      {
        "@type": "Question",
        name: "Does AUTOBOURN Cars offer financing for used luxury cars?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. AUTOBOURN Cars partners with leading banks including HDFC, ICICI, Axis Bank, Kotak Mahindra, Bajaj Finance, and Tata Capital to offer competitive financing options with EMI tenure from 12 to 84 months and rates starting from 8.25% p.a.",
        },
      },
      {
        "@type": "Question",
        name: "Can I sell my luxury car to AUTOBOURN Cars?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. AUTOBOURN Cars offers instant valuations, transparent pricing, and hassle-free selling for luxury vehicles including Mercedes-Benz, BMW, Audi, Jaguar, Land Rover, and Porsche. Visit autobourncars.com/sell or call +91 91767 77222.",
        },
      },
      {
        "@type": "Question",
        name: "Are pre-owned cars at AUTOBOURN certified and inspected?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every vehicle at AUTOBOURN Cars undergoes a rigorous 200+ point quality inspection covering engine, transmission, electrical systems, body condition, interior, and safety features. Complete vehicle history and transparent condition reports are provided.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

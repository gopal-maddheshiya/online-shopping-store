/**
 * Centralized SEO & AEO (Answer Engine Optimization) Engine
 * Generates valid Schema.org JSON-LD structured data and meta tags for Google,
 * Bing, and AI Answer Engines (Perplexity, ChatGPT Search, Gemini, Claude, Copilot).
 */

import { SITE_URL, STORE_NAME_EN, STORE_NAME_HI, STORE_TAGLINE } from "@/lib/site-config";
import type { StoreSettings, Product, Variant, Category } from "@/lib/queries";
import type { ReviewStats } from "@/lib/reviews";

export const GEO_COORDINATES = {
  latitude: "27.1472",
  longitude: "83.5619",
};

export const STORE_ADDRESS = {
  streetAddress: "Ramnagar Chauraha, Adda Bazar Road",
  addressLocality: "Maharajganj",
  addressRegion: "Uttar Pradesh",
  postalCode: "273303",
  addressCountry: "IN",
};

export const STORE_DEFAULT_PHONE = "+916388354988";
export const STORE_DEFAULT_EMAIL = "gopalmaddheshiya138@gmail.com";
export const STORE_DEFAULT_IMAGE =
  "https://rvpskkgrobztgcfznawl.supabase.co/storage/v1/object/public/product-images/og/agt-og-banner.jpg";

/**
 * Standardized Local SEO Geo Meta Tags
 */
export const LOCAL_GEO_META = [
  { name: "geo.region", content: "IN-UP" },
  { name: "geo.placename", content: "Maharajganj" },
  { name: "geo.position", content: `${GEO_COORDINATES.latitude};${GEO_COORDINATES.longitude}` },
  { name: "ICBM", content: `${GEO_COORDINATES.latitude}, ${GEO_COORDINATES.longitude}` },
];

/**
 * Standard Robots Meta Tags for indexable public pages
 */
export const PUBLIC_ROBOTS_META = [
  {
    name: "robots",
    content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  },
  {
    name: "googlebot",
    content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  },
];

/**
 * Robots Meta for private / transactional pages
 */
export const NOINDEX_ROBOTS_META = [
  { name: "robots", content: "noindex, follow" },
  { name: "googlebot", content: "noindex, follow" },
];

/**
 * Schema 1: LocalBusiness & GroceryStore Schema
 */
export function getStoreSchema(settings?: Partial<StoreSettings> | null) {
  const phone = settings?.phone ? settings.phone.replace(/\s+/g, "") : STORE_DEFAULT_PHONE;
  const email = settings?.email || STORE_DEFAULT_EMAIL;
  const freeThreshold = settings?.free_delivery_threshold ?? 499;

  return {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "@id": `${SITE_URL}/#store`,
    name: STORE_NAME_EN,
    alternateName: STORE_NAME_HI,
    description:
      "अरुण गोपाल ट्रेडर्स — रामनगर, महाराजगंज की विश्वसनीय स्थानीय किराना दुकान। 100% शुद्ध आटा, चावल, दालें, तेल, मसाले, पूजा सामग्री व घरेलू उत्पाद।",
    url: SITE_URL,
    logo: `${SITE_URL}/agt-favicon.png`,
    image: STORE_DEFAULT_IMAGE,
    telephone: phone,
    email: email,
    priceRange: "₹",
    currenciesAccepted: "INR",
    paymentAccepted:
      "Cash on Delivery, UPI, PhonePe, Google Pay, Paytm, BHIM QR, Net Banking, Credit/Debit Card",
    address: {
      "@type": "PostalAddress",
      ...STORE_ADDRESS,
    },
    geo: {
      "@type": "GeoCoordinates",
      ...GEO_COORDINATES,
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
          "Sunday",
        ],
        opens: "07:00",
        closes: "21:00",
      },
    ],
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "Maharajganj",
      },
      {
        "@type": "AdministrativeArea",
        name: "Ramnagar",
      },
      {
        "@type": "AdministrativeArea",
        name: "Adda Bazar",
      },
      {
        "@type": "AdministrativeArea",
        name: "Uttar Pradesh",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Grocery & Daily Provisions Catalog",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Atta, Flour & Grains (आटा व अनाज)",
          url: `${SITE_URL}/shop?category=atta-flour-grains`,
        },
        {
          "@type": "OfferCatalog",
          name: "Rice & Paddy Products (चावल व पोहा)",
          url: `${SITE_URL}/shop?category=rice`,
        },
        {
          "@type": "OfferCatalog",
          name: "Pulses & Dal (दालें व दलहन)",
          url: `${SITE_URL}/shop?category=pulses-dal`,
        },
        {
          "@type": "OfferCatalog",
          name: "Edible Oil & Ghee (तेल व देसी घी)",
          url: `${SITE_URL}/shop?category=oil-ghee`,
        },
        {
          "@type": "OfferCatalog",
          name: "Spices & Masala (शुद्ध मसाले)",
          url: `${SITE_URL}/shop?category=spices-masala`,
        },
        {
          "@type": "OfferCatalog",
          name: "Puja Samagri (पूजा सामग्री)",
          url: `${SITE_URL}/shop?category=dhoop-batti`,
        },
      ],
    },
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop`,
        inLanguage: ["hi", "en"],
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
      priceSpecification: {
        "@type": "DeliveryChargeSpecification",
        price: 0,
        priceCurrency: "INR",
        eligibleTransactionVolume: {
          "@type": "PriceSpecification",
          price: freeThreshold,
          priceCurrency: "INR",
        },
      },
    },
  };
}

/**
 * Schema 2: WebSite Schema with Sitelinks Searchbox
 */
export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: `${STORE_NAME_HI} — ${STORE_NAME_EN}`,
    description: STORE_TAGLINE,
    inLanguage: ["hi", "en"],
    publisher: {
      "@id": `${SITE_URL}/#store`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Schema 3: Organization Schema
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: STORE_NAME_EN,
    alternateName: STORE_NAME_HI,
    url: SITE_URL,
    logo: `${SITE_URL}/agt-favicon.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: STORE_DEFAULT_PHONE,
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["Hindi", "Bhojpuri", "English"],
      },
    ],
  };
}

/**
 * Core bilingual Q&A list for AEO and direct AI retrieval
 */
export const CORE_FAQ_ITEMS = [
  {
    q_hi: "अरुण गोपाल ट्रेडर्स की दुकान कहाँ स्थित है?",
    q_en: "Where is Arun Gopal Traders located in Maharajganj?",
    a_hi: "अरुण गोपाल ट्रेडर्स रामनगर चौराहा, अड्डा बाजार रोड, महराजगंज, उत्तर प्रदेश (पिनकोड 273303) पर स्थित है। यहाँ से आप सीधे दुकान पर आकर भी खरीदारी कर सकते हैं।",
    a_en: "Arun Gopal Traders is located at Ramnagar Chauraha on Adda Bazar Road, Maharajganj, Uttar Pradesh (PIN 273303). Customers can visit the store counter directly or order online.",
  },
  {
    q_hi: "क्या महराजगंज और रामनगर में होम डिलीवरी उपलब्ध है?",
    q_en: "Is home delivery available in Maharajganj and nearby areas?",
    a_hi: "हाँ, हम महराजगंज शहर, रामनगर, अड्डा बाजार और आसपास के 10-15 किलोमीटर क्षेत्र में तेज़ होम डिलीवरी व स्टोर पिकअप दोनों की सुविधा देते हैं। डिलीवरी सेवा चालू होने पर ₹499+ के आर्डर पर होम डिलीवरी मुफ़्त है, अथवा आप दुकान से सीधा पिकअप भी ले सकते हैं।",
    a_en: "Yes, we provide both fast doorstep delivery and direct store pickup across Maharajganj city, Ramnagar, Adda Bazar, and adjacent areas. When delivery is enabled, orders above ₹499 qualify for Free Home Delivery; store pickup is always available for free.",
  },
  {
    q_hi: "दुकान खुलने और बंद होने का क्या समय है?",
    q_en: "What are the store opening hours?",
    a_hi: "हमारी दुकान सप्ताह के सातों दिन (सोमवार से रविवार) सुबह 7:00 बजे से रात 9:00 बजे तक खुली रहती है। वेबसाइट और व्हाट्सएप पर आप 24 घंटे आर्डर कर सकते हैं।",
    a_en: "Our store is open 7 days a week (Monday to Sunday) from 7:00 AM to 9:00 PM IST. Online and WhatsApp orders can be submitted 24/7.",
  },
  {
    q_hi: "WhatsApp या फ़ोन पर किराना सामान कैसे मँगवाएँ?",
    q_en: "How can I order groceries via WhatsApp or phone call?",
    a_hi: "आप अपने राशन की लिस्ट हमारे WhatsApp नंबर +91 6388354988 पर लिखकर या फ़ोटो खींचकर भेज सकते हैं, या सीधे कॉल करके आर्डर लिखवा सकते हैं।",
    a_en: "Simply send your grocery list text or photo to our official WhatsApp number +91 6388354988, or call us directly to dictate your order.",
  },
  {
    q_hi: "पेमेंट के कौन-कौन से तरीके उपलब्ध हैं?",
    q_en: "Which payment options are supported?",
    a_hi: "हम कैश ऑन डिलीवरी (COD), UPI (Google Pay, PhonePe, Paytm, QR कोड स्कैन) और ऑनलाइन नेट बैंकिंग सभी स्वीकार करते हैं।",
    a_en: "We support Cash on Delivery (COD), UPI payments (Google Pay, PhonePe, Paytm, BHIM QR codes), and secure online payments.",
  },
  {
    q_hi: "क्या यहाँ 100% शुद्ध और असली राशन मिलता है?",
    q_en: "Are grocery products 100% genuine and sealed?",
    a_hi: "हाँ, अरुण गोपाल ट्रेडर्स पर केवल प्रमाणित व ओरिजिनल ब्रांडेड सामान (आशीर्वाद, फॉर्च्यून, टाटा, एमडीएच, एवरेस्ट, अमुल आदि) मिलता है। सामान में कोई कमी होने पर तुरंत रिप्लेसमेंट गारंटी है।",
    a_en: "Yes, Arun Gopal Traders guarantees 100% original, sealed FMCG brands (Aashirvaad, Fortune, Tata, MDH, Everest, Amul). If any packet is damaged, we provide immediate same-day replacement.",
  },
  {
    q_hi: "क्या महीने के राशन का स्मार्ट राशन पैक उपलब्ध है?",
    q_en: "Can I order monthly grocery kits in bulk?",
    a_hi: "हाँ, हमारी वेबसाइट पर 'स्मार्ट राशन' की सुविधा है जिससे आप छोटे, मध्यम या बड़े परिवार के लिए 1 महीने का पूरा राशन 1-क्लिक में डिस्काउंट के साथ मंगा सकते हैं।",
    a_en: "Yes, our Smart Ration feature lets you order complete 1-month family grocery packs (Atta, Dal, Rice, Oil, Spices) in a single click with bundle savings.",
  },
  {
    q_hi: "अपने आर्डर का लाइव स्टेटस कैसे ट्रैक करें?",
    q_en: "How do I track my active order status?",
    a_hi: "वेबसाइट के 'ऑर्डर ट्रैक करें' पेज पर जाकर अपना आर्डर नंबर या मोबाइल नंबर डालें और तुरंत लाइव स्टेटस (कन्फर्म, पैक्ड, डिलीवरी के लिए रवाना) देखें।",
    a_en: "Visit the Track Order page at https://arun-gopal-traders.vercel.app/track and enter your Order Number or phone number to see live fulfillment updates.",
  },
];

/**
 * Schema 4: FAQPage Schema
 */
export function getStoreFaqSchema(lang: "hi" | "en" = "hi") {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: CORE_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: lang === "hi" ? item.q_hi : item.q_en,
      acceptedAnswer: {
        "@type": "Answer",
        text: lang === "hi" ? item.a_hi : item.a_en,
      },
    })),
  };
}

/**
 * Schema 5: BreadcrumbList Schema
 */
export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}

/**
 * Schema 6: Rich Product Schema for Google Merchant / AI SGE
 */
export function getProductSchema(params: {
  product: Product;
  pageUrl: string;
  imageUrl: string;
  variants: Variant[];
  reviews?: ReviewStats | null | undefined;
  categoryName?: string | null | undefined;
}) {
  const { product, pageUrl, imageUrl, variants, reviews, categoryName } = params;
  const primaryVariant = variants[0];
  const lowestPrice = variants.reduce(
    (min, v) => (v.price < min ? v.price : min),
    primaryVariant?.price || 0,
  );
  const highestPrice = variants.reduce(
    (max, v) => (v.price > max ? v.price : max),
    primaryVariant?.price || 0,
  );
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const isAvailable = totalStock > 0;

  const desc =
    product.description ||
    `${product.name} — ताज़ा एवं 100% शुद्ध किराना सामान, अरुण गोपाल ट्रेडर्स महाराजगंज से ऑर्डर करें।`;

  const offers =
    variants.length > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: String(Math.round(lowestPrice)),
          highPrice: String(Math.round(highestPrice)),
          offerCount: variants.length,
          availability: isAvailable
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          offers: variants.map((v) => ({
            "@type": "Offer",
            name: `${product.name} (${v.label})`,
            price: String(Math.round(v.price)),
            priceCurrency: "INR",
            sku: v.sku || `${product.id}-${v.id}`,
            availability:
              v.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            url: pageUrl,
            priceValidUntil: "2027-12-31",
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value: "0",
                currency: "INR",
              },
              shippingDestination: {
                "@type": "DefinedRegion",
                addressCountry: "IN",
                postalCode: "273303",
              },
            },
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "IN",
              returnPolicyCategory:
                "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 1,
              returnMethod: "https://schema.org/ReturnInStore",
              returnFees: "https://schema.org/FreeReturn",
            },
          })),
        }
      : {
          "@type": "Offer",
          url: pageUrl,
          priceCurrency: "INR",
          price: String(Math.round(primaryVariant?.price || 0)),
          sku: primaryVariant?.sku || product.id,
          availability: isAvailable
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          priceValidUntil: "2027-12-31",
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: "0",
              currency: "INR",
            },
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "IN",
              postalCode: "273303",
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory:
              "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: 1,
            returnMethod: "https://schema.org/ReturnInStore",
            returnFees: "https://schema.org/FreeReturn",
          },
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}/#product`,
    name: product.name,
    alternateName: product.name_hi || undefined,
    image: imageUrl,
    description: desc,
    category: categoryName || undefined,
    brand: {
      "@type": "Brand",
      name: product.brand || STORE_NAME_EN,
    },
    sku: primaryVariant?.sku || product.id,
    ...(primaryVariant?.barcode ? { gtin: primaryVariant.barcode } : {}),
    offers,
    ...(reviews && reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(reviews.average.toFixed(1)),
            reviewCount: String(reviews.count),
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };
}

/**
 * Schema 7: ItemList Schema for Catalogue / Collection Pages
 */
export function getItemListSchema(
  items: Array<{ name: string; url: string; image?: string; price?: number }>,
  title: string = "Product Catalogue",
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}


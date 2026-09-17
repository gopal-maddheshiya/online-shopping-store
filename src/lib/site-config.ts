/**
 * Centralized Site Configuration
 * Single Source of Truth for domain URLs, SEO, canonical links, and social shares.
 */

export const SITE_URL: string =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SITE_URL"]) ||
  (typeof process !== "undefined" && process.env?.["VITE_SITE_URL"]) ||
  "https://arun-gopal-traders.vercel.app";

export const STORE_NAME_EN = "Arun Gopal Traders";
export const STORE_NAME_HI = "अरुण गोपाल ट्रेडर्स";
export const STORE_TAGLINE = "रामनगर चौराहा, अड्डा बाजार रोड, महराजगंज";

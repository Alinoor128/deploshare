/**
 * DeploShare Brand & System Configuration
 * Centralized configuration makes it easy to rename or rebrand the product in the future.
 */

const resolveBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "https://deploshare.com";
};

export const BRAND_CONFIG = {
  name: "DeploShare",
  tagline: "Secure File & Text Sharing With Just a Code",
  description:
    "Upload a file or text, get a secure 6-digit code, and share it instantly. Fast, ephemeral, and private.",
  url: resolveBaseUrl(),
  domain: "deploshare.com",
  author: "DeploShare Inc.",
  supportEmail: "support@deploshare.com",
  defaultExpirySeconds: 86400, // 24 hours
  maxAnonymousFileSizeMB: 25,
  maxFreeUserFileSizeMB: 100,
  maxCodeAttempts: 5,
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  features: {
    anonymousSharing: true,
    qrCodeEnabled: true,
    reportsEnabled: true,
  },
} as const;

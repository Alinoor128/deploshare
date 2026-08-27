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
  maxProUserFileSizeMB: 2048, // 2GB
  maxCodeAttempts: 5,
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  features: {
    anonymousSharing: true,
    qrCodeEnabled: true,
    reportsEnabled: true,
  },
  plans: {
    FREE: {
      name: "Free",
      price: "$0",
      period: "forever",
      maxFileSize: "100 MB",
      maxExpiryDays: 7,
      storageLimitMB: 500,
      features: [
        "Upload files up to 100 MB",
        "Text and code snippet sharing",
        "Expiration up to 7 days",
        "Password protection",
        "Download limits & Burn on access",
        "Standard 6-digit code sharing",
      ],
    },
    PRO: {
      name: "Pro",
      price: "$9",
      period: "month",
      popular: true,
      maxFileSize: "2 GB",
      maxExpiryDays: 30,
      storageLimitMB: 10240, // 10 GB
      features: [
        "Upload files up to 2 GB",
        "Expiration up to 30 days",
        "Custom expiration timers",
        "Advanced share analytics & logs",
        "Priority download speeds",
        "Unlimited active shares",
      ],
    },
    BUSINESS: {
      name: "Business",
      price: "$29",
      period: "month",
      maxFileSize: "10 GB",
      maxExpiryDays: 90,
      storageLimitMB: 51200, // 50 GB
      features: [
        "Upload files up to 10 GB",
        "Expiration up to 90 days",
        "Custom branded access domain",
        "Dedicated audit logs & exports",
        "Organization team seats",
        "Priority 24/7 dedicated support",
      ],
    },
  },
} as const;

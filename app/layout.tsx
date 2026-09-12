import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DeveloperFollowBanner } from '@/components/layout/DeveloperFollowBanner';
import { BRAND_CONFIG } from '@/lib/config/brand';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_CONFIG.url),
  title: {
    default: `${BRAND_CONFIG.name} — Secure 6-Digit Code Temporary File & Text Sharing`,
    template: `%s | ${BRAND_CONFIG.name}`,
  },
  description:
    'DeploShare is the fastest, ultra-secure code-only file and text sharing platform. Upload files or confidential text notes, generate an instant 6-digit numeric PIN, and share with zero permanent URLs. Features burn-on-download, bcrypt password encryption, and auto-expiry.',
  keywords: [
    'DeploShare',
    'deplo share',
    'deploshare.com',
    'file share',
    'file sharing',
    'temporary file share',
    '6 digit code file share',
    'code based file sharing',
    'share files with code',
    'anonymous file sharing',
    'burn after download file share',
    'temporary text share',
    'secure code sharing',
    'send large files without url',
    'ephemeral file transfer',
    'encrypted temporary storage',
    'password protected file share',
    'free online file share',
    'fast code drop',
    'secure file drop',
  ],
  authors: [{ name: 'DeploShare Engineering Team', url: BRAND_CONFIG.url }],
  creator: 'DeploShare Inc.',
  publisher: 'DeploShare Inc.',
  applicationName: 'DeploShare',
  generator: 'Next.js',
  alternates: {
    canonical: BRAND_CONFIG.url,
  },
  verification: {
    google: 'googlec7d26ea88dfa07cb',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'DeploShare — Secure 6-Digit Code Temporary File & Text Sharing',
    description:
      'Upload confidential files or sensitive text, get an instant 6-digit numeric PIN, and share securely. Zero crawlable public links, burn-after-download protection, and automatic file destruction.',
    url: 'https://deploshare.com',
    siteName: 'DeploShare',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DeploShare - Instant 6-Digit Code Temporary File & Text Sharing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeploShare — Secure 6-Digit Code Temporary File & Text Sharing',
    description:
      'The code-only ephemeral file sharing standard. Upload content, receive a 6-digit code, and share without permanent URLs.',
    creator: '@deploshare',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  category: 'technology',
};

// JSON-LD Structured Data Schema for Google Search Rich Results
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://deploshare.com/#webapp',
      name: 'DeploShare',
      url: 'https://deploshare.com',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript and modern web browser',
      description:
        'Secure 6-digit code temporary file and text sharing SaaS. Ephemeral, encrypted, and designed without permanent public links.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        '6-digit numeric code access only',
        'Burn after first download protection',
        'Bcrypt password encryption',
        'In-browser safe previews for PDF and Images',
        'Automated time-based expiration purges',
        'Brute-force lockout and rate limiting',
      ],
    },
    {
      '@type': 'Organization',
      '@id': 'https://deploshare.com/#organization',
      name: 'DeploShare',
      url: 'https://deploshare.com',
      logo: 'https://deploshare.com/logo.png',
      sameAs: ['https://twitter.com/deploshare', 'https://github.com/deploshare'],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://deploshare.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does code-only temporary file sharing work on DeploShare?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'When you upload a file or text snippet, DeploShare generates a cryptographically random, unique 6-digit numeric code (e.g. 583214). You simply share this 6-digit PIN with your recipient. They visit DeploShare, enter the 6 digits, and immediately access the content without any public URL leakage.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is DeploShare safe against brute force guessing attacks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. DeploShare enforces multi-layer brute-force defenses including IP rate limiting, progressive artificial delays, and automatic temporary lockouts after 5 consecutive failed attempts.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Burn-After-Download mode?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'When enabled, DeploShare permanently deletes and destroys the encrypted file from storage immediately after the recipient completes their first download.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <DeveloperFollowBanner />
      </body>
    </html>
  );
}

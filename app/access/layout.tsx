import type { Metadata } from 'next';
import { BRAND_CONFIG } from '@/lib/config/brand';

export const metadata: Metadata = {
  title: 'Access Shared Files & Notes via 6-Digit PIN',
  description:
    'Enter a 6-digit numeric code to access and download confidential files, encrypted notes, and sensitive text shared securely through DeploShare.',
  alternates: {
    canonical: `${BRAND_CONFIG.url}/access`,
  },
  openGraph: {
    title: 'Access Shared Files & Notes via 6-Digit PIN | DeploShare',
    description:
      'Enter your 6-digit numeric code to unlock ephemeral files with zero permanent links.',
    url: `${BRAND_CONFIG.url}/access`,
  },
};

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

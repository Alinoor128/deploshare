import type { Metadata } from 'next';
import { BRAND_CONFIG } from '@/lib/config/brand';

export const metadata: Metadata = {
  title: 'Developer REST API Documentation & CLI Guide',
  description:
    'Integrate ephemeral file sharing and encrypted text transfers directly into your CI/CD pipelines, backend microservices, and scripts using the DeploShare REST API & CLI.',
  alternates: {
    canonical: `${BRAND_CONFIG.url}/api-docs`,
  },
  openGraph: {
    title: 'Developer REST API Documentation & CLI Guide | DeploShare',
    description:
      'Integrate 6-digit code file transfers into your codebase with cURL, JavaScript, and Python SDKs.',
    url: `${BRAND_CONFIG.url}/api-docs`,
  },
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

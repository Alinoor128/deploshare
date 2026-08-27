import type { Metadata } from 'next';
import { ShareCreator } from '@/components/sharing/ShareCreator';
import { BRAND_CONFIG } from '@/lib/config/brand';

export const metadata: Metadata = {
  title: `Create Share — ${BRAND_CONFIG.name}`,
  description: 'Upload a file or text and generate a secure 6-digit code for instant sharing.',
};

export default function SharePage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8">
      <ShareCreator />
    </div>
  );
}

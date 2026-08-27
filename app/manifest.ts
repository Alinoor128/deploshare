import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DeploShare — Secure 6-Digit Code File Sharing',
    short_name: 'DeploShare',
    description: 'Fast, ephemeral, code-only file and text sharing platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07090e',
    theme_color: '#07090e',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

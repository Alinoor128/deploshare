import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DeploShareLogo } from '@/components/ui/DeploShareLogo';
import { KeyRound, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] py-20 px-4 flex items-center justify-center">
      <Card glow floating className="max-w-md p-8 text-center space-y-6 bg-white border-slate-200 shadow-xl shadow-blue-500/5">
        <div className="flex justify-center mb-1">
          <DeploShareLogo size="sm" showText={false} />
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto border border-blue-200 font-mono text-2xl font-black shadow-sm">
          404
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Page or Share Not Found
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The page you requested does not exist or the temporary share code has expired and been automatically purged.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="glow" size="sm" shakeOnHover={true} className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
          <Link href="/access" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" shakeOnHover={true} className="w-full" leftIcon={<KeyRound className="w-4 h-4 text-blue-600" />}>
              Enter 6-Digit Code
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

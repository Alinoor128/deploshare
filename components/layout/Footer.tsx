import React from 'react';
import Link from 'next/link';
import { BRAND_CONFIG } from '@/lib/config/brand';
import { DeploShareLogo } from '@/components/ui/DeploShareLogo';
import { Shield, Zap, Lock, Globe, FileCode } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <DeploShareLogo size="sm" showText={true} />
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              {BRAND_CONFIG.tagline}. Upload files or sensitive text, receive an instant 6-digit numeric PIN, and share with zero permanent URL leakage.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Ephemeral Vaults Active & Secure
            </div>
          </div>

          {/* Quick Links & SEO Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Temporary Sharing
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/share" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Create File Share</span>
                </Link>
              </li>
              <li>
                <Link href="/access" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Access via 6-Digit Code</span>
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-blue-600 transition-colors text-slate-600">
                  Ephemeral Features & Limits
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-blue-600 transition-colors text-slate-600">
                  Plans & Pricing (Free & Pro)
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Security Guarantee
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>6-Digit Cryptographic Code</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Brute-Force Rate Limiting & Lockout</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Burn on First Download</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>Bcrypt Password Encryption</span>
              </li>
            </ul>
          </div>

          {/* Legal / Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Platform & Developers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors text-slate-600">
                  User Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-blue-600 transition-colors text-slate-600">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-blue-600 transition-colors text-blue-600 font-semibold">
                  Developer REST API
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-blue-600 transition-colors text-slate-600">
                  FAQ & Knowledge Base
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Zero Trackers & Cookies</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {currentYear} {BRAND_CONFIG.name} (DeploShare). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for high-speed, private, code-only file and text sharing.
          </p>
        </div>
      </div>
    </footer>
  );
}

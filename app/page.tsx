'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeploShareLogo } from '@/components/ui/DeploShareLogo';
import { BRAND_CONFIG } from '@/lib/config/brand';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import {
  KeyRound,
  UploadCloud,
  Lock,
  Flame,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Shield,
  EyeOff,
  Zap,
  XCircle,
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoCodeIndex, setDemoCodeIndex] = useState(0);

  const sampleCodes = ['583214', '914027', '381650', '742918'];

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoCodeIndex((prev) => (prev + 1) % sampleCodes.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [sampleCodes.length]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does code-only temporary file sharing work on DeploShare?',
      a: 'When you upload a file or write a text note on DeploShare (also searched as Deplo Share), our cryptographic engine generates a unique 6-digit numeric PIN (e.g. 583214). You simply share this 6-digit PIN with your recipient. They visit DeploShare, punch in the 6 digits on any phone or desktop, and immediately access the content without any public URL being indexed or leaked.',
    },
    {
      q: 'Why is 6-digit code sharing safer than traditional link file sharing?',
      a: 'Traditional file share URLs often get saved in browser histories, indexed by web crawlers, accidentally pasted in public chats, or logged in proxy servers. DeploShare eliminates URLs completely—access is strictly bound to a temporary 6-digit numeric code protected by brute-force rate limiters and automatic lockout mechanisms.',
    },
    {
      q: 'What is Burn-After-Download mode?',
      a: 'When Burn-After-Download is active, the file is instantly and permanently destroyed from encrypted private storage the moment the recipient completes their first download. Even if someone obtains the 6-digit code later, the share ceases to exist.',
    },
    {
      q: 'Can an attacker brute force guess my 6-digit DeploShare code?',
      a: 'No. DeploShare deploys bank-grade brute force rate limiting. If anyone enters 5 incorrect codes consecutively, the system locks out their IP for 15 minutes and introduces progressive delay countermeasures. Furthermore, shares auto-expire rapidly.',
    },
    {
      q: 'Can I add an additional password to my temporary file share?',
      a: 'Yes! DeploShare allows you to attach an optional bcrypt-hashed password to any file or text share. Even with the valid 6-digit code, content remains securely locked until the recipient enters the exact password.',
    },
    {
      q: 'Is DeploShare free to use for temporary file sharing?',
      a: 'Yes, DeploShare is 100% free for instant anonymous and registered sharing up to 100MB per file with expiration up to 7 days. For power users needing up to 2GB or 10GB per file and 30–90 days retention, affordable Pro and Business tiers are available.',
    },
  ];

  const currentDemoCode = sampleCodes[demoCodeIndex];

  return (
    <div className="relative overflow-hidden space-y-24 sm:space-y-32 pb-28">
      {/* Subtle Ambient Radial Glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-500/10 blur-[140px] pointer-events-none -z-10 rounded-full animate-mesh-glow" />
      <div className="absolute top-[600px] right-[-150px] w-[500px] h-[500px] bg-indigo-500/5 blur-[160px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-[1400px] left-[-150px] w-[500px] h-[500px] bg-cyan-500/5 blur-[160px] pointer-events-none -z-10 rounded-full" />

      {/* =====================================================================
          1. HERO SECTION
      ===================================================================== */}
      <section className="pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>The Modern Standard for Temporary File & Text Sharing</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Temporary File Share With{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
              Just a 6-Digit Code
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Welcome to <strong className="text-slate-900 font-bold">DeploShare</strong>. Upload your files or confidential text notes, generate an instant <span className="text-blue-600 font-bold font-mono">6-digit PIN</span>, and share with zero permanent URL leakage. Ephemeral, encrypted, and burnable on first download.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/share" className="w-full sm:w-auto">
            <Button
              variant="glow"
              size="lg"
              shakeOnHover={true}
              shimmer={true}
              className="w-full sm:w-auto px-9 text-base"
              leftIcon={<UploadCloud className="w-5 h-5" />}
            >
              Upload & Share File
            </Button>
          </Link>
          <Link href="/access" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              shakeOnHover={true}
              className="w-full sm:w-auto px-9 text-base border-slate-200 hover:border-blue-400"
              leftIcon={<KeyRound className="w-5 h-5 text-blue-600" />}
            >
              Enter 6-Digit Code
            </Button>
          </Link>
        </div>

        {/* INTERACTIVE 6-DIGIT CODE LIVE DEMO */}
        <div className="pt-8 max-w-3xl mx-auto">
          <Card glow floating className="p-6 sm:p-8 bg-white border-slate-200 text-left space-y-6 shadow-xl shadow-blue-500/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-500 ml-2 font-mono">
                  deploshare-secure-gateway.sh
                </span>
              </div>
              <Badge variant="info" size="sm">
                No URLs • Pure 6-Digit PIN
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-blue-300 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mx-auto border border-blue-100">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Drop File or Text
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select confidential file or paste sensitive notes
                </p>
              </div>

              {/* Animated Connection Arrow */}
              <div className="hidden md:flex justify-center text-blue-600">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>

              {/* Step 2 (Dynamic 6-digit Code Box) */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-center gap-1 font-mono text-xl sm:text-2xl font-black text-blue-600 tracking-widest transition-all duration-300">
                  {currentDemoCode.split('').map((char, i) => (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 rounded-lg bg-white border border-blue-200 text-blue-700 shadow-2xs"
                    >
                      {char}
                    </span>
                  ))}
                </div>
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  2. Share 6-Digit Code
                </h4>
                <p className="text-[11px] text-slate-500">
                  Recipient types PIN to decrypt & download
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Instant 60-Second Signed Download URLs
              </span>
              <span className="font-mono text-blue-600 font-semibold">deploshare.com/access</span>
            </div>
          </Card>
        </div>
      </section>

      {/* =====================================================================
          2. HOW DEPLOSHARE WORKS (ULTRA-PREMIUM CARDS)
      ===================================================================== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="purple" size="md">
            Effortless Flow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How DeploShare Temporary File Sharing Works
          </h2>
          <p className="text-sm text-slate-500">
            Share anything in under 5 seconds with zero account required for instant transfers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* STEP 1 CARD */}
          <Card
            hoverEffect
            className="p-7 space-y-6 flex flex-col justify-between group border-slate-200/90 hover:border-blue-400 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-10px_rgba(37,99,235,0.14)]"
          >
            <div className="space-y-4">
              {/* Header: Step Badge + 3D Icon */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  STEP 01
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Upload File or Write Text
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                  Drag and drop documents, media, or paste sensitive code snippets. Select custom auto-expiry from 10 minutes to 30 days.
                </p>
              </div>
            </div>

            {/* Interactive Micro Illustration */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                  Dropzone Ready
                </span>
                <span className="text-blue-600 font-mono">AES-256 E2EE</span>
              </div>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600 shadow-2xs">
                  .zip bundle
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600 shadow-2xs">
                  .pdf document
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600 shadow-2xs">
                  .env secret
                </span>
              </div>
            </div>
          </Card>

          {/* STEP 2 CARD */}
          <Card
            hoverEffect
            glow
            className="p-7 space-y-6 flex flex-col justify-between group border-blue-300 ring-2 ring-blue-500/20 shadow-[0_10px_35px_-5px_rgba(37,99,235,0.12)] hover:shadow-[0_25px_50px_-10px_rgba(37,99,235,0.2)]"
          >
            <div className="space-y-4">
              {/* Header: Step Badge + 3D Icon */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  STEP 02
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                  <KeyRound className="w-6 h-6" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Get Your Secure 6-Digit Code
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                  DeploShare generates an unguessable numeric PIN like <strong className="text-blue-600 font-mono font-bold">583214</strong>. No long messy links to paste or leak.
                </p>
              </div>
            </div>

            {/* Interactive Micro Illustration */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900">
                <span>Cryptographic PIN</span>
                <span className="text-emerald-700">Zero URLs</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 font-mono text-base font-black text-blue-700">
                {['5', '8', '3', '2', '1', '4'].map((d, i) => (
                  <span
                    key={i}
                    className="w-7 h-8 flex items-center justify-center rounded-lg bg-white border border-blue-300 shadow-2xs"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* STEP 3 CARD */}
          <Card
            hoverEffect
            className="p-7 space-y-6 flex flex-col justify-between group border-slate-200/90 hover:border-emerald-400 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_-10px_rgba(16,185,129,0.14)]"
          >
            <div className="space-y-4">
              {/* Header: Step Badge + 3D Icon */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  STEP 03
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Recipient Enters Code & Downloads
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                  The recipient visits DeploShare, punches in 6 digits, inspects safe in-browser previews, and downloads. Auto-destroys on burn mode.
                </p>
              </div>
            </div>

            {/* Interactive Micro Illustration */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Decryption
                </span>
                <span className="text-amber-700 font-mono">Burn On Download</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                <span>Signed Stream Link</span>
                <span className="font-bold text-emerald-700">Self-Purging</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* =====================================================================
          3. COMPARISON MATRIX
      ===================================================================== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="info" size="md">
            Why DeploShare
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Code-Only Sharing vs Traditional Link Sharing
          </h2>
          <p className="text-sm text-slate-500">
            See why thousands of developers, researchers, and privacy-conscious users switch to DeploShare.
          </p>
        </div>

        {/* Comparison Table Card */}
        <Card hoverEffect className="overflow-hidden p-0 border-slate-200/90 shadow-xl shadow-slate-900/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <th className="px-6 py-4">Security Metric</th>
                  <th className="px-6 py-4 text-blue-600 bg-blue-50/50">
                    DeploShare (6-Digit Code)
                  </th>
                  <th className="px-6 py-4 text-slate-400">Traditional URL Sharing Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                <tr className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">Public URL Exposure</td>
                  <td className="px-6 py-4 text-emerald-700 font-medium flex items-center gap-2 bg-blue-50/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    Zero public URLs. Content behind 6-digit gateway.
                  </td>
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-red-500" />
                    Public URLs saved in history, logs, and indexing bots.
                  </td>
                </tr>

                <tr className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">Sharing Mechanism</td>
                  <td className="px-6 py-4 text-emerald-700 font-medium flex items-center gap-2 bg-blue-50/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    Simple 6-digit numeric PIN (e.g. 583214). Easy to text or speak.
                  </td>
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-red-500" />
                    Cumbersome 80-character tokenized links.
                  </td>
                </tr>

                <tr className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">Brute-Force Protection</td>
                  <td className="px-6 py-4 text-emerald-700 font-medium flex items-center gap-2 bg-blue-50/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    Strict IP rate limiting + 15m lockout after 5 fails.
                  </td>
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-red-500" />
                    Rarely enforced or easy to crawl.
                  </td>
                </tr>

                <tr className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">Burn on First Download</td>
                  <td className="px-6 py-4 text-emerald-700 font-medium flex items-center gap-2 bg-blue-50/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    Automatic atomic file purge upon completion.
                  </td>
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-red-500" />
                    Files linger on servers until manual expiration.
                  </td>
                </tr>

                <tr className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">Safe In-Browser Previews</td>
                  <td className="px-6 py-4 text-emerald-700 font-medium flex items-center gap-2 bg-blue-50/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    Instant image, PDF, audio/video, and syntax-highlighted code.
                  </td>
                  <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-red-500" />
                    Forces full download of untrusted payloads.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* =====================================================================
          4. CORE SECURITY & EPHEMERAL FEATURES (ULTRA-PREMIUM CARDS)
      ===================================================================== */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="info" size="md">
            Engineered For Absolute Privacy
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Security That Protects What Matters
          </h2>
          <p className="text-sm text-slate-500">
            Every layer in DeploShare is built around strict data minimization and ephemeral storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card hoverEffect className="p-7 space-y-4 group hover:border-blue-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Code-Only Access Gateway
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              No public URLs to accidentally leak in browsing histories or web crawlers. Shares are identified solely by an unguessable 6-digit numeric PIN.
            </p>
          </Card>

          <Card hoverEffect className="p-7 space-y-4 group hover:border-amber-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Burn on First Download
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Enable burn mode to permanently revoke access and destroy the encrypted file the instant your recipient completes their download.
            </p>
          </Card>

          <Card hoverEffect className="p-7 space-y-4 group hover:border-indigo-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Bcrypt Password Protection
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Add a second layer of defense with industry-standard bcrypt hashing. Even with the 6-digit code, content cannot be viewed without the secret password.
            </p>
          </Card>

          <Card hoverEffect className="p-7 space-y-4 group hover:border-red-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors">
              Brute-Force Rate Limiting
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Automated guessing attacks are neutralized with strict rate limits, progressive delays, and temporary lockouts after 5 failed attempts.
            </p>
          </Card>

          <Card hoverEffect className="p-7 space-y-4 group hover:border-emerald-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Granular Expiration Controls
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Choose expiration from 10 minutes to 30 days. Backend automated cleanup sweeps and purges expired items automatically.
            </p>
          </Card>

          <Card hoverEffect className="p-7 space-y-4 group hover:border-purple-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <EyeOff className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Zero Tracking & No Adware
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We never track unnecessary personal information or sell user telemetry. All storage is private, access-controlled, and ephemeral.
            </p>
          </Card>
        </div>
      </section>

      {/* =====================================================================
          5. REAL-TIME CUSTOMER REVIEWS SECTION
      ===================================================================== */}
      <ReviewsSection />

      {/* =====================================================================
          6. PRICING SECTION
      ===================================================================== */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="purple" size="md">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple Plans for Every Need
          </h2>
          <p className="text-sm text-slate-500">
            Start sharing for free, or upgrade for massive file limits and extended retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <Card hoverEffect className="p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {BRAND_CONFIG.plans.FREE.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ideal for quick, spontaneous ephemeral file & text shares.
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">
                  {BRAND_CONFIG.plans.FREE.price}
                </span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                {BRAND_CONFIG.plans.FREE.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/share" className="w-full">
              <Button variant="secondary" shakeOnHover={true} className="w-full">
                Get Started Free
              </Button>
            </Link>
          </Card>

          {/* Pro Plan (Highlighted) */}
          <Card
            glow
            floating
            hoverEffect
            className="p-8 space-y-6 flex flex-col justify-between border-blue-300 ring-2 ring-blue-500/20 relative shadow-xl shadow-blue-500/10"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="info" size="sm">
                Most Popular
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {BRAND_CONFIG.plans.PRO.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  For professionals sending large confidential files securely.
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">
                  {BRAND_CONFIG.plans.PRO.price}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                {BRAND_CONFIG.plans.PRO.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="w-full">
              <Button variant="glow" shakeOnHover={true} shimmer={true} className="w-full">
                Upgrade to Pro
              </Button>
            </Link>
          </Card>

          {/* Business Plan */}
          <Card hoverEffect className="p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {BRAND_CONFIG.plans.BUSINESS.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  For engineering teams demanding custom governance & SLA.
                </p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">
                  {BRAND_CONFIG.plans.BUSINESS.price}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                {BRAND_CONFIG.plans.BUSINESS.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="w-full">
              <Button variant="secondary" shakeOnHover={true} className="w-full">
                Contact Sales
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* =====================================================================
          6. FAQ ACCORDION SECTION
      ===================================================================== */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="info" size="md">
            Common Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500">
            Learn more about DeploShare, 6-digit code file transfers, and security policies.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-300 shadow-2xs"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          7. BOTTOM CALL TO ACTION
      ===================================================================== */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Card glow className="p-8 sm:p-16 text-center space-y-6 bg-gradient-to-b from-blue-50/80 via-white to-blue-50/50 border-blue-200 shadow-xl shadow-blue-500/10">
          <div className="flex justify-center mb-2">
            <DeploShareLogo size="lg" showText={false} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Ready to Share With a Simple 6-Digit Code?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Experience ephemeral temporary file and text sharing without complicated link management. Fast, clean, encrypted, and private.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/share" className="w-full sm:w-auto">
              <Button
                variant="glow"
                size="lg"
                shakeOnHover={true}
                shimmer={true}
                className="w-full sm:w-auto px-9 text-base"
                leftIcon={<UploadCloud className="w-5 h-5" />}
              >
                Create a Share Now
              </Button>
            </Link>
            <Link href="/access" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                shakeOnHover={true}
                className="w-full sm:w-auto px-9 text-base border-slate-200"
                leftIcon={<KeyRound className="w-5 h-5 text-blue-600" />}
              >
                Access With Code
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

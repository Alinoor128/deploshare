'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { DeploShareLogo } from '@/components/ui/DeploShareLogo';
import { Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { signOutAction, getCurrentUserAction } from '@/lib/actions/auth-actions';
import {
  KeyRound,
  UploadCloud,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user, profile: userProfile } = await getCurrentUserAction();
        setCurrentUser(user);
        setProfile(userProfile);
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [pathname]);

  const handleSignOut = async () => {
    await signOutAction();
    setCurrentUser(null);
    setProfile(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-300 shadow-2xs">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <DeploShareLogo size="sm" showText={true} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/share"
            className={`text-sm font-medium transition-all duration-200 hover:text-blue-600 flex items-center gap-1.5 ${
              pathname === '/share'
                ? 'text-blue-600 font-semibold'
                : 'text-slate-600 hover:scale-105'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            Create Share
          </Link>
          <Link
            href="/access"
            className={`text-sm font-medium transition-all duration-200 hover:text-blue-600 flex items-center gap-1.5 ${
              pathname === '/access'
                ? 'text-blue-600 font-semibold'
                : 'text-slate-600 hover:scale-105'
            }`}
          >
            <KeyRound className="w-4 h-4 text-indigo-600" />
            Enter Code
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-all duration-200 hover:scale-105"
          >
            Security & Privacy
          </Link>
          <Link
            href="/#reviews"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-all duration-200 hover:scale-105"
          >
            Reviews
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-all duration-200 hover:scale-105"
          >
            Pricing
          </Link>
          <Link
            href="/api-docs"
            className={`text-sm font-medium transition-all duration-200 hover:text-blue-600 hover:scale-105 ${
              pathname === '/api-docs' ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
          >
            API
          </Link>
        </nav>

        {/* Right CTA / Auth status */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-slate-200/60 rounded-xl animate-pulse" />
          ) : currentUser ? (
            <div className="flex items-center gap-2.5">
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />}
                >
                  Vault
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="icon" title="Settings">
                  <Settings className="w-4 h-4 text-slate-500 hover:text-slate-900" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-slate-500 hover:text-red-600" />
              </Button>
              <SoundToggle />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SoundToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/share">
                <Button
                  variant="glow"
                  size="sm"
                  shakeOnHover={true}
                  leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                >
                  Share Now
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-1">
          <SoundToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/share"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 py-2 text-base font-medium text-slate-800 hover:text-blue-600"
          >
            <UploadCloud className="w-5 h-5 text-blue-600" />
            Create Share
          </Link>
          <Link
            href="/access"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 py-2 text-base font-medium text-slate-800 hover:text-blue-600"
          >
            <KeyRound className="w-5 h-5 text-indigo-600" />
            Enter 6-Digit Code
          </Link>
          <Link
            href="/#features"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 py-2 text-base font-medium text-slate-600 hover:text-slate-900"
          >
            Security & Privacy
          </Link>
          <Link
            href="/#pricing"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 py-2 text-base font-medium text-slate-600 hover:text-slate-900"
          >
            Pricing
          </Link>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 text-base font-medium text-slate-800"
                >
                  <LayoutDashboard className="w-5 h-5 text-blue-600" />
                  Dashboard
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 py-2 text-base font-medium text-amber-600"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 text-base font-medium text-slate-800"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-2 py-2 text-base font-medium text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

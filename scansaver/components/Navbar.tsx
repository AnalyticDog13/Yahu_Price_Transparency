"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">ScanSaver</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#how-it-works" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            How It Works
          </Link>
          <Link href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Features
          </Link>
          <Link href="/" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

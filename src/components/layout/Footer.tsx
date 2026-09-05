import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE, DISCLAIMER_TEXT, NAV_ITEMS } from '../../utils/constants';

export const Footer: React.FC = () => {
  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-purple-900/60 bg-[#090412] text-purple-200/70 py-12 relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-r from-purple-600/10 via-fuchsia-600/10 to-pink-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 text-pink-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{BRAND_NAME}</span>
            </div>

            <p className="text-sm text-pink-300 font-medium">{BRAND_TAGLINE}</p>

            <p className="text-sm text-purple-200/70 max-w-md leading-relaxed">
              Empowering individuals, journalists, and researchers to dissect synthetic media, inspect empirical signals, and assess evidentiary context responsibly.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-950 border border-purple-800 text-xs text-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Forensiq AI v1.0 Production Ready</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-100 mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className="hover:text-pink-400 transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Philosophy & Roadmap */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-100 mb-4">
              Platform Roadmap
            </h3>
            <ul className="space-y-2 text-xs text-purple-300/80">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span className="text-purple-100 font-medium">Stage 1:</span> Complete (UI Foundation)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span className="text-purple-100 font-medium">Stage 2:</span> Complete (Media Ingestion)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span className="text-purple-100 font-medium">Stage 3:</span> Complete (Image Analysis)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span className="text-purple-100 font-medium">Stage 4-5:</span> Complete (Audio & Video)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span className="text-purple-100 font-medium">Stage 6-8:</span> Complete (GenAI & Dashboard)
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-900/80 text-center sm:text-left mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-purple-200/90 flex items-center gap-2">
            <span className="shrink-0 w-2 h-2 rounded-full bg-pink-400" />
            <span>
              <strong className="text-purple-100">Ethical AI Disclaimer:</strong> {DISCLAIMER_TEXT}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/70 shrink-0">
            Probabilistic & Evidence-Based
          </span>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-purple-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-purple-400/80">
          <p>© {new Date().getFullYear()} Forensiq AI. Built for responsible synthetic media verification.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-pink-300">Privacy First</span>
            <span className="hover:text-pink-300">No False Certainty</span>
            <span className="hover:text-pink-300">Open Evidence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

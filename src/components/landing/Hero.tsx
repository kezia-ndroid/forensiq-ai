import React from 'react';
import { ArrowRight, ShieldCheck, ChevronDown, Eye, Layers } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_DESCRIPTION } from '../../utils/constants';
import { Button } from '../ui/Button';

export const Hero: React.FC = () => {
  const scrollTo = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden flex flex-col items-center justify-center text-center"
    >
      {/* Background Gradients & Grid Pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-purple-600/20 via-fuchsia-600/15 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-pink-500/10 blur-3xl rounded-full" />
        
        {/* Subtle grid mesh */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-pink-300 text-xs sm:text-sm font-medium mb-6 shadow-sm shadow-purple-950/60 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          <span>GenAI Media Forensics & Context Verification</span>
          <span className="text-purple-600">|</span>
          <span className="text-purple-300/80 font-normal">Multi-Modal Forensic Engine Active</span>
        </div>

        {/* Brand Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-purple-100 to-pink-200">
            {BRAND_NAME}
          </span>
        </h1>

        {/* Tagline */}
        <div className="inline-block mb-6">
          <p className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-400">
            {BRAND_TAGLINE}
          </p>
        </div>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg md:text-xl text-purple-200/90 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          {BRAND_DESCRIPTION}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-14">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto shadow-xl shadow-purple-900/40"
            onClick={() => scrollTo('#analyze')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Analyze Media
          </Button>
          <Button
            variant="glass"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => scrollTo('#how-it-works')}
            rightIcon={<ChevronDown className="w-5 h-5" />}
          >
            How It Works
          </Button>
        </div>

        {/* Trust & Architecture Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-purple-900/50 text-left">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/60">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Multi-Modal Signals</h4>
              <p className="text-[11px] text-purple-300/70">Inspect images, audio tracks, and video frames</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/60">
            <div className="p-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Probabilistic Evidence</h4>
              <p className="text-[11px] text-purple-300/70">Honest confidence scores without false certainty</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/60">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Context Grounding</h4>
              <p className="text-[11px] text-purple-300/70">Trace publication history and origins</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import {
  FileSearch,
  Lightbulb,
  Layers,
  Gauge,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../ui/Card';

export const WhyTruthLens: React.FC = () => {
  const pillars = [
    {
      title: 'Evidence-Based Assessment',
      icon: FileSearch,
      tag: 'Empirical Signals',
      description:
        'We never make unsupported claims or declare absolute 100% certainty. Media is analyzed probabilistically using empirical frequency patterns, compression artifacts, and digital footprint forensics.',
    },
    {
      title: 'Transparent Explanations',
      icon: Lightbulb,
      tag: 'No Black Boxes',
      description:
        'Instead of an arbitrary fake percentage, users receive clear explanations detailing exactly what visual or acoustic anomalies triggered the score and why.',
    },
    {
      title: 'Context Verification',
      icon: Layers,
      tag: 'Beyond Pixels',
      description:
        'Genuine photos can be re-captioned maliciously, and authentic audio can be placed out of timeline. We evaluate contextual provenance alongside synthetic artifact checks.',
    },
    {
      title: 'Confidence & Uncertainty',
      icon: Gauge,
      tag: 'Calibrated Bounds',
      description:
        'Every score accounts for compression degradation, platform re-encoding, and model ambiguity—giving you realistic, calibrated margins rather than deceptive certainty.',
    },
    {
      title: 'Designed for Real-World Scrutiny',
      icon: Users,
      tag: 'For Everyone',
      description:
        'Built to serve everyday citizens looking to avoid scams, journalists verifying breaking reports under deadlines, and open-source intelligence researchers.',
    },
    {
      title: 'Ethical & Privacy-Conscious',
      icon: ShieldAlert,
      tag: 'Responsible AI',
      description:
        'Engineered with clear disclaimers, zero permanent data retention for unauthenticated queries, and strict adherence to responsible media forensics standards.',
    },
  ];

  return (
    <section id="why-forensiq" className="py-20 relative bg-[#0e071a]/50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-pink-400 bg-purple-950/80 px-3.5 py-1.5 rounded-full border border-pink-500/30">
            Platform Purpose
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why Forensiq AI?
          </h2>
          <p className="mt-3 text-purple-200/80 text-base sm:text-lg">
            In an era of hyper-realistic generative tools, binary "Real or Fake" labels are unreliable. Forensiq provides calibrated, evidence-driven clarity.
          </p>
        </div>

        {/* Highlight Banner: Explicit anti-100% certainty callout */}
        <div className="mb-12 p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#180b2f] to-[#140828] border border-purple-700/50 shadow-lg shadow-purple-950/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Our Stance on Detection Certainty
                </h4>
                <p className="text-xs text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
                  No forensic tool can honestly promise 100% detection accuracy against rapidly evolving generative models. Forensiq treats media forensics as an <strong>evidence collection discipline</strong>, equipping you to evaluate the probability, inspect anomalies, and verify context.
                </p>
              </div>
            </div>
            <div className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-950/90 border border-purple-800 text-xs font-mono text-pink-300">
              Honest • Probabilistic
            </div>
          </div>
        </div>

        {/* 6 Value Prop Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                interactive
                className="p-6 flex flex-col justify-between group hover:border-pink-500/40 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-purple-950/80 text-pink-400 border border-purple-800/80 group-hover:bg-pink-500/10 group-hover:border-pink-500/40 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800/60">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-purple-200/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-purple-900/60 flex items-center gap-1.5 text-xs text-pink-400/90 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Forensiq Standard</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

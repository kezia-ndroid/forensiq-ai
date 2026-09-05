import React from 'react';
import { ScanEye, BrainCircuit, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Detect',
      tagline: 'Multi-Modal Signal Inspection',
      description:
        'Identify potential signs of AI generation or manipulation across imagery, synthetic speech acoustics, and video motion frames.',
      icon: ScanEye,
      accentColor: 'from-pink-500 to-purple-600',
      badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      highlights: ['Diffusion edge artifacts', 'Acoustic voice synthesis', 'Facial reenactment anomalies'],
    },
    {
      stepNumber: '02',
      title: 'Understand',
      tagline: 'Transparent Evidence & Uncertainty',
      description:
        'Explain the evidence and uncertainty in simple language, providing calibrated confidence bounds rather than opaque binary verdicts.',
      icon: BrainCircuit,
      accentColor: 'from-fuchsia-500 to-pink-600',
      badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
      highlights: ['Plain-language reasoning', 'Visual forensic heatmaps', 'Explicit uncertainty margins'],
    },
    {
      stepNumber: '03',
      title: 'Verify',
      tagline: 'Source & Context Corroboration',
      description:
        'Check source and context before trusting or sharing, assessing original publication timelines, metadata integrity, and potential narrative misattribution.',
      icon: ShieldCheck,
      accentColor: 'from-purple-600 to-pink-600',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      highlights: ['Reverse context timeline', 'Metadata tampering checks', 'Safe sharing checklist'],
    },
  ];

  return (
    <section id="how-it-works" className="py-20 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-pink-400 bg-purple-950/80 px-3.5 py-1.5 rounded-full border border-pink-500/30">
            Core Philosophy
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Forensiq Works
          </h2>
          <p className="mt-3 text-purple-200/80 text-base sm:text-lg">
            A three-pillar methodology engineered to replace blind trust with methodical, evidence-grounded verification.
          </p>
        </div>

        {/* 3 Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <Card
                key={step.title}
                interactive
                className="p-8 relative overflow-hidden flex flex-col justify-between group"
              >
                {/* Background gradient hint */}
                <div
                  className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${step.accentColor} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity pointer-events-none`}
                />

                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3.5 rounded-2xl border ${step.badgeBg} shadow-md transition-transform group-hover:scale-105 duration-200`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <span className="text-3xl font-black text-purple-900/70 group-hover:text-purple-800 transition-colors tracking-tight">
                      {step.stepNumber}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-300 transition-colors">
                    {step.title}
                  </h3>
                  <div className="text-xs font-semibold uppercase tracking-wider text-purple-300/70 mb-3">
                    {step.tagline}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-purple-100/80 leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Feature highlights list */}
                <div className="pt-4 border-t border-purple-900/60 mt-auto">
                  <ul className="space-y-2">
                    {step.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-purple-200/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

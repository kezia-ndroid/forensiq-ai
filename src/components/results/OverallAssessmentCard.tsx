import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, Gauge, Info } from 'lucide-react';
import { UnifiedAnalysisReport } from '../../types/unifiedAnalysis';

interface OverallAssessmentCardProps {
  report: UnifiedAnalysisReport;
}

export const OverallAssessmentCard: React.FC<OverallAssessmentCardProps> = ({ report }) => {
  const { riskScore, riskLevel, riskLabel, measurementConfidence, confidenceRationale, evidenceSummary } = report;

  // Visual styling mapped to conservative risk levels with pink/purple accents
  const levelConfig = {
    low: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/30',
      progressBg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-900/60 text-emerald-300 border-emerald-600/50',
      icon: CheckCircle2,
    },
    moderate: {
      color: 'text-amber-400',
      bg: 'bg-amber-950/30',
      border: 'border-amber-500/30',
      progressBg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500',
      badgeBg: 'bg-amber-900/60 text-amber-300 border-amber-600/50',
      icon: AlertTriangle,
    },
    elevated: {
      color: 'text-pink-400',
      bg: 'bg-pink-950/30',
      border: 'border-pink-500/40',
      progressBg: 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500',
      badgeBg: 'bg-pink-900/60 text-pink-300 border-pink-600/50',
      icon: AlertTriangle,
    },
    inconclusive: {
      color: 'text-purple-300',
      bg: 'bg-purple-950/30',
      border: 'border-purple-800/50',
      progressBg: 'bg-purple-600',
      badgeBg: 'bg-purple-900/60 text-purple-200 border-purple-700',
      icon: HelpCircle,
    },
  }[riskLevel];

  const IconComponent = levelConfig.icon;

  const confidenceBadge = {
    high: { label: 'High Reliability', bg: 'bg-purple-950/80 text-pink-300 border-purple-700/60' },
    moderate: { label: 'Moderate Reliability', bg: 'bg-amber-950/60 text-amber-300 border-amber-700/50' },
    low: { label: 'Low Reliability', bg: 'bg-purple-950/60 text-purple-400 border-purple-800' },
  }[measurementConfidence];

  return (
    <div className={`rounded-3xl border ${levelConfig.border} ${levelConfig.bg} p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Overall Level & Explanation */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={`p-2.5 rounded-xl bg-[#0c0716]/80 border ${levelConfig.border} ${levelConfig.color}`}>
              <IconComponent className="w-6 h-6" />
            </span>
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-purple-300/80">
                Primary Assessment
              </span>
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${levelConfig.color}`}>
                {riskLabel}
              </h3>
            </div>
          </div>

          <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-2xl mt-2">
            {evidenceSummary}
          </p>

          {/* Reliability Pill with Explanatory Hint */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-purple-300/70">Measurement Reliability:</span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${confidenceBadge.bg}`}>
                {confidenceBadge.label}
              </span>
            </div>
            <span className="text-purple-600">•</span>
            <span className="text-purple-300/70 italic">
              {confidenceRationale}
            </span>
          </div>
        </div>

        {/* Right: Heuristic Indicator Gauge */}
        <div className="w-full lg:w-72 shrink-0 p-5 rounded-2xl bg-[#0e071c]/90 border border-purple-900/80 flex flex-col items-center justify-center text-center shadow-lg shadow-purple-950/50">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-pink-400" />
              Indicator Index
            </span>
            <span className="text-[10px] text-purple-400/80">Heuristic Score</span>
          </div>

          {/* Big Score Display */}
          <div className="flex items-baseline gap-1 my-2">
            <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${levelConfig.color}`}>
              {riskScore}
            </span>
            <span className="text-base text-purple-400 font-semibold">/ 100</span>
          </div>

          {/* Progress Bar Gauge */}
          <div className="w-full h-2.5 bg-[#090412] rounded-full overflow-hidden border border-purple-900/80 my-2">
            <div
              className={`h-full ${levelConfig.progressBg} transition-all duration-700 rounded-full`}
              style={{ width: `${riskScore}%` }}
            />
          </div>

          {/* Subtle Safeguard Clarification */}
          <div className="flex items-start gap-1.5 text-[11px] text-purple-300/70 mt-2 text-left">
            <Info className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
            <span>
              Represents cumulative observed anomalies, <strong>not</strong> the probability of AI generation.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

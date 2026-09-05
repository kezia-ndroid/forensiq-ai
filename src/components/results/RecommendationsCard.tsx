import React from 'react';
import { ShieldCheck, AlertOctagon, RotateCcw, Share2, Check } from 'lucide-react';
import { UnifiedAnalysisReport } from '../../types/unifiedAnalysis';
import { Button } from '../ui/Button';

interface RecommendationsCardProps {
  report: UnifiedAnalysisReport;
  onReset: () => void;
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({ report, onReset }) => {
  const { recommendations, disclaimer } = report;

  const handleCopySummary = () => {
    const summaryText = `[TruthLens AI Analysis Summary]
File: ${report.fileName} (${report.mediaType.toUpperCase()})
Assessment: ${report.riskLabel} (Score: ${report.riskScore}/100)
Reliability: ${report.measurementConfidence.toUpperCase()}
Evidence: ${report.evidenceSummary}
Disclaimer: ${report.disclaimer}`;

    navigator.clipboard.writeText(summaryText);
    alert('Analysis summary copied to clipboard!');
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Actionable Recommendations
            </h3>
            <p className="text-xs text-slate-400">
              Responsible sharing guidelines and verification best practices.
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3"
          >
            <span className="w-5 h-5 rounded-full bg-teal-950/80 text-teal-400 border border-teal-600/50 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
              <Check className="w-3 h-3" />
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {rec}
            </p>
          </div>
        ))}
      </div>

      {/* Mandatory TruthLens Ethical AI Disclaimer Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800/90 mb-6 flex items-start gap-3.5 text-xs text-slate-400">
        <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-200">Ethical AI Transparency Disclaimer: </strong>
          {disclaimer}
        </div>
      </div>

      {/* Action Buttons: Analyze Another / Copy Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handleCopySummary}
          leftIcon={<Share2 className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Copy Verification Summary
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="w-full sm:w-auto shadow-lg shadow-cyan-500/20"
        >
          Analyze Another Media
        </Button>
      </div>
    </div>
  );
};

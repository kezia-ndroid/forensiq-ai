import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { UnifiedForensicIndicator } from '../../types/unifiedAnalysis';

interface EvidenceListProps {
  indicators: UnifiedForensicIndicator[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ indicators }) => {
  const [filter, setFilter] = useState<'all' | 'anomalies' | 'info'>('all');

  const filteredIndicators = indicators.filter((item) => {
    if (filter === 'anomalies') return item.severity === 'caution' || item.severity === 'warning';
    if (filter === 'info') return item.severity === 'info';
    return true;
  });

  const getSeverityBadge = (severity: UnifiedForensicIndicator['severity']) => {
    switch (severity) {
      case 'warning':
        return {
          label: 'Elevated Indicator',
          badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
          icon: AlertCircle,
          iconClass: 'text-rose-400',
        };
      case 'caution':
        return {
          label: 'Moderate Caution',
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
          icon: AlertTriangle,
          iconClass: 'text-amber-400',
        };
      default:
        return {
          label: 'Baseline / Factual',
          badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50',
          icon: CheckCircle,
          iconClass: 'text-cyan-400',
        };
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Signal Inspection
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight mt-1">
            Detected Forensic Indicators ({indicators.length})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Measurable characteristics evaluated against physical camera and acoustic baselines.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({indicators.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('anomalies')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'anomalies'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Anomalies ({indicators.filter((i) => i.severity !== 'info').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('info')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'info'
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Factual ({indicators.filter((i) => i.severity === 'info').length})
          </button>
        </div>
      </div>

      {/* Indicator Cards Grid */}
      {filteredIndicators.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No indicators matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIndicators.map((item) => {
            const badge = getSeverityBadge(item.severity);
            const Icon = badge.icon;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5 ${badge.iconClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-white">
                          {item.title}
                        </h4>
                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-400 font-mono mt-1">
                        Measured Value: <span className="text-slate-200">{item.observedValue}</span>
                      </p>
                    </div>
                  </div>

                  {item.weightContribution !== 0 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      Weight: {item.weightContribution > 0 ? `+${item.weightContribution}` : item.weightContribution} pts
                    </span>
                  )}
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-300 leading-relaxed pl-10 sm:pl-11">
                  {item.description}
                </p>

                {/* Why it matters & Limitations */}
                <div className="ml-10 sm:ml-11 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-300">Technical Context / Limitations: </strong>
                    {item.limitationNote}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

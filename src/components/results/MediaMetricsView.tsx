import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { UnifiedAnalysisReport } from '../../types/unifiedAnalysis';

interface MediaMetricsViewProps {
  report: UnifiedAnalysisReport;
}

export const MediaMetricsView: React.FC<MediaMetricsViewProps> = ({ report }) => {
  const [showRawDetails, setShowRawDetails] = useState(false);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Factual Forensic Measurements
            </h3>
            <p className="text-xs text-slate-400">
              Extracted client-side from file containers, headers, and media buffers.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRawDetails(!showRawDetails)}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors"
        >
          <span>{showRawDetails ? 'Hide Raw Details' : 'View Full Technical Raw Details'}</span>
          {showRawDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {report.summaryMetrics.map((metric, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              {metric.label}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-100 font-mono truncate" title={metric.value}>
              {metric.value}
            </span>
            {metric.hint && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                {metric.hint}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Expandable Technical Raw Data Details */}
      {showRawDetails && (
        <div className="mt-6 pt-5 border-t border-slate-800/80 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Raw Forensic Telemetry (JSON)
            </h4>
          </div>
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72">
            <pre>
              {JSON.stringify(
                {
                  id: report.id,
                  mediaType: report.mediaType,
                  fileName: report.fileName,
                  fileSizeBytes: report.fileSizeBytes,
                  riskScore: report.riskScore,
                  riskLevel: report.riskLevel,
                  measurementConfidence: report.measurementConfidence,
                  imageMetrics: report.imageResult?.metrics,
                  audioMetrics: report.audioResult?.metrics,
                  videoMetrics: report.videoResult?.metrics,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

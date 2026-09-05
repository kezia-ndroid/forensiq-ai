import React, { useState } from 'react';
import {
  RotateCcw,
  Image as ImageIcon,
  Headphones,
  Video as VideoIcon,
  FileCheck,
} from 'lucide-react';
import { UnifiedAnalysisReport, GenAIExplanation } from '../../types/unifiedAnalysis';
import { SourceVerificationDetails } from '../../types/sourceVerification';
import { OverallAssessmentCard } from './OverallAssessmentCard';
import { EvidenceList } from './EvidenceList';
import { MediaMetricsView } from './MediaMetricsView';
import { GenAIExplanationCard } from './GenAIExplanationCard';
import { SourceVerificationCard } from './SourceVerificationCard';
import { RecommendationsCard } from './RecommendationsCard';
import { Button } from '../ui/Button';

interface ResultsDashboardProps {
  initialReport: UnifiedAnalysisReport;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ initialReport, onReset }) => {
  const [report, setReport] = useState<UnifiedAnalysisReport>(initialReport);
  const [activeTab, setActiveTab] = useState<'all' | 'detect' | 'understand' | 'verify'>('all');

  const handleExplanationUpdated = (newExplanation: GenAIExplanation) => {
    setReport((prev) => ({
      ...prev,
      explanation: newExplanation,
    }));
  };

  const handleSourceVerified = (details: SourceVerificationDetails) => {
    setReport((prev) => ({
      ...prev,
      sourceVerification: details,
    }));
  };

  const getMediaIcon = () => {
    switch (report.mediaType) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'audio':
        return <Headphones className="w-4 h-4 text-fuchsia-400" />;
      case 'video':
        return <VideoIcon className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <section id="results" className="py-12 md:py-16 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header & Reset Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-purple-900/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/30 shrink-0 shadow-sm shadow-purple-950/40">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-semibold text-pink-400">
                  Forensic Verification Report
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-200 font-mono">
                  ID: {report.id}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                {getMediaIcon()}
                <span className="truncate max-w-xs sm:max-w-md" title={report.fileName}>
                  {report.fileName}
                </span>
                <span className="text-xs font-normal text-purple-300/80 font-mono">
                  ({report.fileSizeFormatted})
                </span>
              </h2>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Analyze Another Media
          </Button>
        </div>

        {/* Media Preview Card if Preview URL exists */}
        {report.previewUrl && (
          <div className="mb-8 rounded-2xl bg-[#120826]/80 border border-purple-900/60 p-4 overflow-hidden shadow-xl shadow-purple-950/40">
            <div className="flex items-center justify-between mb-3 text-xs text-purple-300/80">
              <span className="font-semibold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                {getMediaIcon()}
                <span>Inspected Asset Preview</span>
              </span>
              <span className="font-mono text-[11px] text-purple-400/80">Local Zero-Cloud Ingestion</span>
            </div>

            <div className="flex items-center justify-center rounded-xl bg-black/40 border border-purple-900/60 overflow-hidden max-h-80">
              {report.mediaType === 'image' && (
                <img
                  src={report.previewUrl}
                  alt={report.fileName}
                  className="max-h-80 max-w-full object-contain rounded-lg"
                />
              )}
              {report.mediaType === 'audio' && (
                <div className="w-full p-4">
                  <audio
                    controls
                    src={report.previewUrl}
                    className="w-full h-10 accent-pink-500 rounded-lg"
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
              {report.mediaType === 'video' && (
                <video
                  controls
                  src={report.previewUrl}
                  className="max-h-80 max-w-full object-contain rounded-lg"
                >
                  Your browser does not support video playback.
                </video>
              )}
            </div>
          </div>
        )}

        {/* Workflow Phase Filter Tabs: DETECT → UNDERSTAND → VERIFY */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-[#100722] border border-purple-900/80 shadow-xl shadow-purple-950/40">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-purple-300/80 hover:text-white'
              }`}
            >
              Full Inspection
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('detect')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'detect'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-purple-300/80 hover:text-white'
              }`}
            >
              1. Detect (Indicators)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('understand')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'understand'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-purple-300/80 hover:text-white'
              }`}
            >
              2. Understand (GenAI)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('verify')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'verify'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-purple-300/80 hover:text-white'
              }`}
            >
              3. Verify (Provenance)
            </button>
          </div>
        </div>

        {/* Stacked Dashboard Sections */}
        <div className="space-y-8">
          {/* Always show Overall Assessment */}
          <OverallAssessmentCard report={report} />

          {/* DETECT Section */}
          {(activeTab === 'all' || activeTab === 'detect') && (
            <>
              <EvidenceList indicators={report.indicators} />
              <MediaMetricsView report={report} />
            </>
          )}

          {/* UNDERSTAND Section (GenAI) */}
          {(activeTab === 'all' || activeTab === 'understand') && (
            <GenAIExplanationCard
              explanation={report.explanation}
              report={report}
              onExplanationUpdated={handleExplanationUpdated}
            />
          )}

          {/* VERIFY Section (Source & Context Verification) */}
          {(activeTab === 'all' || activeTab === 'verify') && (
            <SourceVerificationCard
              sourceVerification={report.sourceVerification}
              onSourceVerified={handleSourceVerified}
            />
          )}

          {/* Recommendations & Ethical Disclaimer */}
          <RecommendationsCard report={report} onReset={onReset} />
        </div>
      </div>
    </section>
  );
};

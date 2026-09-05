import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  BrainCircuit,
  HelpCircle,
  ShieldCheck,
  Key,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GenAIExplanation, UnifiedAnalysisReport } from '../../types/unifiedAnalysis';
import { getActiveApiKey, saveUserApiKey, clearUserApiKey, generateForensicExplanation } from '../../services/aiExplanationService';
import { Button } from '../ui/Button';

interface GenAIExplanationCardProps {
  explanation: GenAIExplanation;
  report: UnifiedAnalysisReport;
  onExplanationUpdated?: (newExplanation: GenAIExplanation) => void;
}

export const GenAIExplanationCard: React.FC<GenAIExplanationCardProps> = ({
  explanation,
  report,
  onExplanationUpdated,
}) => {
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentKey = getActiveApiKey();

  const handleSaveKeyAndRerun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsUpdating(true);
    try {
      saveUserApiKey(apiKeyInput);
      const newExplanation = await generateForensicExplanation({
        mediaType: report.mediaType,
        fileName: report.fileName,
        riskScore: report.riskScore,
        riskLevel: report.riskLevel,
        riskLabel: report.riskLabel,
        measurementConfidence: report.measurementConfidence,
        confidenceRationale: report.confidenceRationale,
        indicators: report.indicators,
        summaryMetrics: report.summaryMetrics,
        sourceHostname: report.sourceVerification?.hostname,
      });
      onExplanationUpdated?.(newExplanation);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setShowKeyConfig(false);
      setApiKeyInput('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearKey = async () => {
    clearUserApiKey();
    setIsUpdating(true);
    try {
      const fallbackExplanation = await generateForensicExplanation({
        mediaType: report.mediaType,
        fileName: report.fileName,
        riskScore: report.riskScore,
        riskLevel: report.riskLevel,
        riskLabel: report.riskLabel,
        measurementConfidence: report.measurementConfidence,
        confidenceRationale: report.confidenceRationale,
        indicators: report.indicators,
        summaryMetrics: report.summaryMetrics,
        sourceHostname: report.sourceVerification?.hostname,
      });
      onExplanationUpdated?.(fallbackExplanation);
      setShowKeyConfig(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header with Provider Pill and API settings trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0 shadow-sm shadow-cyan-950/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Forensic Evidence Explanation
              </h3>
              <span
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                  explanation.isFallback
                    ? 'bg-slate-800 text-cyan-300 border-slate-700'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                }`}
              >
                {explanation.providerLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Plain-language synthesis strictly grounded in measured signal evidence.
            </p>
          </div>
        </div>

        {/* Configure Key Trigger */}
        <button
          type="button"
          onClick={() => setShowKeyConfig(!showKeyConfig)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <Key className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentKey ? 'Gemini API Connected' : 'Optional Gemini API Key'}</span>
          {showKeyConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Optional Gemini API Key Drawer */}
      {showKeyConfig && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                Live GenAI Model Configuration
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                TruthLens works offline by default. To synthesize explanations with Google Gemini, enter an API key. Your key stays strictly in your browser and is never uploaded.
              </p>
            </div>
            {currentKey && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearKey}
                disabled={isUpdating}
                className="text-rose-400 text-xs hover:bg-rose-950/30"
              >
                Disconnect Key
              </Button>
            )}
          </div>

          <form onSubmit={handleSaveKeyAndRerun} className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste Gemini API Key (AIzaSy...)"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!apiKeyInput.trim() || isUpdating}
              leftIcon={isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            >
              {isUpdating ? 'Synthesizing...' : 'Save & Explain'}
            </Button>
          </form>

          {savedSuccess && (
            <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Key activated. Natural language explanation refreshed!
            </p>
          )}
        </div>
      )}

      {/* The 5 Required GenAI Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: What was detected */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Bot className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">1. What Was Detected</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.whatWasDetected}
          </p>
        </div>

        {/* Section 2: Why the indicators matter */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center gap-2 text-teal-400 mb-2">
            <BrainCircuit className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">2. Why Indicators Matter</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.whyIndicatorsMatter}
          </p>
        </div>

        {/* Section 3: What indicators do NOT prove */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <HelpCircle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">3. What This Does NOT Prove</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.whatIndicatorsDoNotProve}
          </p>
        </div>

        {/* Section 4: Confidence & limitations */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">4. Confidence & Limitations</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation.confidenceAndLimitations}
          </p>
        </div>
      </div>

      {/* Section 5: What to verify next */}
      <div className="mt-4 p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/20">
        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-2">
          <span>5. Recommended Human Verification Actions</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {explanation.whatToVerifyNext.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center shrink-0 font-mono text-[10px] mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

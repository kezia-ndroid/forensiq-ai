import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckSquare,
  Square,
  ExternalLink,
  Info,
  ArrowRight,
} from 'lucide-react';
import { SourceVerificationDetails } from '../../types/sourceVerification';
import { verifySourceUrl } from '../../services/sourceVerificationService';
import { Button } from '../ui/Button';

interface SourceVerificationCardProps {
  sourceVerification?: SourceVerificationDetails;
  onSourceVerified?: (details: SourceVerificationDetails) => void;
}

export const SourceVerificationCard: React.FC<SourceVerificationCardProps> = ({
  sourceVerification,
  onSourceVerified,
}) => {
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Checklist checked state tracker
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrlInput.trim()) return;

    setIsVerifyingUrl(true);
    setUrlError(null);
    try {
      const details = await verifySourceUrl(manualUrlInput);
      onSourceVerified?.(details);
      setManualUrlInput('');
    } catch (err: unknown) {
      setUrlError((err as Error).message || 'Invalid URL entered.');
    } finally {
      setIsVerifyingUrl(false);
    }
  };

  const defaultChecklist = [
    {
      id: 'chk-1',
      label: 'Find the Earliest Known Upload',
      description: 'Run reverse-image search on Google Lens or TinEye to identify where and when this asset first appeared.',
    },
    {
      id: 'chk-2',
      label: 'Check Originating Source & Domain Credibility',
      description: 'Is the publisher a primary eyewitness, an accredited news agency, or an anonymous repost account?',
    },
    {
      id: 'chk-3',
      label: 'Compare Against Corroborating Reporting',
      description: 'Check whether wire services (Reuters, AP, AFP, BBC) report on the same event at that date and location.',
    },
    {
      id: 'chk-4',
      label: 'Look for Cropping or Missing Context',
      description: 'Inspect the frame edges. Was a watermark cropped out? Is an authentic image presented with a misleading caption?',
    },
    {
      id: 'chk-5',
      label: 'Verify Environmental Details',
      description: 'Compare weather, seasonal vegetation, architectural signage, and shadow direction against satellite or street views.',
    },
    {
      id: 'chk-6',
      label: 'Do Not Share Until Independently Verified',
      description: 'If indicators are elevated or origin remains unverified, avoid sharing to prevent accidental disinformation spread.',
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Globe className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Stage 7: Provenance
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-1">
            Source & Context Verification
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ground media within its originating publication history, domain credibility, and cross-reference tools.
          </p>
        </div>
      </div>

      {/* Source Details If Available */}
      {sourceVerification ? (
        <div className="space-y-6">
          {/* Domain & Protocol Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Domain / Hostname
              </span>
              <span className="text-sm font-bold text-white font-mono truncate block" title={sourceVerification.hostname}>
                {sourceVerification.hostname}
              </span>
              <span className="text-[11px] text-cyan-400 mt-1 block">
                {sourceVerification.domainCategoryLabel}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Transport Security
              </span>
              <div className="flex items-center gap-2 mt-1">
                {sourceVerification.isHttpsSecure ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-300">HTTPS Encrypted</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-bold text-rose-300">Insecure HTTP</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Standard Web Protocol</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Asset Classification
              </span>
              <span className="text-sm font-bold text-slate-200">
                {sourceVerification.sourceTypeGuess}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                {sourceVerification.fileExtension || 'Web Document'}
              </span>
            </div>
          </div>

          {/* CORS & Server Message Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="text-slate-200 font-semibold block mb-0.5">Metadata Extraction Status:</span>
              <p className="text-slate-400 leading-relaxed">
                {sourceVerification.serverMessage}
              </p>
              {sourceVerification.metadataAccessible && (
                <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] text-slate-300">
                  {sourceVerification.contentType && <span>Type: {sourceVerification.contentType}</span>}
                  {sourceVerification.contentLengthFormatted && <span>Size: {sourceVerification.contentLengthFormatted}</span>}
                  {sourceVerification.lastModified && <span>Modified: {sourceVerification.lastModified}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Real External Reverse Lookup Actions */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-3">
              Independent Reverse-Search Query Endpoints
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={sourceVerification.externalReverseLookupUrls.googleLensUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 flex items-center justify-between text-xs font-semibold transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  Google Lens Search
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
              </a>

              <a
                href={sourceVerification.externalReverseLookupUrls.tineyeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 flex items-center justify-between text-xs font-semibold transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-teal-400" />
                  TinEye Historical Index
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
              </a>

              <a
                href={sourceVerification.externalReverseLookupUrls.bingVisualUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 flex items-center justify-between text-xs font-semibold transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  Bing Visual Matching
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Manual URL lookup form if media was uploaded directly without a URL */
        <div className="mb-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-cyan-400" />
            Check Claim or Publication Source URL
          </h4>
          <p className="text-xs text-slate-400 mb-4">
            Where did you find this media? Paste the source post link or publication URL to evaluate domain credibility and cross-checks.
          </p>

          <form onSubmit={handleManualVerify} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={manualUrlInput}
              onChange={(e) => setManualUrlInput(e.target.value)}
              placeholder="https://news-outlet.org/article-or-post..."
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!manualUrlInput.trim() || isVerifyingUrl}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isVerifyingUrl ? 'Checking...' : 'Verify Source'}
            </Button>
          </form>

          {urlError && (
            <p className="text-xs text-rose-400 mt-2">{urlError}</p>
          )}
        </div>
      )}

      {/* Interactive Verification Checklist */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              Empirical Verification Checklist
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Work through these verification steps before accepting or republishing this media.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60">
            {Object.values(checkedItems).filter(Boolean).length} / {defaultChecklist.length} Verified
          </span>
        </div>

        <div className="space-y-3">
          {defaultChecklist.map((item) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                  isChecked
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-slate-200'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="mt-0.5 shrink-0 text-cyan-400">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <h5 className={`text-xs font-semibold ${isChecked ? 'text-cyan-300 line-through' : 'text-white'}`}>
                    {item.label}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

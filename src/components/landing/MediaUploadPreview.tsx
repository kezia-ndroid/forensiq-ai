import React, { useState, useRef, useEffect, ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  AlertCircle,
  Info,
  Sparkles,
  X,
  Shield,
  ArrowRight,
  Image as ImageIcon,
  Headphones,
  Video as VideoIcon,
  Trash2,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  Loader2,
  Cpu,
  Scan,
} from 'lucide-react';
import { SelectedMediaState } from '../../types';
import { UnifiedAnalysisReport } from '../../types/unifiedAnalysis';
import {
  validateMediaFile,
  validateMediaUrl,
  formatFileSize,
  getFileExtension,
  MAX_FILE_SIZE_MB,
} from '../../utils/mediaValidation';
import { runTruthLensAnalysis } from '../../services/analysisPipeline';
import { ResultsDashboard } from '../results/ResultsDashboard';
import { Button } from '../ui/Button';

export const MediaUploadPreview: React.FC = () => {
  // Input and Selection States
  const [urlInput, setUrlInput] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaState | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'image' | 'audio' | 'video'>('all');

  // Interactive Feedback States
  const [activeNotice, setActiveNotice] = useState<{ type: 'info' | 'warning' | 'error'; message: string; subtext?: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Analysis Lifecycle States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('Initializing media ingestion pipeline...');
  const [analysisReport, setAnalysisReport] = useState<UnifiedAnalysisReport | null>(null);

  // Hidden file input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Object URL cleanup tracker to prevent memory leaks
  const currentObjectUrlRef = useRef<string | null>(null);

  const cleanupCurrentObjectUrl = () => {
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCurrentObjectUrl();
    };
  }, []);

  // Compute accept attribute based on the active filter
  const getAcceptAttribute = () => {
    switch (selectedCategoryFilter) {
      case 'image':
        return '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
      case 'audio':
        return '.mp3,.wav,.m4a,.ogg,audio/*';
      case 'video':
        return '.mp4,.mov,.webm,video/*';
      default:
        return '.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.ogg,.mp4,.mov,.webm,image/*,audio/*,video/*';
    }
  };

  // Process a selected or dropped file
  const handleFileProcess = (file: File) => {
    const validation = validateMediaFile(file);

    if (!validation.isValid || !validation.mediaType) {
      setActiveNotice({
        type: 'error',
        message: validation.error || 'Invalid media file selected.',
        subtext: 'Supported formats: JPG, PNG, WEBP, MP3, WAV, M4A, OGG, MP4, MOV, WEBM (Max 50 MB).',
      });
      return;
    }

    cleanupCurrentObjectUrl();

    const newObjectUrl = URL.createObjectURL(file);
    currentObjectUrlRef.current = newObjectUrl;

    const mediaState: SelectedMediaState = {
      file,
      mediaType: validation.mediaType,
      objectUrl: newObjectUrl,
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
      extension: getFileExtension(file.name).toUpperCase(),
    };

    setSelectedMedia(mediaState);
    setActiveNotice(null);
    setAnalysisReport(null);
  };

  // Handle standard file input change
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleDropzoneKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenFileDialog();
    }
  };

  // Drag and Drop event handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleRemoveMedia = () => {
    cleanupCurrentObjectUrl();
    setSelectedMedia(null);
    setAnalysisReport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveNotice(null);
  };

  // Full Analysis Execution
  const handleAnalyzeTrigger = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedMedia && !urlInput.trim()) {
      setActiveNotice({
        type: 'warning',
        message: 'Please upload a media file or enter a media URL first.',
        subtext: 'Select an image, audio clip, video, or provide a public media URL to proceed.',
      });
      return;
    }

    let validUrl: string | undefined = undefined;
    if (urlInput.trim()) {
      const urlValidation = validateMediaUrl(urlInput);
      if (!urlValidation.isValid) {
        setActiveNotice({
          type: 'error',
          message: urlValidation.error || 'Invalid URL entered.',
          subtext: 'Please provide a valid web URL beginning with https:// or http://',
        });
        return;
      }
      validUrl = urlValidation.sanitizedUrl;
    }

    setIsAnalyzing(true);
    setAnalysisReport(null);
    setAnalysisStep('Initiating multi-modal forensic inspection...');
    setActiveNotice(null);

    try {
      const report = await runTruthLensAnalysis({
        file: selectedMedia?.file,
        mediaUrl: validUrl,
        onProgress: (stepMessage) => {
          setAnalysisStep(stepMessage);
        },
      });

      setAnalysisReport(report);

      setTimeout(() => {
        const resultsEl = document.getElementById('results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: unknown) {
      setActiveNotice({
        type: 'error',
        message: 'Analysis could not be completed.',
        subtext: (err as Error).message || 'An unexpected error occurred during client-side signal processing.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisReport(null);
    setSelectedMedia(null);
    setUrlInput('');
    cleanupCurrentObjectUrl();
    setActiveNotice(null);
    setTimeout(() => {
      const analyzeEl = document.getElementById('analyze');
      if (analyzeEl) {
        analyzeEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <>
      <section id="analyze" className="py-16 md:py-24 relative scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-pink-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Modal Forensic Ingestion Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Media Inspection Workspace
            </h2>
            <p className="mt-3 text-purple-200/80 text-base max-w-xl mx-auto">
              Select or drop an image, audio, or video file to run client-side mathematical forensics, detect potential indicators, and verify context.
            </p>
          </div>

          {/* Dynamic User Alert Notice Banner */}
          {activeNotice && (
            <div
              role="alert"
              aria-live="polite"
              className={`mb-6 p-4 rounded-2xl backdrop-blur-md border shadow-lg animate-in fade-in slide-in-from-top-3 duration-300 ${
                activeNotice.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/50 shadow-rose-950/40 text-rose-200'
                  : activeNotice.type === 'warning'
                  ? 'bg-amber-950/80 border-amber-500/50 shadow-amber-950/40 text-amber-200'
                  : 'bg-purple-950/80 border-purple-500/50 shadow-purple-950/50 text-pink-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      activeNotice.type === 'error'
                        ? 'bg-rose-500/20 text-rose-300'
                        : activeNotice.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-purple-500/20 text-pink-300'
                    }`}
                  >
                    {activeNotice.type === 'error' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : activeNotice.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{activeNotice.message}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                          activeNotice.type === 'error'
                            ? 'bg-rose-900/80 text-rose-200 border-rose-700/60'
                            : activeNotice.type === 'warning'
                            ? 'bg-amber-900/80 text-amber-200 border-amber-700/60'
                            : 'bg-purple-900/80 text-pink-200 border-purple-600/40'
                        }`}
                      >
                        {activeNotice.type}
                      </span>
                    </h4>
                    {activeNotice.subtext && (
                      <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
                        {activeNotice.subtext}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNotice(null)}
                  className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-purple-900 transition-colors"
                  aria-label="Dismiss message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Hidden native file input element */}
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptAttribute()}
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Media file upload input"
          />

          {/* Scanning Progress Overlay if isAnalyzing */}
          {isAnalyzing ? (
            <div className="relative rounded-3xl border border-purple-500/40 bg-[#140a28]/95 p-8 sm:p-12 backdrop-blur-xl shadow-2xl shadow-purple-950/60 text-center animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-xl shadow-pink-500/20">
                    <Scan className="w-10 h-10 animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 text-slate-950 flex items-center justify-center animate-spin">
                    <Loader2 className="w-4 h-4" />
                  </div>
                </div>

                <span className="text-xs font-semibold uppercase tracking-widest text-pink-400 mb-2">
                  Scanning Media Signals
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Forensic Pipeline In Progress
                </h3>

                <p className="text-sm font-medium text-pink-200 max-w-md font-mono bg-purple-950/80 px-4 py-2 rounded-xl border border-purple-800/80 mb-4">
                  {analysisStep}
                </p>

                <div className="w-full max-w-xs h-2 bg-purple-950 rounded-full overflow-hidden border border-purple-800">
                  <div className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 animate-pulse rounded-full w-3/4" />
                </div>

                <span className="text-[11px] text-purple-400/70 mt-4">
                  Zero cloud upload • 100% Client-side mathematical analysis
                </span>
              </div>
            </div>
          ) : (
            /* The Main Analysis Card Container */
            <div className="relative rounded-3xl border border-purple-900/60 bg-[#130926]/85 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-purple-950/60">
              {/* Subtle Corner Accent Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-600/10 blur-3xl pointer-events-none rounded-full" />

              {/* Media Format Filter Selector */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-6 mb-6 border-b border-purple-900/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-purple-300">Media Mode:</span>
                  <div className="flex p-1 bg-purple-950/90 rounded-xl border border-purple-900/80">
                    {(['all', 'image', 'audio', 'video'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryFilter(cat);
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                          selectedCategoryFilter === cat
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                            : 'text-purple-300/80 hover:text-white'
                        }`}
                      >
                        {cat === 'all' ? 'All Formats' : cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-300">
                  <Shield className="w-3.5 h-3.5 text-pink-400" />
                  <span>Evidence-Based Forensic Engine Active</span>
                </div>
              </div>

              {/* DYNAMIC CONTENT: Either Empty Dropzone OR Selected File Preview */}
              {!selectedMedia ? (
                /* Drag & Drop Upload Zone */
                <div
                  tabIndex={0}
                  role="button"
                  aria-label="Upload media file. Press enter or space to browse files or drag and drop files here."
                  onClick={handleOpenFileDialog}
                  onKeyDown={handleDropzoneKeyDown}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group relative cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400 ${
                    isDraggingOver
                      ? 'border-pink-400 bg-purple-950/50 shadow-xl shadow-pink-950/50 scale-[1.01]'
                      : 'border-purple-800/80 hover:border-pink-500/60 bg-[#0e071c]/60 hover:bg-[#0e071c]/90'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    {/* Animated Icon Ring */}
                    <div className="relative mb-5">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                          isDraggingOver
                            ? 'bg-pink-500 text-slate-950 scale-110'
                            : 'bg-pink-500/10 border border-pink-500/30 text-pink-400 group-hover:scale-110 group-hover:border-pink-400 shadow-purple-950/50'
                        }`}
                      >
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div className="absolute inset-0 bg-pink-400/20 rounded-2xl blur-md -z-10 group-hover:opacity-100 opacity-0 transition-opacity" />
                    </div>

                    {/* Prompt Text */}
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      {isDraggingOver ? 'Drop media file to inspect' : 'Upload Image, Audio, or Video'}
                    </h3>

                    <p className="text-sm text-purple-200/80 max-w-sm mb-4">
                      Drag and drop your file here, or click to browse from your device
                    </p>

                    {/* Supported Format Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-purple-300/80 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-purple-950 border border-purple-900 text-purple-200">
                        Images: JPG, PNG, WEBP
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-purple-950 border border-purple-900 text-purple-200">
                        Audio: MP3, WAV, M4A, OGG
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-purple-950 border border-purple-900 text-purple-200">
                        Video: MP4, MOV, WEBM
                      </span>
                    </div>

                    <span className="text-[11px] text-purple-400/70">
                      Maximum file size: {MAX_FILE_SIZE_MB} MB • Zero server upload • Client-side privacy
                    </span>
                  </div>
                </div>
              ) : (
                /* Selected File Preview Component */
                <div className="rounded-2xl border border-purple-900/60 bg-[#0e071c]/80 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-900/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/30">
                        <FileCheck className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Selected Media Loaded
                        </h3>
                        <p className="text-xs text-purple-300/80">
                          Validated client-side • Ready for multi-modal analysis
                        </p>
                      </div>
                    </div>

                    {/* Actions: Change File / Remove */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenFileDialog}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Change File
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveMedia}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Type-Specific Preview Display */}
                  <div className="mb-5 rounded-xl bg-purple-950/40 border border-purple-900/60 p-4 overflow-hidden">
                    {selectedMedia.mediaType === 'image' && (
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative max-h-72 w-full flex items-center justify-center rounded-lg overflow-hidden bg-black/40 border border-purple-900/60">
                          <img
                            src={selectedMedia.objectUrl}
                            alt={`Preview of ${selectedMedia.name}`}
                            className="max-h-72 max-w-full object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {selectedMedia.mediaType === 'audio' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/80 border border-purple-900">
                          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/30 shrink-0">
                            <Headphones className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">
                              {selectedMedia.name}
                            </p>
                            <p className="text-xs text-purple-300">
                              Acoustic audio stream • {selectedMedia.sizeFormatted}
                            </p>
                          </div>
                        </div>
                        {/* Safe local audio preview player */}
                        <div className="w-full">
                          <audio
                            controls
                            src={selectedMedia.objectUrl}
                            className="w-full h-10 accent-pink-500 rounded-lg"
                          >
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                      </div>
                    )}

                    {selectedMedia.mediaType === 'video' && (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-full max-h-80 rounded-xl overflow-hidden bg-black border border-purple-900/60 flex items-center justify-center">
                          <video
                            controls
                            src={selectedMedia.objectUrl}
                            className="w-full max-h-80 object-contain rounded-xl"
                          >
                            Your browser does not support video playback.
                          </video>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-purple-950/60 p-3 rounded-xl border border-purple-900/60">
                    <div>
                      <span className="text-purple-400/80 block mb-0.5 font-medium">File Name</span>
                      <span className="text-purple-100 font-mono truncate block" title={selectedMedia.name}>
                        {selectedMedia.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-400/80 block mb-0.5 font-medium">Media Type</span>
                      <span className="text-pink-400 font-semibold uppercase flex items-center gap-1">
                        {selectedMedia.mediaType === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                        {selectedMedia.mediaType === 'audio' && <Headphones className="w-3.5 h-3.5" />}
                        {selectedMedia.mediaType === 'video' && <VideoIcon className="w-3.5 h-3.5" />}
                        {selectedMedia.mediaType}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-400/80 block mb-0.5 font-medium">Format</span>
                      <span className="text-purple-200 font-mono font-semibold">
                        {selectedMedia.extension}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-400/80 block mb-0.5 font-medium">File Size</span>
                      <span className="text-purple-200 font-mono">
                        {selectedMedia.sizeFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider with "OR" */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-900/60" />
                </div>
                <span className="relative px-4 text-xs font-semibold uppercase tracking-wider text-purple-400/80 bg-[#130926]">
                  {selectedMedia ? 'Optional Source Context URL' : 'or paste a media URL'}
                </span>
              </div>

              {/* URL Input Form */}
              <form onSubmit={handleAnalyzeTrigger} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (activeNotice) setActiveNotice(null);
                      }}
                      placeholder="https://example.com/media-or-post-url..."
                      className="w-full pl-10 pr-4 py-3 bg-[#0e071c] border border-purple-800/80 rounded-xl text-sm text-white placeholder-purple-400/60 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Analyze button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="shrink-0 px-6 py-3 font-semibold text-sm shadow-md shadow-purple-900/30"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Analyze Media
                  </Button>
                </div>
              </form>

              {/* Engine Status Note */}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-purple-300/80">
                <Cpu className="w-3.5 h-3.5 text-pink-400" />
                <span>
                  Client-Side Engine Ready • Supports JPG, PNG, WEBP, MP3, WAV, M4A, OGG, MP4, MOV, WEBM
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Render Results Dashboard if Analysis Completed */}
      {analysisReport && (
        <ResultsDashboard
          initialReport={analysisReport}
          onReset={handleReset}
        />
      )}
    </>
  );
};

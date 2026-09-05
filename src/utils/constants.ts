import { HowItWorksStep, NavigationItem, SupportedMediaCategory, WhyTruthLensItem } from '../types';

export const BRAND_NAME = 'Forensiq AI';
export const BRAND_TAGLINE = 'Detect • Understand • Verify';
export const BRAND_DESCRIPTION =
  'Analyze suspicious media, understand the evidence, and verify the context before you trust or share it.';

export const DISCLAIMER_TEXT =
  'Forensiq AI provides experimental media analysis and verification guidance. Its indicators do not prove that media is authentic or AI-generated. Always verify important information with reliable sources.';

export const NAV_ITEMS: NavigationItem[] = [
  { name: 'Home', href: '#home' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Analyze', href: '#analyze' },
  { name: 'Why Forensiq', href: '#why-forensiq' },
  { name: 'Supported Media', href: '#supported-media' },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    stepNumber: '01',
    title: 'Detect',
    tagline: 'Multi-modal signal discovery',
    description:
      'Identify potential signs of AI generation or manipulation across imagery, audio waveforms, and video frames using client-side mathematical heuristics.',
    icon: 'ScanEye',
    color: 'from-pink-500 via-fuchsia-500 to-purple-600',
  },
  {
    stepNumber: '02',
    title: 'Understand',
    tagline: 'Transparent evidence breakdown',
    description:
      'Explain the evidence, anomalies, and degrees of uncertainty in simple, accessible, and transparent language using GenAI explanation synthesis.',
    icon: 'BrainCircuit',
    color: 'from-fuchsia-500 to-pink-600',
  },
  {
    stepNumber: '03',
    title: 'Verify',
    tagline: 'Source and context grounding',
    description:
      'Check provenance, origin timestamps, and real-world context with independent reverse search and checklists before deciding to trust or share.',
    icon: 'ShieldCheck',
    color: 'from-purple-600 to-pink-600',
  },
];

export const WHY_TRUTHLENS_ITEMS: WhyTruthLensItem[] = [
  {
    title: 'Evidence-Based Assessment',
    description:
      'We do not claim 100% certainty. Media is evaluated probabilistically through observable artifacts, frequency patterns, and metadata.',
    icon: 'FileSearch',
    tag: 'Empirical',
  },
  {
    title: 'Transparent Explanations',
    description:
      'No black boxes. You receive clear forensic signal breakdowns and plain-English summaries explaining why a specific score was reached.',
    icon: 'Lightbulb',
    tag: 'Clarity',
  },
  {
    title: 'Context & Provenance Verification',
    description:
      'Detection alone is not enough. Forensiq AI helps trace the original context, publication timeline, and potential out-of-context reuse.',
    icon: 'Layers',
    tag: 'Contextual',
  },
  {
    title: 'Confidence & Uncertainty',
    description:
      'Every assessment reports explicit confidence bounds, acknowledging edge cases, compression artifacts, and model limitations.',
    icon: 'Gauge',
    tag: 'Calibrated',
  },
  {
    title: 'Designed for Real-World Scrutiny',
    description:
      'Engineered for everyday citizens, journalists verifying breaking news, and researchers cataloging synthetic media dissemination.',
    icon: 'Users',
    tag: 'Accessible',
  },
  {
    title: 'Responsible AI Principles',
    description:
      'Built around privacy-preserving inspection, zero retention of sensitive inputs, client-side execution, and ethical disclosure standards.',
    icon: 'ShieldAlert',
    tag: 'Ethical',
  },
];

export const SUPPORTED_MEDIA_ITEMS: SupportedMediaCategory[] = [
  {
    id: 'image',
    title: 'Image Forensics',
    iconName: 'Image',
    description: 'Generative diffusion noise patterns, spatial variance inconsistency, dynamic range clipping, and EXIF/PNG parameters.',
    supportedFormats: ['JPG', 'JPEG', 'PNG', 'WEBP'],
    stageLabel: 'Forensic Engine Active',
    features: ['Spatial Noise Consistency', 'Luminance Statistics', 'Header & Metadata Forensics', 'Recompression Difference (Exp.)'],
  },
  {
    id: 'audio',
    title: 'Audio Forensics',
    iconName: 'Headphones',
    description: 'Voice clone acoustic signals, synthetic vocoder brickwall cutoffs, pause distributions, and digital clipping.',
    supportedFormats: ['MP3', 'WAV', 'M4A', 'OGG'],
    stageLabel: 'Forensic Engine Active',
    features: ['Spectral Centroid & Cutoff', 'Waveform Dynamics (RMS / Crest)', 'Silence & Pause Ratio', 'Zero-Crossing Rate'],
  },
  {
    id: 'video',
    title: 'Video Forensics',
    iconName: 'Video',
    description: 'Temporal frame-to-frame continuity, luminance flicker variance across shots, and high-frequency edge stability.',
    supportedFormats: ['MP4', 'MOV', 'WEBM'],
    stageLabel: 'Forensic Engine Active',
    features: ['Inter-Frame Pixel Delta', 'Luminance Flicker Variance', 'Edge Sharpness Consistency', 'Scene Cut Detection'],
  },
];

/**
 * TruthLens AI - Core Type Definitions
 * Designed for modular extension across Stages 1 through 8.
 */

export type MediaType = 'image' | 'audio' | 'video';

export interface SupportedMediaCategory {
  id: MediaType;
  title: string;
  iconName: string;
  description: string;
  supportedFormats: string[];
  stageLabel: string;
  features: string[];
}

export interface NavigationItem {
  name: string;
  href: string;
}

export interface HowItWorksStep {
  stepNumber: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
}

export interface WhyTruthLensItem {
  title: string;
  description: string;
  icon: string;
  tag?: string;
}

/**
 * Stage 2 Media Selection & Preview State
 */
export interface SelectedMediaState {
  file: File;
  mediaType: MediaType;
  objectUrl: string;
  name: string;
  sizeFormatted: string;
  extension: string;
}

/**
 * Stage 3 Image Analysis Type Exports
 */
export * from './imageAnalysis';

/**
 * Placeholder interfaces for future stages (Stage 4 - Stage 8)
 */
export interface DetectionEvidence {
  signalName: string;
  category: 'visual_artifact' | 'audio_frequency' | 'temporal_consistency' | 'metadata' | 'source_attribution';
  confidenceWeight: number; // 0.0 to 1.0 (probabilistic)
  findingSummary: string;
}

export interface Stage2UploadPayload {
  file?: File;
  mediaUrl?: string;
  mediaType?: MediaType;
}

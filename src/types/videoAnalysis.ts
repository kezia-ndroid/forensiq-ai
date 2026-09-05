/**
 * TruthLens AI - Video Analysis Type Definitions
 * 
 * Supports client-side browser video frame sampling for MP4, MOV, WEBM.
 * Conservative, probabilistic assessment of temporal and inter-frame visual continuity.
 */

import { MeasurementConfidence, RiskLevel } from './imageAnalysis';

export type VideoIndicatorCategory =
  | 'temporal_consistency'
  | 'frame_stability'
  | 'lighting_flicker'
  | 'compression_artifacts'
  | 'container_metadata';

export interface VideoIndicator {
  id: string;
  category: VideoIndicatorCategory;
  title: string;
  severity: 'info' | 'caution' | 'warning';
  observedValue: string;
  description: string;
  limitationNote: string;
  weightContribution: number;
}

export interface SampledFrameMetrics {
  frameIndex: number;
  timestampSeconds: number;
  meanLuminance: number;
  rmsContrast: number;
  edgeDensity: number;
}

export interface VideoForensicMetrics {
  durationSeconds: number;
  durationFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  megapixelsPerFrame: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  mimeType: string;

  // Frame Sampling
  sampledFrameCount: number;
  sampleIntervalSeconds: number;

  // Inter-frame Continuity & Dynamics
  interFrameDifferenceMean: number;    // Average pixel delta across consecutive frames (0-255)
  interFrameDifferenceMax: number;     // Highest difference (scene cut or sudden warp)
  luminanceFlickerVariance: number;   // Variance of brightness across sampled frames
  sceneCutCount: number;               // Detected sharp cuts or transitions
  edgeStabilityRatio: number;          // Consistency of high-frequency textures

  // Processing
  analysisDurationMs: number;
  analysisResolution: string;
}

export interface VideoAnalysisResult {
  analysisId: string;
  timestamp: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;

  // Assessment
  riskScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;

  // Measurement Reliability
  measurementConfidence: MeasurementConfidence;
  confidenceRationale: string;

  // Evidence & Indicators
  indicators: VideoIndicator[];
  metrics: VideoForensicMetrics;
  evidenceSummary: string;

  whatThisMeans: string;
  recommendations: string[];
  disclaimer: string;
}

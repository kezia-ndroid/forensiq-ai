/**
 * TruthLens AI - Audio Analysis Type Definitions
 * 
 * Supports client-side Web Audio API forensics for MP3, WAV, M4A, OGG.
 * Conservative, evidence-based metrics without claims of absolute certainty.
 */

import { MeasurementConfidence, RiskLevel } from './imageAnalysis';

export type AudioIndicatorCategory =
  | 'spectral_characteristics'
  | 'dynamic_range'
  | 'temporal_continuity'
  | 'signal_anomalies'
  | 'format_metadata';

export interface AudioIndicator {
  id: string;
  category: AudioIndicatorCategory;
  title: string;
  severity: 'info' | 'caution' | 'warning';
  observedValue: string;
  description: string;
  limitationNote: string;
  weightContribution: number;
}

export interface AudioForensicMetrics {
  durationSeconds: number;
  durationFormatted: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  mimeType: string;
  sampleRate: number;
  numberOfChannels: number;
  channelMode: 'Mono' | 'Stereo' | 'Multi-channel';
  
  // Amplitude & Dynamics
  rmsLevelDb: number;            // Overall root-mean-square level in decibels
  peakAmplitude: number;         // Max absolute amplitude [0.0 - 1.0]
  crestFactorDb: number;         // Peak-to-RMS ratio in decibels
  clippedSamplesPct: number;     // Percentage of samples touching digital ceiling (>= 0.999)

  // Temporal & Silence
  silenceRatioPct: number;       // Percentage of time below -50 dBFS
  zeroCrossingRateMean: number;  // Rate of zero-axis crossings per second
  zeroCrossingRateStdDev: number;

  // Spectral Characteristics
  estimatedCutoffFrequencyHz?: number; // Estimated upper frequency boundary
  spectralCentroidHz?: number;         // Center of mass of the spectrum
  highFrequencyEnergyPct?: number;     // Ratio of energy above 12 kHz

  // Performance
  analysisDurationMs: number;
}

export interface AudioAnalysisResult {
  analysisId: string;
  timestamp: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;

  // Assessment
  riskScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;

  // Reliability
  measurementConfidence: MeasurementConfidence;
  confidenceRationale: string;

  // Evidence & Indicators
  indicators: AudioIndicator[];
  metrics: AudioForensicMetrics;
  evidenceSummary: string;

  whatThisMeans: string;
  recommendations: string[];
  disclaimer: string;
}

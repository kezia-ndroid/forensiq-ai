/**
 * TruthLens AI - Unified Analysis Types
 * 
 * Aggregates Image, Audio, and Video forensic outcomes into a single polymorphic
 * data structure consumed by the Unified Results Dashboard and the GenAI Explanation layer.
 */

import { MediaType } from './index';
import { ImageAnalysisResult } from './imageAnalysis';
import { AudioAnalysisResult } from './audioAnalysis';
import { VideoAnalysisResult } from './videoAnalysis';
import { SourceVerificationDetails } from './sourceVerification';

export interface UnifiedForensicIndicator {
  id: string;
  title: string;
  category: string;
  severity: 'info' | 'caution' | 'warning';
  observedValue: string;
  description: string;
  limitationNote: string;
  weightContribution: number;
}

export interface GenAIExplanation {
  provider: 'gemini' | 'local_heuristic';
  providerLabel: string;
  modelName: string;
  generatedAt: string;
  isFallback: boolean;

  // The 5 required sections
  whatWasDetected: string;
  whyIndicatorsMatter: string;
  whatIndicatorsDoNotProve: string;
  confidenceAndLimitations: string;
  whatToVerifyNext: string[];
}

export interface UnifiedAnalysisReport {
  id: string;
  mediaType: MediaType;
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  previewUrl: string;
  timestamp: string;

  // Overall Assessment
  riskScore: number;                 // 0 to 100
  riskLevel: 'low' | 'moderate' | 'elevated' | 'inconclusive';
  riskLabel: string;
  measurementConfidence: 'high' | 'moderate' | 'low';
  confidenceRationale: string;
  evidenceSummary: string;
  recommendations: string[];
  disclaimer: string;

  // Polymorphic Forensic Payloads
  imageResult?: ImageAnalysisResult;
  audioResult?: AudioAnalysisResult;
  videoResult?: VideoAnalysisResult;

  // Unified list of indicators
  indicators: UnifiedForensicIndicator[];

  // Factual key-value summary metrics for display
  summaryMetrics: { label: string; value: string; hint?: string }[];

  // GenAI or Fallback Synthesis
  explanation: GenAIExplanation;

  // Optional Source / URL Verification Context
  sourceVerification?: SourceVerificationDetails;
}

/**
 * TruthLens AI - Stage 3 Image Analysis Type Definitions
 * 
 * Strict adherence to evidence-based, probabilistic forensics:
 * - Scores reflect observed indicators, never definitive proof.
 * - Confidence reflects measurement reliability, not AI probability.
 */

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'inconclusive';

export type MeasurementConfidence = 'high' | 'moderate' | 'low';

export type IndicatorCategory = 
  | 'metadata' 
  | 'pixel_statistics' 
  | 'spatial_consistency' 
  | 'experimental_compression';

export type IndicatorSeverity = 'info' | 'caution' | 'warning';

export interface ImageIndicator {
  id: string;
  category: IndicatorCategory;
  title: string;
  severity: IndicatorSeverity;
  observedValue: string;
  description: string;
  limitationNote: string;
  weightContribution: number;
}

export interface ImageForensicMetrics {
  // Factual Original Metadata
  originalWidth: number;
  originalHeight: number;
  aspectRatio: string;
  megapixels: number;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileType: string;
  fileName: string;
  
  // Metadata / Header Findings
  hasExifMetadata: boolean;
  metadataSummary: string;
  detectedSoftwareTags?: string[];

  // Pixel Distribution & Statistical Measurements
  luminanceMean: number;        // 0 - 255
  luminanceStdDev: number;
  contrastRms: number;          // Root Mean Square contrast
  channelDiscrepancy: number;   // Color divergence
  dynamicRangeClippingPct: number; // Percentage of pixels pinned at 0 or 255

  // Spatial Texture & Noise Consistency
  spatialNoiseVariance: number;
  spatialVarianceDiscrepancy: number; // Ratio between highest and lowest regional noise variance

  // Experimental Compression Difference
  experimentalCompressionDelta?: number;

  // Analysis Performance Documentation
  analysisResolution: string;   // e.g. "1024x768 (Analysis Copy)"
  analysisDurationMs: number;
}

export interface ImageAnalysisResult {
  analysisId: string;
  timestamp: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  
  // Overall Assessment
  riskScore: number;            // 0 - 100 (Conservative heuristic index)
  riskLevel: RiskLevel;
  riskLabel: string;            // e.g. "Low Indicator Level", "Moderate Risk Indicators", etc.
  
  // Measurement Reliability (Quality of analysis, NOT probability of AI)
  measurementConfidence: MeasurementConfidence;
  confidenceRationale: string;

  // Evidence & Indicators
  indicators: ImageIndicator[];
  metrics: ImageForensicMetrics;
  evidenceSummary: string;
  
  // What This Means & Recommendations
  whatThisMeans: string;
  recommendations: string[];

  // Mandatory Ethical Disclaimer
  disclaimer: string;
}

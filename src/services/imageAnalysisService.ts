/**
 * TruthLens AI - Image Analysis Service
 * 
 * Implements client-side empirical image analysis for:
 * - JPG / JPEG
 * - PNG
 * - WEBP
 * 
 * Core Principles:
 * - Conservative, evidence-based heuristics.
 * - Common dimensions are NOT penalized.
 * - Missing EXIF is NOT evidence of AI generation.
 * - ELA / Recompression is labeled strictly experimental.
 * - Confidence represents measurement reliability, NOT AI probability.
 */

import {
  ImageAnalysisResult,
  ImageForensicMetrics,
  ImageIndicator,
  RiskLevel,
} from '../types/imageAnalysis';
import {
  calculateAspectRatio,
  calculateColorChannelBalance,
  calculateExperimentalRecompressionDelta,
  calculateLuminanceAndContrast,
  calculateSpatialNoiseConsistency,
  evaluateMeasurementConfidence,
  inspectImageHeader,
} from '../utils/imageForensics';
import { formatFileSize } from '../utils/mediaValidation';

const MAX_ANALYSIS_DIMENSION = 1920; // Bound canvas size to avoid browser memory pressure

const clampScore = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Conservative, deterministic Indicator Index from measured forensic characteristics.
 * Uses continuous contributions (not a fixed floor / binary jump table) so different
 * measurable images can yield different scores. Dimensions and missing EXIF add 0.
 */
const computeImageIndicatorIndex = (input: {
  spatialVarianceRatio: number;
  spatialNoiseVariance: number;
  dynamicRangeClippingPct: number;
  rmsContrast: number;
  channelDiscrepancy: number;
  compressionDelta: number;
  hasGenerativeSoftwareTags: boolean;
  hasExif: boolean;
}): {
  score: number;
  spatial: number;
  textureSmoothing: number;
  clipping: number;
  lowContrast: number;
  lowChroma: number;
  compression: number;
  generative: number;
  exifRelief: number;
} => {
  const spatial = clampScore((input.spatialVarianceRatio - 1) * 1.6, 0, 20);
  const textureSmoothing =
    input.spatialNoiseVariance < 18
      ? clampScore((18 - input.spatialNoiseVariance) * 0.25, 0, 6)
      : 0;
  const clipping = clampScore(input.dynamicRangeClippingPct * 0.45, 0, 14);
  const lowContrast =
    input.rmsContrast < 0.22 ? clampScore((0.22 - input.rmsContrast) * 45, 0, 12) : 0;
  const lowChroma =
    input.channelDiscrepancy < 8 ? clampScore((8 - input.channelDiscrepancy) * 0.7, 0, 8) : 0;
  const compression = clampScore(input.compressionDelta * 0.55, 0, 16);
  const generative = input.hasGenerativeSoftwareTags ? 35 : 0;
  const exifRelief = input.hasExif && !input.hasGenerativeSoftwareTags ? 5 : 0;

  const raw =
    spatial +
    textureSmoothing +
    clipping +
    lowContrast +
    lowChroma +
    compression +
    generative -
    exifRelief;

  return {
    score: Math.round(clampScore(raw, 0, 95)),
    spatial: Math.round(spatial),
    textureSmoothing: Math.round(textureSmoothing),
    clipping: Math.round(clipping),
    lowContrast: Math.round(lowContrast),
    lowChroma: Math.round(lowChroma),
    compression: Math.round(compression),
    generative,
    exifRelief,
  };
};

export class ImageAnalysisError extends Error {
  constructor(message: string, public readonly code: string = 'IMAGE_ANALYSIS_ERROR') {
    super(message);
    this.name = 'ImageAnalysisError';
  }
}

/**
 * Analyzes an image file entirely within the browser.
 */
export const analyzeImage = async (file: File): Promise<ImageAnalysisResult> => {
  const startTime = performance.now();
  const analysisId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (!file) {
    throw new ImageAnalysisError('No file provided for image analysis', 'MISSING_FILE');
  }

  // 1. Inspect Binary Header
  const headerResult = await inspectImageHeader(file);

  // 2. Load Image element to get factual dimensions and render to canvas
  const objectUrl = URL.createObjectURL(file);
  let originalWidth = 0;
  let originalHeight = 0;
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imageElement = new Image();
      imageElement.onload = () => resolve(imageElement);
      imageElement.onerror = () =>
        reject(new ImageAnalysisError('Unable to decode image file. File may be corrupted or in an unsupported format.', 'DECODE_ERROR'));
      imageElement.src = objectUrl;
    });

    originalWidth = img.naturalWidth || img.width;
    originalHeight = img.naturalHeight || img.height;

    if (!originalWidth || !originalHeight || originalWidth < 16 || originalHeight < 16) {
      throw new ImageAnalysisError('Image resolution is too small or invalid for meaningful forensic analysis.', 'INVALID_RESOLUTION');
    }

    // Scale down copy for canvas pixel analysis if larger than max analysis bounds
    let renderWidth = originalWidth;
    let renderHeight = originalHeight;
    if (renderWidth > MAX_ANALYSIS_DIMENSION || renderHeight > MAX_ANALYSIS_DIMENSION) {
      if (renderWidth >= renderHeight) {
        renderHeight = Math.round((renderHeight * MAX_ANALYSIS_DIMENSION) / renderWidth);
        renderWidth = MAX_ANALYSIS_DIMENSION;
      } else {
        renderWidth = Math.round((renderWidth * MAX_ANALYSIS_DIMENSION) / renderHeight);
        renderHeight = MAX_ANALYSIS_DIMENSION;
      }
    }

    canvas = document.createElement('canvas');
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new ImageAnalysisError('Unable to create 2D canvas context for pixel analysis.', 'CANVAS_CONTEXT_ERROR');
    }

    ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
    const imageData = ctx.getImageData(0, 0, renderWidth, renderHeight);
    const pixels = imageData.data;

    // 3. Perform Statistical Forensics
    const lumResult = calculateLuminanceAndContrast(pixels);
    const colorResult = calculateColorChannelBalance(pixels);
    const spatialResult = calculateSpatialNoiseConsistency(pixels, renderWidth, renderHeight);
    const compressionResult = await calculateExperimentalRecompressionDelta(canvas, ctx, renderWidth, renderHeight);
    const confidenceAssessment = evaluateMeasurementConfidence(originalWidth, originalHeight, file.size);

    const megapixels = Math.round(((originalWidth * originalHeight) / 1_000_000) * 100) / 100;
    const aspectRatioStr = calculateAspectRatio(originalWidth, originalHeight);

    // 4. Assemble Measurable Metrics
    const metrics: ImageForensicMetrics = {
      originalWidth,
      originalHeight,
      aspectRatio: aspectRatioStr,
      megapixels,
      fileSizeBytes: file.size,
      fileSizeFormatted: formatFileSize(file.size),
      fileType: file.type || 'image/jpeg',
      fileName: file.name,
      hasExifMetadata: headerResult.hasExif,
      metadataSummary: headerResult.summary,
      detectedSoftwareTags: headerResult.detectedSoftware,
      luminanceMean: lumResult.meanLuminance,
      luminanceStdDev: lumResult.stdDevLuminance,
      contrastRms: lumResult.rmsContrast,
      channelDiscrepancy: colorResult.channelDiscrepancy,
      dynamicRangeClippingPct: lumResult.dynamicRangeClippingPct,
      spatialNoiseVariance: spatialResult.overallVariance,
      spatialVarianceDiscrepancy: spatialResult.varianceRatio,
      experimentalCompressionDelta: compressionResult.compressionDelta,
      analysisResolution: `${renderWidth}x${renderHeight}${renderWidth !== originalWidth ? ' (Optimized)' : ' (Native)'}`,
      analysisDurationMs: Math.round(performance.now() - startTime),
    };

    // 5. Evaluate Indicators and Conservative Indicator Index from measured metrics
    const indexBreakdown = computeImageIndicatorIndex({
      spatialVarianceRatio: spatialResult.varianceRatio,
      spatialNoiseVariance: spatialResult.overallVariance,
      dynamicRangeClippingPct: lumResult.dynamicRangeClippingPct,
      rmsContrast: lumResult.rmsContrast,
      channelDiscrepancy: colorResult.channelDiscrepancy,
      compressionDelta: compressionResult.compressionDelta,
      hasGenerativeSoftwareTags: Boolean(headerResult.detectedSoftware && headerResult.detectedSoftware.length > 0),
      hasExif: headerResult.hasExif,
    });

    const indicators: ImageIndicator[] = [];

    // Indicator A: Metadata & Software Chunks (missing EXIF is informational only — 0 points)
    if (headerResult.detectedSoftware && headerResult.detectedSoftware.length > 0) {
      indicators.push({
        id: 'meta_generative_tags',
        category: 'metadata',
        title: 'Generative Synthesis Metadata Detected',
        severity: 'warning',
        observedValue: headerResult.detectedSoftware.join(', '),
        description: 'Textual parameters or diffusion workflow metadata chunks were identified in the file header.',
        limitationNote: 'Some metadata can be stripped or injected manually; must be cross-verified.',
        weightContribution: indexBreakdown.generative,
      });
    } else if (headerResult.hasExif) {
      indicators.push({
        id: 'meta_exif_present',
        category: 'metadata',
        title: 'Standard Camera EXIF Header Present',
        severity: 'info',
        observedValue: 'EXIF APP1 Marker Found',
        description: 'File contains standard photographic exchangeable format markers typically written by camera hardware.',
        limitationNote: 'EXIF metadata can be forged or copied from real cameras onto synthetic media.',
        weightContribution: -indexBreakdown.exifRelief,
      });
    } else {
      indicators.push({
        id: 'meta_no_exif',
        category: 'metadata',
        title: 'No Photographic EXIF Header',
        severity: 'info',
        observedValue: 'Standard Web Container (Clean)',
        description: 'No hardware camera tags were observed. This is standard for web-distributed, compressed, or social media imagery.',
        limitationNote: 'Absence of EXIF does NOT indicate artificial generation. Social networks routinely scrub metadata.',
        weightContribution: 0,
      });
    }

    // Indicator B: Spatial Noise Consistency across Quadrants
    const spatialWeight = indexBreakdown.spatial + indexBreakdown.textureSmoothing;
    if (spatialResult.varianceRatio > 12.0) {
      indicators.push({
        id: 'spatial_noise_inconsistency',
        category: 'spatial_consistency',
        title: 'Elevated Spatial Noise Discrepancy',
        severity: 'caution',
        observedValue: `${spatialResult.varianceRatio.toFixed(1)}:1 regional ratio`,
        description: 'Significant texture variance disparity detected between image quadrants. Could indicate selective smoothing, compositing, or varying generative focus.',
        limitationNote: 'Legitimate photographic depth of field (bokeh) or macro backgrounds naturally cause noise variance.',
        weightContribution: spatialWeight,
      });
    } else {
      indicators.push({
        id: 'spatial_noise_uniform',
        category: 'spatial_consistency',
        title: 'Uniform Spatial Noise Distribution',
        severity: 'info',
        observedValue: `${spatialResult.varianceRatio.toFixed(1)}:1 regional ratio`,
        description: 'High-frequency gradient distribution is relatively consistent across image quadrants.',
        limitationNote: 'Uniform noise can occur naturally or be introduced by post-processing filters.',
        weightContribution: spatialWeight,
      });
    }

    // Indicator C: Dynamic Range / Extremes Clipping
    if (lumResult.dynamicRangeClippingPct > 15.0) {
      indicators.push({
        id: 'pixel_clipping_extreme',
        category: 'pixel_statistics',
        title: 'High Extreme Dynamic Range Pinning',
        severity: 'caution',
        observedValue: `${lumResult.dynamicRangeClippingPct.toFixed(1)}% pixels at extremes`,
        description: 'An elevated percentage of pixel values are pinned at pure white (255) or pure black (0), indicating severe clipping.',
        limitationNote: 'Can result from natural harsh lighting, flash photography, or aggressive stylistic contrast adjustments.',
        weightContribution: indexBreakdown.clipping,
      });
    } else if (indexBreakdown.clipping > 0) {
      indicators.push({
        id: 'pixel_clipping_measured',
        category: 'pixel_statistics',
        title: 'Measured Extreme-Value Pinning',
        severity: 'info',
        observedValue: `${lumResult.dynamicRangeClippingPct.toFixed(1)}% pixels at extremes`,
        description: 'A portion of pixels sit at pure black or pure white. This is common in high-contrast photography, graphics, and screenshots.',
        limitationNote: 'Clipping is a measurable luminance characteristic and is not proof of synthetic generation.',
        weightContribution: indexBreakdown.clipping,
      });
    }

    // Indicator D: Contrast RMS
    if (lumResult.rmsContrast < 0.12) {
      indicators.push({
        id: 'pixel_low_contrast',
        category: 'pixel_statistics',
        title: 'Atypical Low RMS Contrast',
        severity: 'info',
        observedValue: `RMS ${lumResult.rmsContrast.toFixed(3)}`,
        description: 'Observed contrast across luminance channels is unusually narrow, characteristic of heavy fog, washed flat shading, or certain synthetic latent spaces.',
        limitationNote: 'Artistic color grading and overcast outdoor scenes frequently produce low contrast.',
        weightContribution: indexBreakdown.lowContrast,
      });
    } else if (indexBreakdown.lowContrast > 0) {
      indicators.push({
        id: 'pixel_contrast_measured',
        category: 'pixel_statistics',
        title: 'Measured RMS Contrast',
        severity: 'info',
        observedValue: `RMS ${lumResult.rmsContrast.toFixed(3)}`,
        description: 'Luminance contrast is included in the indicator index as a continuous photometric measurement.',
        limitationNote: 'Lower contrast can occur in authentic overcast, fog, or graded photographs.',
        weightContribution: indexBreakdown.lowContrast,
      });
    }

    // Indicator D2: Channel discrepancy (previously measured but unused in scoring)
    if (indexBreakdown.lowChroma > 0) {
      indicators.push({
        id: 'pixel_channel_balance',
        category: 'pixel_statistics',
        title: 'Low Inter-Channel Color Divergence',
        severity: 'info',
        observedValue: `Mean RGB spread ${colorResult.channelDiscrepancy.toFixed(1)}`,
        description: 'Average difference between R, G, and B channels is relatively small, indicating a more neutral or desaturated palette.',
        limitationNote: 'Grayscale conversion, tungsten lighting, and many authentic photos also exhibit low channel spread.',
        weightContribution: indexBreakdown.lowChroma,
      });
    }

    // Indicator E: Experimental Recompression Difference
    if (compressionResult.compressionDelta > 14.0) {
      indicators.push({
        id: 'compression_recompression_delta',
        category: 'experimental_compression',
        title: 'High Recompression Residual Delta (Experimental)',
        severity: 'caution',
        observedValue: `Delta ${compressionResult.compressionDelta.toFixed(2)}`,
        description: 'Secondary compression produces noticeable high-frequency pixel deviations. May reflect unusual compression history or synthetic quantization.',
        limitationNote: 'Experimental client-side metric. Multiple re-saves or uncompressed PNG conversions can elevate this score legitimately.',
        weightContribution: indexBreakdown.compression,
      });
    } else {
      indicators.push({
        id: 'compression_recompression_stable',
        category: 'experimental_compression',
        title: 'Stable Recompression Gradient (Experimental)',
        severity: 'info',
        observedValue: `Delta ${compressionResult.compressionDelta.toFixed(2)}`,
        description: 'Secondary compression error lies within normal expected bounds for standard web imagery.',
        limitationNote: 'Experimental client-side metric for contextual reference only.',
        weightContribution: indexBreakdown.compression,
      });
    }

    // Indicator F: Factual Dimension Documentation (Explicitly 0 risk points)
    indicators.push({
      id: 'meta_dimensions_factual',
      category: 'metadata',
      title: 'Factual Resolution & Aspect Ratio',
      severity: 'info',
      observedValue: `${originalWidth} × ${originalHeight} (${aspectRatioStr})`,
      description: `Natural image dimensions measured at ${megapixels} Megapixels.`,
      limitationNote: 'Resolution is strictly factual metadata and does not contribute to the risk score.',
      weightContribution: 0,
    });

    // 6. Final Risk Level Calculation — derived from measured metrics, no fixed baseline floor
    const finalRiskScore = indexBreakdown.score;
    let riskLevel: RiskLevel = 'low';
    let riskLabel = 'Low Indicator Level';

    if (confidenceAssessment.confidence === 'low' && finalRiskScore < 40) {
      riskLevel = 'inconclusive';
      riskLabel = 'Evidence Inconclusive';
    } else if (finalRiskScore >= 55) {
      riskLevel = 'elevated';
      riskLabel = 'Elevated Risk Indicators';
    } else if (finalRiskScore >= 28) {
      riskLevel = 'moderate';
      riskLabel = 'Moderate Risk Indicators';
    } else {
      riskLevel = 'low';
      riskLabel = 'Low Indicator Level';
    }

    // 7. Evidence Summary & Recommendations
    let evidenceSummary = '';
    if (riskLevel === 'elevated') {
      evidenceSummary = `Observed ${indicators.filter((i) => i.severity !== 'info').length} elevated indicators, including ${
        headerResult.detectedSoftware ? 'synthetic software tags' : 'spatial noise or recompression anomalies'
      }. Further provenance checking is strongly recommended.`;
    } else if (riskLevel === 'moderate') {
      evidenceSummary =
        'Observed several atypical characteristics (such as dynamic range clipping or spatial variance) that warrant caution, though they can also occur in authentic modified photos.';
    } else if (riskLevel === 'inconclusive') {
      evidenceSummary =
        'Image resolution or file size is too low to reliably measure sensor noise patterns. Evidence is inconclusive.';
    } else {
      evidenceSummary =
        'Measured statistical metrics, spatial distribution, and compression characteristics fall largely within typical ranges. No strong anomalies detected.';
    }

    const recommendations = [
      'Cross-check the image on reverse-image search engines (Google Images, TinEye, Yandex) to locate the earliest known publication.',
      'Inspect contextual details: shadows, reflections, finger anatomy, text legibility, and background symmetry.',
      'Check whether reputable news agencies or primary photographers have published this exact media.',
      'Do not rely solely on automated indicators when determining authenticity.',
    ];

    const disclaimer =
      'TruthLens AI provides experimental media analysis and verification guidance. Its indicators do not prove that media is authentic or AI-generated. Always verify important information with reliable sources.';

    return {
      analysisId,
      timestamp: new Date().toISOString(),
      fileName: file.name,
      fileSizeBytes: file.size,
      fileSizeFormatted: formatFileSize(file.size),
      riskScore: finalRiskScore,
      riskLevel,
      riskLabel,
      measurementConfidence: confidenceAssessment.confidence,
      confidenceRationale: confidenceAssessment.rationale,
      indicators,
      metrics,
      evidenceSummary,
      whatThisMeans:
        riskLevel === 'elevated'
          ? 'The analysis identified multiple forensic characteristics that deviate from typical photographic baselines. While not definitive proof of AI generation, this media warrants careful verification before trusting or sharing.'
          : riskLevel === 'moderate'
          ? 'Some forensic characteristics deviate mildly from reference baselines. These can stem from compression, post-processing filters, or partial synthetic manipulation.'
          : riskLevel === 'inconclusive'
          ? 'Due to constrained resolution or low sampling fidelity, forensic indicators could not be measured with high confidence.'
          : 'Forensic indicators did not reveal prominent synthetic generation artifacts. However, sophisticated synthetic media or subtle edits may evade client-side heuristics.',
      recommendations,
      disclaimer,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
};

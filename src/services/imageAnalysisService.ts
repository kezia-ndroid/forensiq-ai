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
import { DISCLAIMER_TEXT } from '../utils/constants';
import { formatFileSize } from '../utils/mediaValidation';

const MAX_ANALYSIS_DIMENSION = 1920; // Bound canvas size to avoid browser memory pressure

const clampScore = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const pointsAbove = (value: number, threshold: number, scale: number, max: number): number =>
  clampScore((value - threshold) * scale, 0, max);

const pointsBelow = (value: number, threshold: number, scale: number, max: number): number =>
  clampScore((threshold - value) * scale, 0, max);

export interface ImageIndicatorIndexInput {
  spatialVarianceRatio: number;
  spatialNoiseVariance: number;
  meanGradient: number;
  edgeDensityPct: number;
  dynamicRangeClippingPct: number;
  rmsContrast: number;
  luminanceMean: number;
  channelDiscrepancy: number;
  meanSaturationPct: number;
  compressionDelta: number;
  compressionApplicable: boolean;
  hasGenerativeSoftwareTags: boolean;
  aspectDecimal: number;
  bytesPerPixel: number;
  sourceFormat: 'jpeg' | 'png' | 'webp' | 'unknown';
  megapixels: number;
}

export interface ImageIndicatorIndexBreakdown {
  score: number;
  spatialInconsistency: number;
  textureSmoothing: number;
  oversmoothing: number;
  edgeDeficit: number;
  clipping: number;
  lowContrast: number;
  lowChroma: number;
  extremeLuminance: number;
  packing: number;
  extremeAspect: number;
  compression: number;
  generative: number;
}

/**
 * Deterministic Indicator Index from measured metrics only.
 * Each signal is independently capped so one weak measurement cannot dominate.
 * Common dimensions, filenames, missing EXIF, and inapplicable compression add 0.
 */
export const computeImageIndicatorIndex = (
  input: ImageIndicatorIndexInput
): ImageIndicatorIndexBreakdown => {
  const spatialInconsistency = pointsAbove(input.spatialVarianceRatio, 3.8, 2.1, 16);

  const textureSmoothing =
    input.spatialNoiseVariance < 10 ? pointsBelow(input.spatialNoiseVariance, 10, 0.45, 6) : 0;

  const oversmoothing =
    input.rmsContrast >= 0.13 && input.meanGradient < 9
      ? pointsBelow(input.meanGradient, 9, 1.1, 12)
      : 0;

  const edgeDeficit =
    input.rmsContrast >= 0.14 && input.edgeDensityPct < 7
      ? pointsBelow(input.edgeDensityPct, 7, 1.15, 10)
      : 0;

  const clipping = pointsAbove(input.dynamicRangeClippingPct, 8, 0.55, 10);
  const lowContrast = input.rmsContrast < 0.07 ? pointsBelow(input.rmsContrast, 0.07, 90, 8) : 0;

  const lowChroma =
    input.channelDiscrepancy < 3.5 && input.meanSaturationPct < 12
      ? pointsBelow(input.channelDiscrepancy, 3.5, 1.4, 6)
      : 0;

  const extremeLuminance =
    input.luminanceMean < 22
      ? pointsBelow(input.luminanceMean, 22, 0.22, 5)
      : input.luminanceMean > 235
        ? pointsAbove(input.luminanceMean, 235, 0.28, 5)
        : 0;

  const packing =
    input.sourceFormat === 'jpeg' && input.megapixels >= 0.4 && input.bytesPerPixel < 0.1
      ? pointsBelow(input.bytesPerPixel, 0.1, 45, 6)
      : 0;

  const aspect = input.aspectDecimal >= 1 ? input.aspectDecimal : 1 / Math.max(input.aspectDecimal, 0.01);
  const extremeAspect = aspect > 6 ? pointsAbove(aspect, 6, 1.2, 4) : 0;

  const compression =
    input.compressionApplicable
      ? pointsAbove(input.compressionDelta, 6.5, 1.15, 10)
      : 0;

  const generative = input.hasGenerativeSoftwareTags ? 28 : 0;

  const raw =
    spatialInconsistency +
    textureSmoothing +
    oversmoothing +
    edgeDeficit +
    clipping +
    lowContrast +
    lowChroma +
    extremeLuminance +
    packing +
    extremeAspect +
    compression +
    generative;

  return {
    score: Math.round(clampScore(raw, 0, 95)),
    spatialInconsistency: Math.round(spatialInconsistency),
    textureSmoothing: Math.round(textureSmoothing),
    oversmoothing: Math.round(oversmoothing),
    edgeDeficit: Math.round(edgeDeficit),
    clipping: Math.round(clipping),
    lowContrast: Math.round(lowContrast),
    lowChroma: Math.round(lowChroma),
    extremeLuminance: Math.round(extremeLuminance),
    packing: Math.round(packing),
    extremeAspect: Math.round(extremeAspect),
    compression: Math.round(compression),
    generative,
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
    const compressionResult = await calculateExperimentalRecompressionDelta(
      canvas,
      ctx,
      renderWidth,
      renderHeight,
      headerResult.format
    );
    const confidenceAssessment = evaluateMeasurementConfidence(originalWidth, originalHeight, file.size);

    const megapixels = Math.round(((originalWidth * originalHeight) / 1_000_000) * 100) / 100;
    const aspectRatioStr = calculateAspectRatio(originalWidth, originalHeight);
    const aspectDecimal = originalHeight > 0 ? originalWidth / originalHeight : 1;
    const bytesPerPixel =
      originalWidth > 0 && originalHeight > 0
        ? Math.round((file.size / (originalWidth * originalHeight)) * 1000) / 1000
        : 0;
    const analysisCopyLabel =
      renderWidth !== originalWidth || renderHeight !== originalHeight
        ? `${renderWidth}x${renderHeight} (analysis copy)`
        : `${renderWidth}x${renderHeight} (analysis copy, native scale)`;
    const analysisId = `img_${file.size}_${originalWidth}x${originalHeight}_${Math.round(startTime)}`;

    // 4. Assemble Measurable Metrics (original file for size/header/dimensions; copy for pixels)
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
      meanSaturationPct: colorResult.meanSaturationPct,
      dynamicRangeClippingPct: lumResult.dynamicRangeClippingPct,
      spatialNoiseVariance: spatialResult.overallVariance,
      spatialVarianceDiscrepancy: spatialResult.varianceRatio,
      meanGradient: spatialResult.meanGradient,
      edgeDensityPct: spatialResult.edgeDensityPct,
      bytesPerPixel,
      sourceFormat: headerResult.format,
      experimentalCompressionDelta: compressionResult.isApplicable
        ? compressionResult.compressionDelta
        : undefined,
      compressionMetricApplicable: compressionResult.isApplicable,
      analysisResolution: analysisCopyLabel,
      analysisDurationMs: Math.round(performance.now() - startTime),
    };

    // 5. Evaluate Indicators and Conservative Indicator Index from measured metrics
    const indexBreakdown = computeImageIndicatorIndex({
      spatialVarianceRatio: spatialResult.varianceRatio,
      spatialNoiseVariance: spatialResult.overallVariance,
      meanGradient: spatialResult.meanGradient,
      edgeDensityPct: spatialResult.edgeDensityPct,
      dynamicRangeClippingPct: lumResult.dynamicRangeClippingPct,
      rmsContrast: lumResult.rmsContrast,
      luminanceMean: lumResult.meanLuminance,
      channelDiscrepancy: colorResult.channelDiscrepancy,
      meanSaturationPct: colorResult.meanSaturationPct,
      compressionDelta: compressionResult.compressionDelta,
      compressionApplicable: compressionResult.isApplicable,
      hasGenerativeSoftwareTags: Boolean(headerResult.detectedSoftware && headerResult.detectedSoftware.length > 0),
      aspectDecimal,
      bytesPerPixel,
      sourceFormat: headerResult.format,
      megapixels,
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
        description:
          'Observed characteristic: textual parameters or diffusion workflow chunks were identified in the file header. This is a potential indicator of a generative toolchain and needs verification; tags can also be injected or stripped.',
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
        weightContribution: 0,
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
    const spatialWeight = indexBreakdown.spatialInconsistency;
    if (indexBreakdown.spatialInconsistency > 0) {
      indicators.push({
        id: 'spatial_noise_inconsistency',
        category: 'spatial_consistency',
        title: 'Elevated Spatial Texture Discrepancy',
        severity: indexBreakdown.spatialInconsistency >= 8 ? 'caution' : 'info',
        observedValue: `${spatialResult.varianceRatio.toFixed(1)}:1 regional ratio`,
        description:
          'Observed characteristic: high-frequency texture variance differs substantially between image regions. This is a potential indicator of selective smoothing, compositing, or uneven processing — it needs verification against scene content such as bokeh.',
        limitationNote: 'Legitimate photographic depth of field or mixed indoor/outdoor lighting naturally causes regional variance.',
        weightContribution: spatialWeight,
      });
    } else {
      indicators.push({
        id: 'spatial_noise_uniform',
        category: 'spatial_consistency',
        title: 'Regional Texture Distribution (Measured)',
        severity: 'info',
        observedValue: `${spatialResult.varianceRatio.toFixed(1)}:1 regional ratio`,
        description:
          'Observed characteristic: high-frequency gradient energy is relatively consistent across quadrants. Uniform texture is common in authentic photographs and does not raise the Indicator Index by itself.',
        limitationNote: 'Uniform noise can occur naturally or be introduced by post-processing filters.',
        weightContribution: 0,
      });
    }

    const highFrequencyWeight =
      indexBreakdown.oversmoothing + indexBreakdown.edgeDeficit + indexBreakdown.textureSmoothing;
    if (highFrequencyWeight > 0) {
      indicators.push({
        id: 'spatial_edge_energy',
        category: 'spatial_consistency',
        title: 'Low High-Frequency / Edge Energy Relative to Contrast',
        severity: highFrequencyWeight >= 10 ? 'caution' : 'info',
        observedValue: `Gradient ${spatialResult.meanGradient.toFixed(2)}, edge density ${spatialResult.edgeDensityPct.toFixed(1)}%, noise var ${spatialResult.overallVariance.toFixed(1)}`,
        description:
          'Observed characteristic: local edge energy or high-frequency variance is low compared with measured luminance contrast. This is a potential indicator of smoothing, upscaling, or flattened texture and needs verification.',
        limitationNote: 'Fog, shallow depth of field, and beauty filters produce similar edge suppression in authentic photos.',
        weightContribution: highFrequencyWeight,
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
        description:
          'Observed characteristic: an elevated share of pixels are pinned at pure white or pure black. This is a potential indicator of aggressive tone mapping or graphic compositing and needs verification.',
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
        description:
          'Observed characteristic: a measurable share of pixels sit at luminance extremes. Clipping is included only when it exceeds a conservative threshold.',
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
        description:
          'Observed characteristic: RMS luminance contrast is unusually narrow. This can appear in washed shading, heavy haze, or some synthetic palettes and needs verification.',
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
        description:
          'Observed characteristic: measured RMS contrast contributed a small, capped amount to the Indicator Index.',
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
        observedValue: `RGB spread ${colorResult.channelDiscrepancy.toFixed(1)}, saturation ${colorResult.meanSaturationPct.toFixed(1)}%`,
        description:
          'Observed characteristic: inter-channel color divergence and saturation are both low (neutral/desaturated palette). This is a weak potential indicator and needs verification.',
        limitationNote: 'Grayscale conversion, tungsten lighting, and many authentic photos also exhibit low channel spread.',
        weightContribution: indexBreakdown.lowChroma,
      });
    }

    if (indexBreakdown.extremeLuminance > 0) {
      indicators.push({
        id: 'pixel_extreme_luminance',
        category: 'pixel_statistics',
        title: 'Extreme Mean Luminance',
        severity: 'info',
        observedValue: `Mean ${lumResult.meanLuminance.toFixed(1)} / 255`,
        description:
          'Observed characteristic: average luminance sits near black or near white. Treated as a weak photometric signal, not proof of origin.',
        limitationNote: 'Night photography, snow scenes, and studio backdrops commonly produce extreme means.',
        weightContribution: indexBreakdown.extremeLuminance,
      });
    }

    // Indicator E: Experimental Recompression Difference (JPEG only)
    if (!compressionResult.isApplicable) {
      indicators.push({
        id: 'compression_not_applicable',
        category: 'experimental_compression',
        title: 'Recompression Difference Not Applied',
        severity: 'info',
        observedValue: `${headerResult.format.toUpperCase()} source`,
        description:
          'Experimental JPEG recompression comparison is not applied to this container. Re-encoding PNG or WebP to JPEG is not a technically reliable comparison.',
        limitationNote: 'Only original JPEG bitstreams are scored on this experimental metric.',
        weightContribution: 0,
      });
    } else if (indexBreakdown.compression > 0) {
      indicators.push({
        id: 'compression_recompression_delta',
        category: 'experimental_compression',
        title: 'Elevated Recompression Residual (Experimental)',
        severity: indexBreakdown.compression >= 6 ? 'caution' : 'info',
        observedValue: `Delta ${compressionResult.compressionDelta.toFixed(2)}`,
        description:
          'Observed characteristic: a second JPEG encode produced larger-than-typical residuals. This is a potential compression-history indicator and needs verification.',
        limitationNote: 'Experimental client-side metric. Multiple re-saves can elevate this value on authentic photos.',
        weightContribution: indexBreakdown.compression,
      });
    } else {
      indicators.push({
        id: 'compression_recompression_stable',
        category: 'experimental_compression',
        title: 'Stable JPEG Recompression Residual (Experimental)',
        severity: 'info',
        observedValue: `Delta ${compressionResult.compressionDelta.toFixed(2)}`,
        description:
          'Observed characteristic: secondary JPEG encode residuals stayed below the scoring threshold for this experimental metric.',
        limitationNote: 'Experimental client-side metric for contextual reference only.',
        weightContribution: 0,
      });
    }

    if (indexBreakdown.packing > 0) {
      indicators.push({
        id: 'meta_packing_density',
        category: 'metadata',
        title: 'Low JPEG Bytes-Per-Pixel Packing',
        severity: 'info',
        observedValue: `${bytesPerPixel.toFixed(3)} B/px`,
        description:
          'Observed characteristic: file size is small relative to pixel count on a JPEG. This can reflect heavy recompression and is a weak potential indicator.',
        limitationNote: 'Social networks routinely recompress authentic photographs to similar densities.',
        weightContribution: indexBreakdown.packing,
      });
    }

    if (indexBreakdown.extremeAspect > 0) {
      indicators.push({
        id: 'meta_extreme_aspect',
        category: 'metadata',
        title: 'Extreme Aspect Ratio',
        severity: 'info',
        observedValue: `${originalWidth} × ${originalHeight} (${aspectRatioStr})`,
        description:
          'Observed characteristic: the measured aspect ratio is unusually elongated. Common square or 16:9 sizes are not treated as generative evidence.',
        limitationNote: 'Panoramas, banners, and crops produce extreme ratios in authentic media.',
        weightContribution: indexBreakdown.extremeAspect,
      });
    }

    // Indicator F: Factual Dimension Documentation (common sizes add 0)
    indicators.push({
      id: 'meta_dimensions_factual',
      category: 'metadata',
      title: 'Factual Resolution & Aspect Ratio',
      severity: 'info',
      observedValue: `${originalWidth} × ${originalHeight} (${aspectRatioStr})`,
      description: `Original decoded dimensions measured at ${megapixels} MP. Pixel statistics used a controlled analysis copy at ${analysisCopyLabel}.`,
      limitationNote:
        'Resolution and common generative canvas sizes (for example 1024×1024) do not contribute to the Indicator Index.',
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

    const scoredFactors = indicators
      .filter((item) => item.weightContribution > 0)
      .map((item) => `${item.title} (+${item.weightContribution})`);

    let evidenceSummary = '';
    if (riskLevel === 'inconclusive') {
      evidenceSummary =
        'Measurement reliability is limited by resolution or file size, so the Indicator Index should be treated as incomplete. Needs verification with a higher-quality original.';
    } else if (scoredFactors.length > 0) {
      evidenceSummary = `The Indicator Index (${finalRiskScore}/100) was raised by these measured characteristics: ${scoredFactors.join('; ')}. These are potential indicators, not proof of origin, and need verification.`;
    } else {
      evidenceSummary =
        'No scored anomalies were added from the measured luminance, color, edge, spatial, packing, or header characteristics. Observed values stayed within conservative thresholds. This does not prove the image is authentic.';
    }

    const recommendations = [
      'Cross-check the image on reverse-image search engines (Google Images, TinEye, Yandex) to locate the earliest known publication.',
      'Inspect contextual details: shadows, reflections, finger anatomy, text legibility, and background symmetry.',
      'Check whether reputable news agencies or primary photographers have published this exact media.',
      'Do not rely solely on automated indicators when determining authenticity.',
    ];

    const disclaimer = DISCLAIMER_TEXT;

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
          ? 'Several observed characteristics sit outside conservative photographic thresholds. This is not a determination that the image is AI-generated. Treat the findings as potential indicators and verify provenance before trusting or sharing.'
          : riskLevel === 'moderate'
          ? 'Some observed characteristics deviate from typical ranges. Compression, grading, or capture conditions can produce the same measurements. Needs verification; not a claim of synthetic origin.'
          : riskLevel === 'inconclusive'
          ? 'Sampling fidelity was too limited for a reliable reading. Confidence here describes measurement quality, not likelihood of AI generation.'
          : 'Measured characteristics did not accumulate a high Indicator Index. Sophisticated synthetic media can still look ordinary under client-side heuristics, so this is not a claim that the image is real.',
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

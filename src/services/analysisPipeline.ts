/**
 * TruthLens AI - Master Analysis Pipeline Coordinator
 * 
 * Orchestrates multi-modal media analysis:
 * 1. File / URL Ingestion
 * 2. Media Type Routing (Image / Audio / Video)
 * 3. Client-Side Forensic Execution
 * 4. Context & Source Verification (if URL provided)
 * 5. GenAI / Local Heuristic Explanation Synthesis
 * 6. Unified Report Assembly
 */

import { MediaType } from '../types';
import { ImageAnalysisResult } from '../types/imageAnalysis';
import { AudioAnalysisResult } from '../types/audioAnalysis';
import { VideoAnalysisResult } from '../types/videoAnalysis';
import {
  UnifiedAnalysisReport,
  UnifiedForensicIndicator,
} from '../types/unifiedAnalysis';
import { analyzeImage } from './imageAnalysisService';
import { analyzeAudio } from './audioAnalysisService';
import { analyzeVideo } from './videoAnalysisService';
import { generateForensicExplanation } from './aiExplanationService';
import { verifySourceUrl } from './sourceVerificationService';
import { detectMediaType, formatFileSize } from '../utils/mediaValidation';

export interface RunAnalysisOptions {
  file?: File;
  mediaUrl?: string;
  onProgress?: (stepMessage: string) => void;
}

export const runTruthLensAnalysis = async (
  options: RunAnalysisOptions
): Promise<UnifiedAnalysisReport> => {
  const { file, mediaUrl, onProgress } = options;

  if (!file && !mediaUrl) {
    throw new Error('Please select a media file or provide a valid media URL to analyze.');
  }

  const id = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let targetFile: File | undefined = file;

  // If only URL is provided, try safe CORS fetch to obtain media file
  if (!targetFile && mediaUrl) {
    onProgress?.('Inspecting remote media URL and source headers...');
    try {
      const resp = await fetch(mediaUrl, { mode: 'cors' });
      if (resp.ok) {
        const blob = await resp.blob();
        const urlFilename = mediaUrl.split('/').pop()?.split('#')[0].split('?')[0] || 'remote_media';
        targetFile = new File([blob], urlFilename, { type: blob.type });
      }
    } catch {
      // CORS prevented binary download — handled gracefully downstream
    }
  }

  // Source Verification check if URL provided
  let sourceVerificationDetails = undefined;
  if (mediaUrl) {
    onProgress?.('Verifying source domain and provenance indicators...');
    try {
      sourceVerificationDetails = await verifySourceUrl(mediaUrl);
    } catch {
      // Ignore URL error
    }
  }

  // If no file could be analyzed (e.g. CORS blocked URL fetch and no local upload)
  if (!targetFile) {
    if (sourceVerificationDetails) {
      onProgress?.('Synthesizing source verification report...');
      const explanation = await generateForensicExplanation({
        mediaType: 'image',
        fileName: mediaUrl || 'Remote Web Media',
        riskScore: 35,
        riskLevel: 'moderate',
        riskLabel: 'Needs Source Verification',
        measurementConfidence: 'low',
        confidenceRationale:
          'Media binary could not be fetched due to browser CORS policies. Analysis is limited to domain and context evaluation.',
        indicators: [
          {
            id: 'cors_blocked',
            title: 'Direct Media Fetch Restricted',
            category: 'source',
            severity: 'caution',
            observedValue: 'CORS Restricted',
            description:
              'The media host prevents direct client-side binary extraction. Please download the file to inspect full pixel/acoustic signals.',
            limitationNote: 'Standard browser security model for cross-origin resources.',
            weightContribution: 10,
          },
        ],
        summaryMetrics: [
          { label: 'Domain Host', value: sourceVerificationDetails.hostname },
          { label: 'Security', value: sourceVerificationDetails.isHttpsSecure ? 'HTTPS Valid' : 'Insecure HTTP' },
          { label: 'Category', value: sourceVerificationDetails.domainCategoryLabel },
        ],
        sourceHostname: sourceVerificationDetails.hostname,
      });

      return {
        id,
        mediaType: 'image',
        fileName: mediaUrl || 'Remote URL Media',
        fileSizeFormatted: 'Remote Stream',
        fileSizeBytes: 0,
        previewUrl: mediaUrl || '',
        timestamp: new Date().toISOString(),
        riskScore: 35,
        riskLevel: 'moderate',
        riskLabel: 'Needs Source Verification',
        measurementConfidence: 'low',
        confidenceRationale:
          'Browser CORS constraints prevent direct binary inspection. Download the file locally for pixel-level forensic measurements.',
        evidenceSummary:
          'Remote domain inspected. Direct media binary could not be analyzed locally due to host CORS configuration.',
        recommendations: [
          'Download the media file directly and re-upload to TruthLens for full signal inspection.',
          'Use the external reverse search links below to find the earliest publication.',
          'Check independent news agencies before sharing.',
        ],
        disclaimer:
          'TruthLens AI provides experimental media analysis and verification guidance. Its indicators do not prove that media is authentic or AI-generated. Always verify important information with reliable sources.',
        indicators: [
          {
            id: 'url_source_evaluated',
            title: 'Source Domain Profiling',
            category: 'Domain Context',
            severity: 'info',
            observedValue: sourceVerificationDetails.domainCategoryLabel,
            description: `Media hosted at ${sourceVerificationDetails.hostname}.`,
            limitationNote: 'Domain classification does not verify individual asset authenticity.',
            weightContribution: 0,
          },
        ],
        summaryMetrics: [
          { label: 'Source Hostname', value: sourceVerificationDetails.hostname },
          { label: 'Domain Profile', value: sourceVerificationDetails.domainCategoryLabel },
          { label: 'Connection', value: sourceVerificationDetails.isHttpsSecure ? 'Encrypted (HTTPS)' : 'Unencrypted (HTTP)' },
        ],
        explanation,
        sourceVerification: sourceVerificationDetails,
      };
    }
    throw new Error('No inspectable media file could be loaded.');
  }

  // Detect media category
  const mediaType: MediaType = detectMediaType(targetFile) || 'image';
  const previewUrl = URL.createObjectURL(targetFile);

  let imageResult: ImageAnalysisResult | undefined;
  let audioResult: AudioAnalysisResult | undefined;
  let videoResult: VideoAnalysisResult | undefined;

  let riskScore = 15;
  let riskLevel: UnifiedAnalysisReport['riskLevel'] = 'low';
  let riskLabel = 'Low Indicator Level';
  let measurementConfidence: UnifiedAnalysisReport['measurementConfidence'] = 'high';
  let confidenceRationale = '';
  let evidenceSummary = '';
  let recommendations: string[] = [];
  let disclaimer = '';

  const indicators: UnifiedForensicIndicator[] = [];
  const summaryMetrics: { label: string; value: string; hint?: string }[] = [];

  // Execute Forensic Engine
  if (mediaType === 'image') {
    onProgress?.('Scanning image pixels, spatial noise, and binary headers...');
    imageResult = await analyzeImage(targetFile);

    riskScore = imageResult.riskScore;
    riskLevel = imageResult.riskLevel;
    riskLabel = imageResult.riskLabel;
    measurementConfidence = imageResult.measurementConfidence;
    confidenceRationale = imageResult.confidenceRationale;
    evidenceSummary = imageResult.evidenceSummary;
    recommendations = imageResult.recommendations;
    disclaimer = imageResult.disclaimer;

    imageResult.indicators.forEach((ind) => {
      indicators.push({
        id: ind.id,
        title: ind.title,
        category: ind.category,
        severity: ind.severity,
        observedValue: ind.observedValue,
        description: ind.description,
        limitationNote: ind.limitationNote,
        weightContribution: ind.weightContribution,
      });
    });

    summaryMetrics.push(
      { label: 'Dimensions', value: `${imageResult.metrics.originalWidth} × ${imageResult.metrics.originalHeight}` },
      { label: 'Aspect Ratio', value: imageResult.metrics.aspectRatio },
      { label: 'Megapixels', value: `${imageResult.metrics.megapixels} MP` },
      { label: 'File Size', value: imageResult.metrics.fileSizeFormatted },
      { label: 'EXIF Metadata', value: imageResult.metrics.hasExifMetadata ? 'Detected' : 'Standard Web (None)' },
      { label: 'Luminance Mean', value: `${imageResult.metrics.luminanceMean} / 255` },
      { label: 'RMS Contrast', value: `${imageResult.metrics.contrastRms}` },
      { label: 'Noise Discrepancy', value: `${imageResult.metrics.spatialVarianceDiscrepancy}:1` }
    );
    if (imageResult.metrics.experimentalCompressionDelta !== undefined) {
      summaryMetrics.push({
        label: 'Recompression Delta (Exp.)',
        value: `${imageResult.metrics.experimentalCompressionDelta}`,
      });
    }
  } else if (mediaType === 'audio') {
    onProgress?.('Decoding acoustic waveform, dynamics, and frequency spectrum...');
    audioResult = await analyzeAudio(targetFile);

    riskScore = audioResult.riskScore;
    riskLevel = audioResult.riskLevel;
    riskLabel = audioResult.riskLabel;
    measurementConfidence = audioResult.measurementConfidence;
    confidenceRationale = audioResult.confidenceRationale;
    evidenceSummary = audioResult.evidenceSummary;
    recommendations = audioResult.recommendations;
    disclaimer = audioResult.disclaimer;

    audioResult.indicators.forEach((ind) => {
      indicators.push({
        id: ind.id,
        title: ind.title,
        category: ind.category,
        severity: ind.severity,
        observedValue: ind.observedValue,
        description: ind.description,
        limitationNote: ind.limitationNote,
        weightContribution: ind.weightContribution,
      });
    });

    summaryMetrics.push(
      { label: 'Duration', value: audioResult.metrics.durationFormatted },
      { label: 'Sample Rate', value: `${audioResult.metrics.sampleRate} Hz` },
      { label: 'Channels', value: audioResult.metrics.channelMode },
      { label: 'RMS Power', value: `${audioResult.metrics.rmsLevelDb} dBFS` },
      { label: 'Peak Level', value: `${audioResult.metrics.peakAmplitude}` },
      { label: 'Silence Ratio', value: `${audioResult.metrics.silenceRatioPct}%` },
      { label: 'Clipped Samples', value: `${audioResult.metrics.clippedSamplesPct}%` }
    );
    if (audioResult.metrics.estimatedCutoffFrequencyHz) {
      summaryMetrics.push({
        label: 'Upper Cutoff Freq',
        value: `~${audioResult.metrics.estimatedCutoffFrequencyHz} Hz`,
      });
    }
  } else if (mediaType === 'video') {
    onProgress?.('Sampling video timeline frames and computing temporal continuity...');
    videoResult = await analyzeVideo(targetFile);

    riskScore = videoResult.riskScore;
    riskLevel = videoResult.riskLevel;
    riskLabel = videoResult.riskLabel;
    measurementConfidence = videoResult.measurementConfidence;
    confidenceRationale = videoResult.confidenceRationale;
    evidenceSummary = videoResult.evidenceSummary;
    recommendations = videoResult.recommendations;
    disclaimer = videoResult.disclaimer;

    videoResult.indicators.forEach((ind) => {
      indicators.push({
        id: ind.id,
        title: ind.title,
        category: ind.category,
        severity: ind.severity,
        observedValue: ind.observedValue,
        description: ind.description,
        limitationNote: ind.limitationNote,
        weightContribution: ind.weightContribution,
      });
    });

    summaryMetrics.push(
      { label: 'Duration', value: videoResult.metrics.durationFormatted },
      { label: 'Resolution', value: `${videoResult.metrics.width} × ${videoResult.metrics.height}` },
      { label: 'Aspect Ratio', value: videoResult.metrics.aspectRatio },
      { label: 'Sampled Frames', value: `${videoResult.metrics.sampledFrameCount} frames` },
      { label: 'Inter-Frame Delta', value: `${videoResult.metrics.interFrameDifferenceMean} / 255` },
      { label: 'Luminance Flicker', value: `Var ${videoResult.metrics.luminanceFlickerVariance}` },
      { label: 'Scene Cuts', value: `${videoResult.metrics.sceneCutCount}` }
    );
  }

  // GenAI / Local Heuristic Explanation
  onProgress?.('Synthesizing structured forensic explanation and next steps...');
  const explanation = await generateForensicExplanation({
    mediaType,
    fileName: targetFile.name,
    riskScore,
    riskLevel,
    riskLabel,
    measurementConfidence,
    confidenceRationale,
    indicators,
    summaryMetrics,
    sourceHostname: sourceVerificationDetails?.hostname,
  });

  return {
    id,
    mediaType,
    fileName: targetFile.name,
    fileSizeFormatted: formatFileSize(targetFile.size),
    fileSizeBytes: targetFile.size,
    previewUrl,
    timestamp: new Date().toISOString(),
    riskScore,
    riskLevel,
    riskLabel,
    measurementConfidence,
    confidenceRationale,
    evidenceSummary,
    recommendations,
    disclaimer,
    imageResult,
    audioResult,
    videoResult,
    indicators,
    summaryMetrics,
    explanation,
    sourceVerification: sourceVerificationDetails,
  };
};

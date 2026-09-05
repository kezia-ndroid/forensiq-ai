/**
 * TruthLens AI - Video Analysis Service
 * 
 * Implements client-side empirical video analysis for:
 * - MP4
 * - MOV
 * - WEBM
 * 
 * Uses HTML5 Video element and Canvas API for controlled frame sampling.
 * Strict ethical safeguards:
 * - Samples representative frames to prevent memory strain (< 12 frames)
 * - Factual resolution metadata does not penalize score
 * - Analyzes temporal luminance flicker, inter-frame difference, and edge stability
 * - Explains limitations clearly: never claims definitive deepfake detection
 */

import { MeasurementConfidence, RiskLevel } from '../types/imageAnalysis';
import {
  SampledFrameMetrics,
  VideoAnalysisResult,
  VideoForensicMetrics,
  VideoIndicator,
} from '../types/videoAnalysis';
import { calculateAspectRatio } from '../utils/imageForensics';
import { formatFileSize } from '../utils/mediaValidation';

export class VideoAnalysisError extends Error {
  constructor(message: string, public readonly code: string = 'VIDEO_ANALYSIS_ERROR') {
    super(message);
    this.name = 'VideoAnalysisError';
  }
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Analyzes a video file entirely in the browser using frame sampling.
 */
export const analyzeVideo = async (file: File): Promise<VideoAnalysisResult> => {
  const startTime = performance.now();
  const analysisId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (!file) {
    throw new VideoAnalysisError('No video file provided for analysis.', 'MISSING_FILE');
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;

  const cleanup = () => {
    video.src = '';
    video.load();
    URL.revokeObjectURL(objectUrl);
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  };

  try {
    // 1. Wait for video metadata
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new VideoAnalysisError('Video metadata loading timed out. Codec may be unsupported.', 'TIMEOUT'));
      }, 12000);

      video.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        cleanup();
        reject(
          new VideoAnalysisError(
            'Unable to decode video. The file container or codec is not supported by your browser.',
            'DECODE_ERROR'
          )
        );
      };

      video.src = objectUrl;
    });

    const durationSeconds = video.duration;
    const originalWidth = video.videoWidth;
    const originalHeight = video.videoHeight;

    if (!durationSeconds || isNaN(durationSeconds) || durationSeconds < 0.1) {
      throw new VideoAnalysisError('Video duration is too brief for temporal analysis (< 0.1s).', 'DURATION_TOO_SHORT');
    }

    if (!originalWidth || !originalHeight) {
      throw new VideoAnalysisError('Could not obtain valid video dimensions.', 'INVALID_DIMENSIONS');
    }

    const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);
    const megapixelsPerFrame = Math.round(((originalWidth * originalHeight) / 1_000_000) * 100) / 100;

    // 2. Setup scaled analysis canvas to sample frames quickly without memory bloat
    const MAX_PROXY_DIM = 640;
    let proxyW = originalWidth;
    let proxyH = originalHeight;
    if (proxyW > MAX_PROXY_DIM || proxyH > MAX_PROXY_DIM) {
      if (proxyW >= proxyH) {
        proxyH = Math.round((proxyH * MAX_PROXY_DIM) / proxyW);
        proxyW = MAX_PROXY_DIM;
      } else {
        proxyW = Math.round((proxyW * MAX_PROXY_DIM) / proxyH);
        proxyH = MAX_PROXY_DIM;
      }
    }

    canvas = document.createElement('canvas');
    canvas.width = proxyW;
    canvas.height = proxyH;
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new VideoAnalysisError('Failed to initialize 2D canvas context for video frame analysis.', 'CANVAS_ERROR');
    }

    // 3. Determine frame sampling timestamps (between 6 and 10 frames)
    let targetFramesCount = 8;
    if (durationSeconds < 2) targetFramesCount = 5;
    else if (durationSeconds > 60) targetFramesCount = 10;

    const sampleIntervalSeconds = durationSeconds / (targetFramesCount + 1);
    const frameTimestamps: number[] = [];
    for (let i = 1; i <= targetFramesCount; i++) {
      frameTimestamps.push(Math.min(i * sampleIntervalSeconds, durationSeconds - 0.05));
    }

    // 4. Sample and inspect frames sequentially
    const frameMetricsList: SampledFrameMetrics[] = [];
    const interFrameDifferences: number[] = [];
    let prevFrameData: Uint8ClampedArray | null = null;
    let sceneCutCount = 0;

    for (let i = 0; i < frameTimestamps.length; i++) {
      const ts = frameTimestamps[i];

      // Seek video to timestamp
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = ts;
      });

      // Draw current frame
      ctx.drawImage(video, 0, 0, proxyW, proxyH);
      const frameImageData = ctx.getImageData(0, 0, proxyW, proxyH);
      const pixels = frameImageData.data;
      const numPixels = pixels.length / 4;

      // Compute frame luminance and simple edge density
      let sumLum = 0;
      let edgeSum = 0;

      for (let p = 0; p < pixels.length; p += 4) {
        const r = pixels[p];
        const g = pixels[p + 1];
        const b = pixels[p + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        sumLum += lum;

        // Sample horizontal edge gradient every 4 pixels
        if (p + 8 < pixels.length && (p / 4) % proxyW < proxyW - 1) {
          const rNext = pixels[p + 4];
          const gNext = pixels[p + 5];
          const bNext = pixels[p + 6];
          const lumNext = 0.299 * rNext + 0.587 * gNext + 0.114 * bNext;
          edgeSum += Math.abs(lumNext - lum);
        }
      }

      const meanLuminance = sumLum / numPixels;

      // Calculate RMS contrast
      let varianceSum = 0;
      for (let p = 0; p < pixels.length; p += 8) {
        const lum = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
        const diff = lum - meanLuminance;
        varianceSum += diff * diff;
      }
      const rmsContrast = Math.sqrt(varianceSum / (numPixels / 2)) / 255;
      const edgeDensity = Math.round((edgeSum / (numPixels / 2)) * 10) / 10;

      frameMetricsList.push({
        frameIndex: i + 1,
        timestampSeconds: Math.round(ts * 10) / 10,
        meanLuminance: Math.round(meanLuminance * 10) / 10,
        rmsContrast: Math.round(rmsContrast * 100) / 100,
        edgeDensity,
      });

      // Calculate inter-frame difference with previous frame
      if (prevFrameData) {
        let diffSum = 0;
        const step = 8;
        let count = 0;

        for (let p = 0; p < pixels.length; p += step * 4) {
          const dR = Math.abs(pixels[p] - prevFrameData[p]);
          const dG = Math.abs(pixels[p + 1] - prevFrameData[p + 1]);
          const dB = Math.abs(pixels[p + 2] - prevFrameData[p + 2]);
          diffSum += (dR + dG + dB) / 3;
          count++;
        }

        const avgDiff = count > 0 ? diffSum / count : 0;
        interFrameDifferences.push(avgDiff);

        if (avgDiff > 42.0) {
          sceneCutCount++;
        }
      }

      // Keep copy of pixel data for next comparison
      prevFrameData = new Uint8ClampedArray(pixels);
    }

    // 5. Aggregate temporal statistics
    const interFrameDiffMean =
      interFrameDifferences.length > 0
        ? Math.round((interFrameDifferences.reduce((a, b) => a + b, 0) / interFrameDifferences.length) * 10) / 10
        : 0;

    const interFrameDiffMax =
      interFrameDifferences.length > 0
        ? Math.round(Math.max(...interFrameDifferences) * 10) / 10
        : 0;

    // Luminance flicker variance across sampled frames
    const meanOverallLum =
      frameMetricsList.reduce((acc, f) => acc + f.meanLuminance, 0) / frameMetricsList.length;
    const lumVariance =
      frameMetricsList.reduce((acc, f) => acc + (f.meanLuminance - meanOverallLum) ** 2, 0) /
      frameMetricsList.length;

    // Edge stability ratio
    const edgeDensities = frameMetricsList.map((f) => f.edgeDensity).filter((e) => e > 0.5);
    const minEdge = edgeDensities.length > 0 ? Math.min(...edgeDensities) : 1;
    const maxEdge = edgeDensities.length > 0 ? Math.max(...edgeDensities) : 1;
    const edgeStabilityRatio = Math.round((maxEdge / Math.max(minEdge, 0.1)) * 10) / 10;

    // 6. Measurement Confidence Evaluation
    let measurementConfidence: MeasurementConfidence = 'high';
    let confidenceRationale =
      'High measurement reliability. Multi-frame sampling across video timeline provides reliable temporal continuity statistics.';

    if (durationSeconds < 2.0 || frameMetricsList.length < 5) {
      measurementConfidence = 'low';
      confidenceRationale =
        'Video is under 2 seconds, providing very few temporal frame samples to evaluate lighting or facial continuity.';
    } else if (originalWidth < 640 || originalHeight < 360) {
      measurementConfidence = 'moderate';
      confidenceRationale =
        'Moderate reliability. Low native resolution limits fine-grain facial edge texture tracking across frames.';
    }

    // 7. Indicators & Conservative Risk Scoring
    const indicators: VideoIndicator[] = [];
    let cumulativeRisk = 12; // Baseline floor

    // Indicator 1: Luminance Flicker without Scene Cuts
    if (lumVariance > 28.0 && sceneCutCount === 0) {
      indicators.push({
        id: 'vid_flicker_elevated',
        category: 'lighting_flicker',
        title: 'Elevated Temporal Luminance Flicker',
        severity: 'caution',
        observedValue: `Variance ${lumVariance.toFixed(1)} across ${frameMetricsList.length} frames (0 cuts)`,
        description:
          'Sampled frames exhibit noticeable brightness fluctuations across a continuous shot, a pattern occasionally observed in frame-by-frame generative synthesis.',
        limitationNote:
          'Strobe lighting, camera auto-exposure hunting, or natural sunlight flicker can produce similar variance.',
        weightContribution: 16,
      });
      cumulativeRisk += 16;
    } else {
      indicators.push({
        id: 'vid_flicker_normal',
        category: 'lighting_flicker',
        title: 'Temporal Lighting Stability',
        severity: 'info',
        observedValue: `Variance ${lumVariance.toFixed(1)} (Stable)`,
        description: 'Luminance levels remain consistent across sampled frame intervals.',
        limitationNote: 'Advanced deepfake pipelines employ temporal smoothing filters to eliminate flicker.',
        weightContribution: 0,
      });
    }

    // Indicator 2: Inter-frame Continuity / Motion Discontinuity
    if (interFrameDiffMean > 35.0 && sceneCutCount <= 1) {
      indicators.push({
        id: 'vid_motion_discontinuity',
        category: 'temporal_consistency',
        title: 'Elevated Inter-Frame Pixel Drift',
        severity: 'caution',
        observedValue: `Mean delta ${interFrameDiffMean.toFixed(1)} / 255`,
        description:
          'High frame-to-frame pixel divergence observed during steady playback without registered scene cuts.',
        limitationNote: 'High-speed camera pans, rapid action scenes, or low frame rate exports elevate this delta legitimately.',
        weightContribution: 12,
      });
      cumulativeRisk += 12;
    } else {
      indicators.push({
        id: 'vid_motion_normal',
        category: 'temporal_consistency',
        title: 'Natural Inter-Frame Continuity',
        severity: 'info',
        observedValue: `Mean delta ${interFrameDiffMean.toFixed(1)} / 255`,
        description: 'Inter-frame pixel variation falls within typical motion video boundaries.',
        limitationNote: 'Low motion scenes naturally show minimal inter-frame change.',
        weightContribution: 0,
      });
    }

    // Indicator 3: Edge & Texture Stability Ratio
    if (edgeStabilityRatio > 4.5 && sceneCutCount === 0) {
      indicators.push({
        id: 'vid_edge_inconsistency',
        category: 'frame_stability',
        title: 'Atypical High-Frequency Texture Disparity',
        severity: 'caution',
        observedValue: `${edgeStabilityRatio}:1 max/min edge ratio`,
        description:
          'Sharpness and high-frequency edge detail fluctuate noticeably between frames in the same sequence.',
        limitationNote: 'Camera autofocus hunting or compression keyframe breathing (GOP pulses) can also alter sharpness.',
        weightContribution: 10,
      });
      cumulativeRisk += 10;
    }

    // Indicator 4: Video Container & Sampling Factual Metadata
    indicators.push({
      id: 'vid_metadata_profile',
      category: 'container_metadata',
      title: 'Video Stream Resolution & Sample Rate',
      severity: 'info',
      observedValue: `${originalWidth} × ${originalHeight} (${aspectRatio}) • ${formatDuration(durationSeconds)}`,
      description: `Inspected ${frameMetricsList.length} temporally distributed frames at ${proxyW}×${proxyH} proxy resolution.`,
      limitationNote: 'Video dimensions and duration are factual metadata and do not contribute to risk scoring.',
      weightContribution: 0,
    });

    // 8. Final Risk Level Calculation
    const finalRiskScore = Math.min(Math.max(Math.round(cumulativeRisk), 5), 88);
    let riskLevel: RiskLevel = 'low';
    let riskLabel = 'Low Indicator Level';

    if (measurementConfidence === 'low' && finalRiskScore < 35) {
      riskLevel = 'inconclusive';
      riskLabel = 'Evidence Inconclusive';
    } else if (finalRiskScore >= 45) {
      riskLevel = 'elevated';
      riskLabel = 'Elevated Risk Indicators';
    } else if (finalRiskScore >= 24) {
      riskLevel = 'moderate';
      riskLabel = 'Moderate Risk Indicators';
    } else {
      riskLevel = 'low';
      riskLabel = 'Low Indicator Level';
    }

    const metrics: VideoForensicMetrics = {
      durationSeconds: Math.round(durationSeconds * 100) / 100,
      durationFormatted: formatDuration(durationSeconds),
      width: originalWidth,
      height: originalHeight,
      aspectRatio,
      megapixelsPerFrame,
      fileSizeBytes: file.size,
      fileSizeFormatted: formatFileSize(file.size),
      mimeType: file.type || 'video/mp4',
      sampledFrameCount: frameMetricsList.length,
      sampleIntervalSeconds: Math.round(sampleIntervalSeconds * 100) / 100,
      interFrameDifferenceMean: interFrameDiffMean,
      interFrameDifferenceMax: interFrameDiffMax,
      luminanceFlickerVariance: Math.round(lumVariance * 10) / 10,
      sceneCutCount,
      edgeStabilityRatio,
      analysisDurationMs: Math.round(performance.now() - startTime),
      analysisResolution: `${proxyW}×${proxyH} (Controlled Proxy)`,
    };

    const evidenceSummary =
      riskLevel === 'elevated'
        ? 'Frame sampling observed elevated temporal fluctuations in lighting or texture continuity. Given that compression and camera motion can contribute, manual context verification is required.'
        : riskLevel === 'moderate'
        ? 'Observed moderate inter-frame dynamics requiring verification. These patterns frequently appear in heavily compressed web clips or fast motion sequences.'
        : riskLevel === 'inconclusive'
        ? 'Video clip duration is too short for reliable temporal analysis.'
        : 'Temporal continuity, inter-frame differences, and lighting stability across sampled frames are consistent with standard recorded video.';

    const recommendations = [
      'Examine facial boundaries, hairline transitions, and ear symmetry during head rotations.',
      'Check whether the speaker’s lip movements correspond accurately with acoustic phonemes (lip-sync alignment).',
      'Look for subtle warp artifacts or ghosting around fast-moving objects.',
      'Locate original video broadcasts or verifiable source footage from reputable outlets.',
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
      measurementConfidence,
      confidenceRationale,
      indicators,
      metrics,
      evidenceSummary,
      whatThisMeans:
        riskLevel === 'elevated'
          ? 'Frame sampling detected characteristics such as lighting flicker or high inter-frame difference across continuous shots. This does not prove video manipulation, but warrants cross-verifying the primary source.'
          : riskLevel === 'moderate'
          ? 'Some temporal metrics deviate slightly from baseline expectations, which may stem from variable bitrate encoding, auto-exposure, or synthetic blending.'
          : riskLevel === 'inconclusive'
          ? 'Diagnostic reliability is restricted by short video duration or limited frame samples.'
          : 'Temporal sampling did not reveal notable synthetic frame anomalies or irregular lighting jitter.',
      recommendations,
      disclaimer,
    };
  } finally {
    cleanup();
  }
};

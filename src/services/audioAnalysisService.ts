/**
 * TruthLens AI - Audio Analysis Service
 * 
 * Implements client-side empirical acoustic analysis for:
 * - MP3
 * - WAV
 * - M4A
 * - OGG
 * 
 * Uses Web Audio API (OfflineAudioContext & AnalyserNode / AudioBuffer processing).
 * Adheres strictly to probabilistic safeguards:
 * - Indicators are labeled as "Potential synthetic-audio indicators"
 * - Confidence represents measurement reliability and sample duration
 * - Never claims definitive proof of voice cloning or deepfake speech
 */

import {
  AudioAnalysisResult,
  AudioForensicMetrics,
  AudioIndicator,
} from '../types/audioAnalysis';
import { MeasurementConfidence, RiskLevel } from '../types/imageAnalysis';
import { formatFileSize } from '../utils/mediaValidation';

export class AudioAnalysisError extends Error {
  constructor(message: string, public readonly code: string = 'AUDIO_ANALYSIS_ERROR') {
    super(message);
    this.name = 'AudioAnalysisError';
  }
}

/**
 * Formats duration in seconds to "MM:SS" or "0:SS"
 */
const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Analyzes an audio file entirely client-side using the Web Audio API.
 */
export const analyzeAudio = async (file: File): Promise<AudioAnalysisResult> => {
  const startTime = performance.now();
  const analysisId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  if (!file) {
    throw new AudioAnalysisError('No audio file provided for analysis.', 'MISSING_FILE');
  }

  // Check browser Web Audio API support
  const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxClass) {
    throw new AudioAnalysisError('Web Audio API is not supported in this browser.', 'UNSUPPORTED_BROWSER_API');
  }

  let audioCtx: AudioContext | null = null;

  try {
    audioCtx = new AudioCtxClass();
    const arrayBuffer = await file.arrayBuffer();

    // Decode audio binary
    let audioBuffer: AudioBuffer;
    try {
      // audioCtx.decodeAudioData consumes or requires arrayBuffer copy
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      throw new AudioAnalysisError(
        'Failed to decode audio track. The file format or codec is not supported by your browser.',
        'DECODE_ERROR'
      );
    }

    const durationSeconds = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const channelMode: 'Mono' | 'Stereo' | 'Multi-channel' =
      numberOfChannels === 1 ? 'Mono' : numberOfChannels === 2 ? 'Stereo' : 'Multi-channel';

    if (durationSeconds <= 0.05) {
      throw new AudioAnalysisError('Audio recording is too brief for forensic measurement (< 0.05s).', 'DURATION_TOO_SHORT');
    }

    // Extract mono or primary channel
    const channelData = audioBuffer.getChannelData(0);
    const totalSamples = channelData.length;

    // --- 1. Amplitude & Dynamics Calculations ---
    let sumSquares = 0;
    let peakAmplitude = 0;
    let clippedCount = 0;

    // Subsample if audio is very long (e.g. > 10 minutes) for instant responsiveness
    const step = totalSamples > 10_000_000 ? Math.ceil(totalSamples / 5_000_000) : 1;
    let sampledCount = 0;

    for (let i = 0; i < totalSamples; i += step) {
      const absVal = Math.abs(channelData[i]);
      sumSquares += absVal * absVal;
      if (absVal > peakAmplitude) peakAmplitude = absVal;
      if (absVal >= 0.999) clippedCount++;
      sampledCount++;
    }

    const rms = Math.sqrt(sumSquares / Math.max(sampledCount, 1));
    const rmsLevelDb = Math.round((20 * Math.log10(Math.max(rms, 1e-6))) * 10) / 10;
    const crestFactorDb = Math.round((20 * Math.log10(Math.max(peakAmplitude, 1e-6) / Math.max(rms, 1e-6))) * 10) / 10;
    const clippedSamplesPct = Math.round(((clippedCount / Math.max(sampledCount, 1)) * 100) * 100) / 100;

    // --- 2. Temporal & Silence Distribution ---
    // Chunk into 50ms windows
    const windowSize = Math.max(Math.floor(sampleRate * 0.05), 1);
    const numWindows = Math.floor(totalSamples / windowSize);
    let silentWindows = 0;
    const silenceThreshold = 0.00316; // Approx -50 dBFS

    // Zero-crossing rate tracking per window
    const zcrPerWindow: number[] = [];

    for (let w = 0; w < numWindows; w++) {
      const start = w * windowSize;
      const end = start + windowSize;
      let windowSumSquares = 0;
      let zeroCrossings = 0;

      for (let i = start; i < end; i++) {
        const val = channelData[i];
        windowSumSquares += val * val;
        if (i > start) {
          const prev = channelData[i - 1];
          if ((val >= 0 && prev < 0) || (val < 0 && prev >= 0)) {
            zeroCrossings++;
          }
        }
      }

      const windowRms = Math.sqrt(windowSumSquares / windowSize);
      if (windowRms < silenceThreshold) {
        silentWindows++;
      }

      const zcr = (zeroCrossings / windowSize) * sampleRate;
      zcrPerWindow.push(zcr);
    }

    const silenceRatioPct =
      numWindows > 0 ? Math.round(((silentWindows / numWindows) * 100) * 10) / 10 : 0;

    // Mean and standard deviation of ZCR
    const zcrMean =
      zcrPerWindow.length > 0
        ? zcrPerWindow.reduce((a, b) => a + b, 0) / zcrPerWindow.length
        : 0;

    const zcrVarianceSum = zcrPerWindow.reduce((sum, v) => sum + (v - zcrMean) * (v - zcrMean), 0);
    const zcrStdDev =
      zcrPerWindow.length > 0 ? Math.sqrt(zcrVarianceSum / zcrPerWindow.length) : 0;

    // --- 3. Spectral Energy & Cutoff Approximation ---
    // Sample a 2048-sample window during an active (non-silent) section
    let activeOffset = Math.floor(totalSamples / 4);
    for (let w = 0; w < Math.min(numWindows, 20); w++) {
      const s = w * windowSize;
      let wRms = 0;
      for (let i = s; i < s + Math.min(windowSize, 512); i++) {
        wRms += channelData[i] * channelData[i];
      }
      if (Math.sqrt(wRms / 512) > silenceThreshold * 2) {
        activeOffset = s;
        break;
      }
    }

    // Discrete Fourier Transform on a 1024-point Hann-windowed segment for spectral centroid & cutoff
    const fftSize = 1024;
    const halfFft = fftSize / 2;
    const magnitudes = new Float32Array(halfFft);
    const nyquist = sampleRate / 2;

    if (activeOffset + fftSize <= totalSamples) {
      for (let k = 0; k < halfFft; k++) {
        let real = 0;
        let imag = 0;
        for (let n = 0; n < fftSize; n++) {
          const sample = channelData[activeOffset + n];
          // Hann window
          const windowWeight = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (fftSize - 1)));
          const windowed = sample * windowWeight;
          const angle = (2 * Math.PI * k * n) / fftSize;
          real += windowed * Math.cos(angle);
          imag -= windowed * Math.sin(angle);
        }
        magnitudes[k] = Math.sqrt(real * real + imag * imag);
      }
    }

    // Spectral centroid
    let numSum = 0;
    let denSum = 0;
    let highFreqEnergy = 0;
    let totalEnergy = 0;
    let cutoffBin = halfFft;

    for (let k = 0; k < halfFft; k++) {
      const freq = (k / halfFft) * nyquist;
      const mag = magnitudes[k];
      numSum += freq * mag;
      denSum += mag;
      totalEnergy += mag;

      if (freq >= 12000) {
        highFreqEnergy += mag;
      }

      // Check for abrupt energy dropoff (cutoff indicator)
      if (mag > 0.001) {
        cutoffBin = k;
      }
    }

    const spectralCentroidHz = denSum > 0 ? Math.round(numSum / denSum) : Math.round(sampleRate / 4);
    const estimatedCutoffFrequencyHz = Math.min(Math.round((cutoffBin / halfFft) * nyquist), Math.round(nyquist));
    const highFrequencyEnergyPct =
      totalEnergy > 0 ? Math.round(((highFreqEnergy / totalEnergy) * 100) * 10) / 10 : 0;

    // --- 4. Assemble Forensic Metrics ---
    const metrics: AudioForensicMetrics = {
      durationSeconds: Math.round(durationSeconds * 100) / 100,
      durationFormatted: formatDuration(durationSeconds),
      fileSizeBytes: file.size,
      fileSizeFormatted: formatFileSize(file.size),
      mimeType: file.type || 'audio/mpeg',
      sampleRate,
      numberOfChannels,
      channelMode,
      rmsLevelDb,
      peakAmplitude: Math.round(peakAmplitude * 1000) / 1000,
      crestFactorDb,
      clippedSamplesPct,
      silenceRatioPct,
      zeroCrossingRateMean: Math.round(zcrMean),
      zeroCrossingRateStdDev: Math.round(zcrStdDev),
      estimatedCutoffFrequencyHz,
      spectralCentroidHz,
      highFrequencyEnergyPct,
      analysisDurationMs: Math.round(performance.now() - startTime),
    };

    // --- 5. Measurement Confidence ---
    let measurementConfidence: MeasurementConfidence = 'high';
    let confidenceRationale =
      'High measurement reliability. Signal length and sample rate afford accurate time-frequency acoustic estimation.';

    if (durationSeconds < 1.2 || file.size < 20_000) {
      measurementConfidence = 'low';
      confidenceRationale =
        'Audio clip duration is under 1.2 seconds, limiting temporal variation and spectral stability analysis.';
    } else if (durationSeconds < 3.5 || sampleRate < 22050) {
      measurementConfidence = 'moderate';
      confidenceRationale =
        'Moderate measurement reliability. Short duration or limited sample rate restricts high-frequency voice harmonic assessment.';
    }

    // --- 6. Indicators & Conservative Risk Scoring ---
    const indicators: AudioIndicator[] = [];
    let cumulativeRisk = 10; // Baseline floor

    // Indicator 1: High Frequency Cutoff / Brickwall
    if (sampleRate >= 44100 && estimatedCutoffFrequencyHz <= 11000) {
      indicators.push({
        id: 'aud_cutoff_low',
        category: 'spectral_characteristics',
        title: 'Premature High-Frequency Brickwall Cutoff',
        severity: 'caution',
        observedValue: `Cutoff at ~${estimatedCutoffFrequencyHz} Hz (Nyquist: ${nyquist} Hz)`,
        description:
          'A sharp spectral attenuation is observed well below the sample rate boundary. Common in certain neural vocoders and aggressive audio codecs.',
        limitationNote:
          'Lossy MP3 encoding at lower bitrates (e.g. 64-96 kbps) also imposes brickwall filters.',
        weightContribution: 18,
      });
      cumulativeRisk += 18;
    } else {
      indicators.push({
        id: 'aud_spectral_spread_normal',
        category: 'spectral_characteristics',
        title: 'Full Frequency Spectrum Bandwidth',
        severity: 'info',
        observedValue: `Upper boundary ~${estimatedCutoffFrequencyHz} Hz`,
        description: 'Spectral energy extends across expected acoustic frequencies for this sample rate.',
        limitationNote: 'High-end TTS vocoders can also render wide bandwidths up to 24 kHz.',
        weightContribution: 0,
      });
    }

    // Indicator 2: Silence & Acoustic Pause Dynamics
    if (silenceRatioPct > 70.0) {
      indicators.push({
        id: 'aud_silence_elevated',
        category: 'temporal_continuity',
        title: 'High Inactive Silence Ratio',
        severity: 'info',
        observedValue: `${silenceRatioPct}% inactive below -50 dBFS`,
        description: 'Audio contains extensive silent intervals relative to active sound production.',
        limitationNote: 'Natural pauses in speech, podcasts, or edited dialogue produce intermittent silence.',
        weightContribution: 4,
      });
      cumulativeRisk += 4;
    } else if (silenceRatioPct < 2.0 && durationSeconds > 4.0) {
      indicators.push({
        id: 'aud_silence_absence',
        category: 'temporal_continuity',
        title: 'Unusually Continuous Acoustic Floor',
        severity: 'caution',
        observedValue: `${silenceRatioPct}% silence across ${metrics.durationFormatted}`,
        description:
          'Absence of natural micro-pauses or respiratory inhalation gaps typically present in human conversational speech.',
        limitationNote: 'Continuous background music, singing, or studio gating can eliminate natural pauses.',
        weightContribution: 12,
      });
      cumulativeRisk += 12;
    }

    // Indicator 3: Digital Clipping & Distortion
    if (clippedSamplesPct > 2.0) {
      indicators.push({
        id: 'aud_clipping_elevated',
        category: 'signal_anomalies',
        title: 'Elevated Digital Clipping Distortion',
        severity: 'caution',
        observedValue: `${clippedSamplesPct}% clipped samples`,
        description: 'Waveform peaks exceed digital headroom, producing harmonic distortion.',
        limitationNote: 'Poor microphone gain staging or loud mastered audio frequently causes clipping.',
        weightContribution: 8,
      });
      cumulativeRisk += 8;
    }

    // Indicator 4: Spectral Centroid & Brightness
    if (spectralCentroidHz < 600 && durationSeconds > 2.0) {
      indicators.push({
        id: 'aud_spectral_dark',
        category: 'spectral_characteristics',
        title: 'Muffled Spectral Energy Distribution',
        severity: 'info',
        observedValue: `Centroid: ${spectralCentroidHz} Hz`,
        description: 'Energy is heavily concentrated in the low-frequency bass register.',
        limitationNote: 'Can result from low-quality microphones or bass-heavy voices.',
        weightContribution: 3,
      });
      cumulativeRisk += 3;
    }

    // Indicator 5: Format & Channels
    indicators.push({
      id: 'aud_format_profile',
      category: 'format_metadata',
      title: 'Acoustic Stream Specification',
      severity: 'info',
      observedValue: `${channelMode} • ${sampleRate} Hz • ${metrics.durationFormatted}`,
      description: `Decoded ${metrics.numberOfChannels} channel(s) at native sampling rate ${sampleRate} samples/sec.`,
      limitationNote: 'Container metadata does not imply human vs synthetic origin.',
      weightContribution: 0,
    });

    // --- 7. Risk Level Determination ---
    const finalRiskScore = Math.min(Math.max(Math.round(cumulativeRisk), 5), 90);
    let riskLevel: RiskLevel = 'low';
    let riskLabel = 'Low Indicator Level';

    if (measurementConfidence === 'low' && finalRiskScore < 35) {
      riskLevel = 'inconclusive';
      riskLabel = 'Evidence Inconclusive';
    } else if (finalRiskScore >= 50) {
      riskLevel = 'elevated';
      riskLabel = 'Elevated Risk Indicators';
    } else if (finalRiskScore >= 25) {
      riskLevel = 'moderate';
      riskLabel = 'Moderate Risk Indicators';
    } else {
      riskLevel = 'low';
      riskLabel = 'Low Indicator Level';
    }

    const evidenceSummary =
      riskLevel === 'elevated'
        ? 'Acoustic measurements identified potential synthetic-audio indicators, such as low-pass cutoff or unnatural silence distribution. Verification of source audio context is advised.'
        : riskLevel === 'moderate'
        ? 'Observed minor acoustic characteristics requiring verification. These patterns can also arise from audio compression or aggressive mastering.'
        : riskLevel === 'inconclusive'
        ? 'Audio duration or sample quality was insufficient for definitive acoustic measurement.'
        : 'Acoustic parameters, waveform dynamics, and spectral energy lie within standard recording tolerances.';

    const recommendations = [
      'Listen closely for unnatural breathing cadences, robotic vowel elongation, or abrupt word transitions.',
      'Check if the speaker’s voice characteristics match confirmed authentic recordings in similar acoustic environments.',
      'Investigate the publication origin: Was this audio shared through official channels or unverified social accounts?',
      'Consult reference fact-checking databases if the audio purports to be a public figure or emergency statement.',
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
          ? 'Analysis detected acoustic properties that sometimes correlate with synthetic voice generation or heavy post-processing. These are probabilistic indicators and require context verification.'
          : riskLevel === 'moderate'
          ? 'Certain audio attributes show mild deviations from uncompressed acoustic speech. These could be compression artifacts or synthetic generation indicators.'
          : riskLevel === 'inconclusive'
          ? 'Acoustic measurements could not reach high diagnostic reliability due to limited audio duration or low sampling fidelity.'
          : 'No pronounced synthetic speech indicators or spectral cutoffs were detected in this audio sample.',
      recommendations,
      disclaimer,
    };
  } finally {
    if (audioCtx && audioCtx.state !== 'closed') {
      try {
        await audioCtx.close();
      } catch {
        // Ignore audioCtx close errors
      }
    }
  }
};

/**
 * TruthLens AI - Analysis Service
 * 
 * Central API facade for TruthLens forensic pipelines:
 * - Image Forensics (JPG, PNG, WEBP)
 * - Audio Acoustics (MP3, WAV, M4A, OGG)
 * - Video Frame Analysis (MP4, MOV, WEBM)
 * - Source & Context Verification
 * - GenAI & Rule-Based Synthesis
 */

export * from './imageAnalysisService';
export * from './audioAnalysisService';
export * from './videoAnalysisService';
export * from './sourceVerificationService';
export * from './aiExplanationService';
export * from './analysisPipeline';

export interface ServiceStatus {
  isReady: boolean;
  activeStage: number;
  message: string;
}

export const getServiceStatus = (): ServiceStatus => {
  return {
    isReady: true,
    activeStage: 8,
    message: 'Full Multi-Modal Forensic Engine Active (Image, Audio, Video, GenAI, Provenance).',
  };
};

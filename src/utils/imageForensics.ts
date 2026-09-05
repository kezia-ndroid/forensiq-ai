/**
 * TruthLens AI - Image Forensic & Statistical Analysis Utilities
 * 
 * In accordance with Stage 3 safeguards:
 * - Dimensions are treated purely as factual metadata (NEVER as risk indicators).
 * - Missing EXIF is treated as informational (common in web/shared images).
 * - Recompression differences are labeled "Experimental" and conservatively weighted.
 * - Confidence reflects measurement quality, NOT AI probability.
 */

import { MeasurementConfidence } from '../types/imageAnalysis';

export interface HeaderInspectionResult {
  hasExif: boolean;
  format: 'jpeg' | 'png' | 'webp' | 'unknown';
  detectedSoftware?: string[];
  summary: string;
}

export interface LuminanceAndContrastResult {
  meanLuminance: number;       // 0 - 255
  stdDevLuminance: number;
  rmsContrast: number;
  dynamicRangeClippingPct: number;
}

export interface ColorBalanceResult {
  meanR: number;
  meanG: number;
  meanB: number;
  channelDiscrepancy: number;  // Avg difference between R, G, B
}

export interface SpatialNoiseResult {
  overallVariance: number;
  quadrantVariances: [number, number, number, number]; // TL, TR, BL, BR
  varianceRatio: number;      // max variance / min variance (clamped)
}

export interface ExperimentalCompressionResult {
  compressionDelta: number;   // Average difference in re-compression
  isUniform: boolean;
}

/**
 * Calculates aspect ratio string (e.g. "1:1", "16:9", "4:3", or decimal)
 */
export const calculateAspectRatio = (width: number, height: number): string => {
  if (!width || !height) return 'Unknown';
  
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  // Check common standard ratios with tolerance
  const dec = width / height;
  if (Math.abs(dec - 1.0) < 0.02) return '1:1 (Square)';
  if (Math.abs(dec - 16 / 9) < 0.03) return '16:9 (Widescreen)';
  if (Math.abs(dec - 4 / 3) < 0.03) return '4:3 (Standard)';
  if (Math.abs(dec - 3 / 2) < 0.03) return '3:2 (Classic 35mm)';
  if (Math.abs(dec - 9 / 16) < 0.03) return '9:16 (Vertical)';

  if (ratioW < 20 && ratioH < 20) {
    return `${ratioW}:${ratioH}`;
  }
  return `${dec.toFixed(2)}:1`;
};

/**
 * Inspects image binary header (first 64KB) for EXIF, JFIF, or PNG text metadata
 */
export const inspectImageHeader = async (file: File): Promise<HeaderInspectionResult> => {
  try {
    const slice = file.slice(0, 65536);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for JPEG: FF D8
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      let hasExif = false;
      let pos = 2;
      const detectedSoftware: string[] = [];

      while (pos < bytes.length - 4) {
        if (bytes[pos] === 0xff && bytes[pos + 1] === 0xe1) {
          // APP1 Marker (EXIF)
          const markerStr = String.fromCharCode(
            bytes[pos + 4],
            bytes[pos + 5],
            bytes[pos + 6],
            bytes[pos + 7]
          );
          if (markerStr === 'Exif') {
            hasExif = true;
          }
          break;
        }
        pos++;
      }

      return {
        hasExif,
        format: 'jpeg',
        detectedSoftware: detectedSoftware.length > 0 ? detectedSoftware : undefined,
        summary: hasExif
          ? 'Standard EXIF camera metadata structure detected.'
          : 'No standard EXIF markers found (standard for web/shared images).',
      };
    }

    // Check for PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const fullText = textDecoder.decode(bytes);
      const detectedSoftware: string[] = [];

      if (fullText.includes('parameters') || fullText.includes('Negative prompt') || fullText.includes('Steps:')) {
        detectedSoftware.push('Diffusion Metadata (Prompt/Parameters Chunk)');
      }
      if (fullText.includes('ComfyUI') || fullText.includes('workflow')) {
        detectedSoftware.push('ComfyUI Workflow Metadata');
      }

      return {
        hasExif: false,
        format: 'png',
        detectedSoftware: detectedSoftware.length > 0 ? detectedSoftware : undefined,
        summary: detectedSoftware.length > 0
          ? `PNG textual parameter chunks identified: ${detectedSoftware.join(', ')}`
          : 'Standard PNG chunk structure with no synthetic generation flags detected.',
      };
    }

    // Check for WEBP: 'RIFF' .... 'WEBP'
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      return {
        hasExif: false,
        format: 'webp',
        summary: 'Standard WebP container format detected.',
      };
    }

    return {
      hasExif: false,
      format: 'unknown',
      summary: 'Standard image container detected.',
    };
  } catch {
    return {
      hasExif: false,
      format: 'unknown',
      summary: 'Binary header inspection could not be completed.',
    };
  }
};

/**
 * Calculates luminance distribution, standard deviation, RMS contrast, and dynamic range clipping
 */
export const calculateLuminanceAndContrast = (
  pixels: Uint8ClampedArray
): LuminanceAndContrastResult => {
  const totalPixels = pixels.length / 4;
  if (totalPixels === 0) {
    return { meanLuminance: 128, stdDevLuminance: 0, rmsContrast: 0, dynamicRangeClippingPct: 0 };
  }

  let sumLum = 0;
  let clippedCount = 0;
  const lumValues = new Float32Array(totalPixels);

  // ITU-R BT.601 luminance coefficients: 0.299*R + 0.587*G + 0.114*B
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    lumValues[p] = lum;
    sumLum += lum;

    // Check for saturation clipping at extremes (pure black or pure white across channels)
    if ((r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255)) {
      clippedCount++;
    }
  }

  const meanLuminance = sumLum / totalPixels;

  let varianceSum = 0;
  for (let p = 0; p < totalPixels; p++) {
    const diff = lumValues[p] - meanLuminance;
    varianceSum += diff * diff;
  }

  const variance = varianceSum / totalPixels;
  const stdDevLuminance = Math.sqrt(variance);
  // RMS contrast = stdDev of normalized luminance (0.0 to 1.0)
  const rmsContrast = stdDevLuminance / 255;
  const dynamicRangeClippingPct = (clippedCount / totalPixels) * 100;

  return {
    meanLuminance: Math.round(meanLuminance * 10) / 10,
    stdDevLuminance: Math.round(stdDevLuminance * 10) / 10,
    rmsContrast: Math.round(rmsContrast * 1000) / 1000,
    dynamicRangeClippingPct: Math.round(dynamicRangeClippingPct * 100) / 100,
  };
};

/**
 * Calculates color channel balance and divergence between R, G, B
 */
export const calculateColorChannelBalance = (
  pixels: Uint8ClampedArray
): ColorBalanceResult => {
  const totalPixels = pixels.length / 4;
  if (totalPixels === 0) {
    return { meanR: 128, meanG: 128, meanB: 128, channelDiscrepancy: 0 };
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumDiff = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    sumR += r;
    sumG += g;
    sumB += b;
    // Difference between channels
    const diff = (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)) / 3;
    sumDiff += diff;
  }

  return {
    meanR: Math.round((sumR / totalPixels) * 10) / 10,
    meanG: Math.round((sumG / totalPixels) * 10) / 10,
    meanB: Math.round((sumB / totalPixels) * 10) / 10,
    channelDiscrepancy: Math.round((sumDiff / totalPixels) * 10) / 10,
  };
};

/**
 * Evaluates spatial texture and noise consistency using local gradient variance across 4 quadrants
 */
export const calculateSpatialNoiseConsistency = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): SpatialNoiseResult => {
  if (width < 8 || height < 8) {
    return { overallVariance: 0, quadrantVariances: [0, 0, 0, 0], varianceRatio: 1.0 };
  }

  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);

  // Quadrants: 0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right
  const quadVariances: [number, number, number, number] = [0, 0, 0, 0];

  const computeQuadrantVariance = (startX: number, startY: number, endX: number, endY: number): number => {
    let sumGrad = 0;
    let count = 0;
    const grads: number[] = [];

    for (let y = startY + 1; y < endY - 1; y += 2) {
      for (let x = startX + 1; x < endX - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const lum = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];

        const idxRight = (y * width + (x + 1)) * 4;
        const lumRight = 0.299 * pixels[idxRight] + 0.587 * pixels[idxRight + 1] + 0.114 * pixels[idxRight + 2];

        const idxDown = ((y + 1) * width + x) * 4;
        const lumDown = 0.299 * pixels[idxDown] + 0.587 * pixels[idxDown + 1] + 0.114 * pixels[idxDown + 2];

        // Discrete gradient magnitude
        const grad = Math.abs(lumRight - lum) + Math.abs(lumDown - lum);
        grads.push(grad);
        sumGrad += grad;
        count++;
      }
    }

    if (count === 0) return 0;
    const mean = sumGrad / count;
    let varianceSum = 0;
    for (let i = 0; i < grads.length; i++) {
      const diff = grads[i] - mean;
      varianceSum += diff * diff;
    }
    return Math.round((varianceSum / count) * 10) / 10;
  };

  quadVariances[0] = computeQuadrantVariance(0, 0, halfW, halfH);
  quadVariances[1] = computeQuadrantVariance(halfW, 0, width, halfH);
  quadVariances[2] = computeQuadrantVariance(0, halfH, halfW, height);
  quadVariances[3] = computeQuadrantVariance(halfW, halfH, width, height);

  const overall = (quadVariances[0] + quadVariances[1] + quadVariances[2] + quadVariances[3]) / 4;

  const validVars = quadVariances.filter((v) => v > 0.5);
  let ratio = 1.0;
  if (validVars.length >= 2) {
    const minVar = Math.min(...validVars);
    const maxVar = Math.max(...validVars);
    ratio = Math.round((maxVar / Math.max(minVar, 0.1)) * 10) / 10;
  }

  return {
    overallVariance: Math.round(overall * 10) / 10,
    quadrantVariances: quadVariances,
    varianceRatio: Math.min(ratio, 50.0),
  };
};

/**
 * Computes Experimental Recompression Difference
 * Conforms strictly to Requirement 2:
 * - Labeled "Experimental Recompression Difference"
 * - Does not produce high risk on its own
 * - Acknowledges legitimate variation
 */
export const calculateExperimentalRecompressionDelta = async (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): Promise<ExperimentalCompressionResult> => {
  try {
    const originalData = ctx.getImageData(0, 0, width, height).data;

    // Create a temporary recompressed version at 92% JPEG quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const tempImg = new Image();
    
    await new Promise<void>((resolve, reject) => {
      tempImg.onload = () => resolve();
      tempImg.onerror = () => reject(new Error('Recompression load failure'));
      tempImg.src = dataUrl;
    });

    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) {
      return { compressionDelta: 0, isUniform: true };
    }

    offCtx.drawImage(tempImg, 0, 0, width, height);
    const recompressedData = offCtx.getImageData(0, 0, width, height).data;

    let totalDiff = 0;
    const sampleStep = 4; // Sample every 4th pixel for speed
    let samples = 0;

    for (let i = 0; i < originalData.length; i += sampleStep * 4) {
      const diffR = Math.abs(originalData[i] - recompressedData[i]);
      const diffG = Math.abs(originalData[i + 1] - recompressedData[i + 1]);
      const diffB = Math.abs(originalData[i + 2] - recompressedData[i + 2]);
      totalDiff += (diffR + diffG + diffB) / 3;
      samples++;
    }

    const avgDiff = samples > 0 ? totalDiff / samples : 0;
    return {
      compressionDelta: Math.round(avgDiff * 100) / 100,
      isUniform: avgDiff < 8.0,
    };
  } catch {
    return {
      compressionDelta: 0,
      isUniform: true,
    };
  }
};

/**
 * Calculates Measurement Confidence based on quality/availability of measurements
 * (Requirement 6: NOT AI probability, but diagnostic reliability)
 */
export const evaluateMeasurementConfidence = (
  width: number,
  height: number,
  fileSizeBytes: number
): { confidence: MeasurementConfidence; rationale: string } => {
  const megapixels = (width * height) / 1_000_000;

  if (width < 320 || height < 320 || fileSizeBytes < 15_000) {
    return {
      confidence: 'low',
      rationale:
        'Measurement reliability is Low due to small image dimensions (< 320px) or low file size, which limits high-frequency frequency resolution.',
    };
  }

  if (width < 720 || height < 720 || megapixels < 0.6) {
    return {
      confidence: 'moderate',
      rationale:
        'Measurement reliability is Moderate. Image has sufficient resolution for macro statistics, but subtle pixel-level sensor noise may be compressed.',
    };
  }

  return {
    confidence: 'high',
    rationale:
      'Measurement reliability is High. Full resolution provides ample spatial sampling for statistical, edge, and color distribution metrics.',
  };
};

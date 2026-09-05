/**
 * TruthLens AI - GenAI Explanation Service
 * 
 * Synthesizes measured forensic data into understandable, accessible explanations.
 * 
 * Required Sections:
 * 1. What was detected
 * 2. Why the indicators matter
 * 3. What the indicators do NOT prove
 * 4. Confidence & limitations
 * 5. What the user should verify next
 * 
 * Safety & Privacy:
 * - Never hard-codes or leaks API keys.
 * - Supports environment variables (VITE_GEMINI_API_KEY) and optional user session key.
 * - If no API key is available, delivers a deterministic, transparent local heuristic synthesis.
 * - Clearly distinguishes "Gemini 2.0 Flash" from "Local Forensic Synthesizer (Rule-Based Fallback)".
 */

import { GenAIExplanation, UnifiedForensicIndicator } from '../types/unifiedAnalysis';
import { MediaType } from '../types';

export interface ExplanationInputData {
  mediaType: MediaType;
  fileName: string;
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'inconclusive';
  riskLabel: string;
  measurementConfidence: 'high' | 'moderate' | 'low';
  confidenceRationale: string;
  indicators: UnifiedForensicIndicator[];
  summaryMetrics: { label: string; value: string }[];
  sourceHostname?: string;
}

/**
 * Retrieves the currently available Gemini API key from environment or local session storage.
 */
export const getActiveApiKey = (): string | null => {
  // 1. Check Vite environment variable
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const envKey = metaEnv?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 10) {
    return envKey.trim();
  }

  // 2. Check local session storage (allows demo judges to supply a key safely in-browser)
  try {
    const sessionKey = localStorage.getItem('truthlens_gemini_api_key');
    if (sessionKey && sessionKey.trim().length > 10) {
      return sessionKey.trim();
    }
  } catch {
    // localStorage may be disabled or restricted in certain sandbox modes
  }

  return null;
};

/**
 * Saves a user-provided API key to local storage for live GenAI testing.
 */
export const saveUserApiKey = (key: string): void => {
  try {
    if (key.trim()) {
      localStorage.setItem('truthlens_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('truthlens_gemini_api_key');
    }
  } catch {
    // ignore storage error
  }
};

/**
 * Clears the stored user API key.
 */
export const clearUserApiKey = (): void => {
  try {
    localStorage.removeItem('truthlens_gemini_api_key');
  } catch {
    // ignore
  }
};

/**
 * Generates local rule-based forensic explanation strictly grounded in measured data.
 * Does NOT pretend to be an external LLM.
 */
const generateLocalHeuristicExplanation = (data: ExplanationInputData): GenAIExplanation => {
  const elevated = data.indicators.filter((i) => i.severity === 'warning');
  const cautions = data.indicators.filter((i) => i.severity === 'caution');

  // 1. What was detected
  let whatWasDetected = `TruthLens evaluated "${data.fileName}" (${data.mediaType}) using client-side mathematical and acoustic/visual heuristics. `;
  if (elevated.length > 0) {
    whatWasDetected += `The pipeline flagged ${elevated.length} elevated indicator(s): ${elevated
      .map((e) => `"${e.title}" (${e.observedValue})`)
      .join('; ')}. `;
  }
  if (cautions.length > 0) {
    whatWasDetected += `Additionally, ${cautions.length} moderate caution indicator(s) were observed: ${cautions
      .map((c) => `"${c.title}" (${c.observedValue})`)
      .join('; ')}. `;
  }
  if (elevated.length === 0 && cautions.length === 0) {
    whatWasDetected += `All measured characteristics (including dynamic range, texture gradients, and signal continuity) registered within baseline reference ranges for standard digital recordings.`;
  }

  // 2. Why the indicators matter
  let whyIndicatorsMatter = '';
  if (data.mediaType === 'image') {
    whyIndicatorsMatter =
      'In digital imagery, generative diffusion models and editing tools often introduce subtle high-frequency spatial noise discrepancies, compression quantization variations, or embedded parameter chunks. These statistical signatures help pinpoint areas where pixel structures deviate from natural optical capture.';
  } else if (data.mediaType === 'audio') {
    whyIndicatorsMatter =
      'Synthetic speech synthesis and neural vocoders frequently exhibit low-pass frequency ceilings (brickwall cutoffs), unnatural pause distributions, or robotic pitch consistency. Measuring acoustic dynamics identifies segments that diverge from organic human vocal tract mechanics.';
  } else {
    whyIndicatorsMatter =
      'Video manipulation or frame-by-frame generative rendering frequently produces subtle temporal luminance flicker, irregular inter-frame pixel differences, or inconsistent edge sharpness between adjacent frames. These measurements reveal temporal discontinuities.';
  }

  // 3. What the indicators do NOT prove
  const whatIndicatorsDoNotProve =
    'These empirical measurements do NOT prove that the media is definitely authentic or definitely AI-generated. Everyday factors—such as lossy messaging compression (WhatsApp, Twitter/X), aggressive noise reduction filters, artistic post-processing, low bitrates, or poor recording sensors—can trigger identical forensic anomalies.';

  // 4. Confidence & limitations
  const confidenceAndLimitations = `Measurement Reliability: ${data.measurementConfidence.toUpperCase()}. ${data.confidenceRationale} Because all processing occurs client-side in the browser without server-grade multi-layer neural networks, these indicators serve as an evidentiary screening tool rather than an infallible verdict.`;

  // 5. What the user should verify next
  const whatToVerifyNext: string[] = [
    'Locate the earliest known appearance of this media using reverse-search engines (Google Lens, TinEye).',
    'Review the reporting context: Has this media been verified or debunked by reputable newsrooms or fact-checkers?',
    data.mediaType === 'image'
      ? 'Inspect fine anatomical details: hand fingers, ear lobes, background text, and specular light reflections in the eyes.'
      : data.mediaType === 'audio'
      ? 'Listen for natural inhalation breaths, tongue clicks, and ambient room reverb consistency between sentences.'
      : 'Scrutinize facial boundaries, hair strands against backgrounds, and acoustic lip-sync timing.',
    'Do not republish or amplify this media if the originating source cannot be verified.',
  ];

  return {
    provider: 'local_heuristic',
    providerLabel: 'Local Forensic Synthesizer (Offline Rule-Based)',
    modelName: 'TruthLens Heuristic Engine v1.0',
    generatedAt: new Date().toISOString(),
    isFallback: true,
    whatWasDetected,
    whyIndicatorsMatter,
    whatIndicatorsDoNotProve,
    confidenceAndLimitations,
    whatToVerifyNext,
  };
};

/**
 * Generates an explanation using Google Gemini API if a key is available,
 * or gracefully falls back to the deterministic local forensic synthesizer.
 */
export const generateForensicExplanation = async (
  data: ExplanationInputData
): Promise<GenAIExplanation> => {
  const apiKey = getActiveApiKey();

  // If no API key is present, immediately return transparent local fallback
  if (!apiKey) {
    return generateLocalHeuristicExplanation(data);
  }

  try {
    const prompt = `
You are the TruthLens AI Forensic Verification Assistant.
Analyze the following empirical media measurements and synthesize a clear, objective, responsible explanation.

STRICT ETHICAL GUIDELINES:
- Never claim that the media is 100% real or 100% fake.
- Use probabilistic, evidence-based language ("observed characteristic", "potential indicator", "needs verification").
- Ground every single point in the provided measured forensic data.
- Do NOT hallucinate or invent new metrics or claims.

INPUT DATA:
- Media Type: ${data.mediaType}
- File Name: ${data.fileName}
- Risk Score: ${data.riskScore}/100 (${data.riskLabel})
- Measurement Confidence: ${data.measurementConfidence} (${data.confidenceRationale})
- Measured Indicators:
${data.indicators.map((i) => `  * [${i.severity.toUpperCase()}] ${i.title}: ${i.observedValue} — ${i.description}`).join('\n')}
- Factual Metrics:
${data.summaryMetrics.map((m) => `  * ${m.label}: ${m.value}`).join('\n')}

Respond ONLY with valid JSON with this exact structure:
{
  "whatWasDetected": "Clear 2-3 sentence overview of what specific metrics were detected.",
  "whyIndicatorsMatter": "Explanation of why these specific indicators are relevant in forensic analysis.",
  "whatIndicatorsDoNotProve": "Clear statement of what these findings do NOT prove (e.g. natural causes like compression).",
  "confidenceAndLimitations": "Assessment of measurement confidence and technical limitations.",
  "whatToVerifyNext": ["Actionable step 1", "Actionable step 2", "Actionable step 3", "Actionable step 4"]
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error (HTTP ${response.status})`);
    }

    const json = await response.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(candidateText);

    return {
      provider: 'gemini',
      providerLabel: 'Google Gemini 1.5 Flash (Live API)',
      modelName: 'gemini-1.5-flash',
      generatedAt: new Date().toISOString(),
      isFallback: false,
      whatWasDetected: parsed.whatWasDetected || 'Analysis completed.',
      whyIndicatorsMatter: parsed.whyIndicatorsMatter || 'Characteristics evaluated against baseline.',
      whatIndicatorsDoNotProve:
        parsed.whatIndicatorsDoNotProve ||
        'Indicators do not prove synthetic generation or authenticity.',
      confidenceAndLimitations:
        parsed.confidenceAndLimitations || data.confidenceRationale,
      whatToVerifyNext: Array.isArray(parsed.whatToVerifyNext)
        ? parsed.whatToVerifyNext
        : [
            'Cross-check on reverse-search engines',
            'Verify publication date and publisher source',
            'Consult fact-checking databases',
          ],
    };
  } catch {
    // If API call fails (network issue, invalid key, rate limit), gracefully use local heuristic fallback
    const fallback = generateLocalHeuristicExplanation(data);
    fallback.providerLabel = 'Local Forensic Synthesizer (API Fallback)';
    return fallback;
  }
};

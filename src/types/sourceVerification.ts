/**
 * TruthLens AI - Source & Context Verification Type Definitions
 * 
 * Empirically validates URL structure, protocol security, domain profile,
 * and handles browser CORS limitations gracefully without fabricating data.
 */

export interface SourceVerificationDetails {
  inputUrl: string;
  sanitizedUrl: string;
  isValid: boolean;
  protocol: 'https:' | 'http:' | 'unknown';
  isHttpsSecure: boolean;
  hostname: string;
  domainCategory: 'news' | 'social_media' | 'image_host' | 'stock_archive' | 'general' | 'unverified';
  domainCategoryLabel: string;
  fileExtension?: string;
  sourceTypeGuess: 'Direct Media File' | 'Web Page / Post' | 'Unknown';

  // Remote metadata if safely accessible (CORS permitting)
  metadataAccessible: boolean;
  httpStatus?: number;
  contentType?: string;
  contentLengthFormatted?: string;
  lastModified?: string;
  serverMessage: string;

  // Real external search query links (no fake internal search)
  externalReverseLookupUrls: {
    googleLensUrl: string;
    tineyeUrl: string;
    bingVisualUrl: string;
  };

  // Checklist for manual verification
  checklist: {
    id: string;
    label: string;
    description: string;
  }[];
}

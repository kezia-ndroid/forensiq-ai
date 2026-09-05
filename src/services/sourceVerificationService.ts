/**
 * TruthLens AI - Source & Context Verification Service
 * 
 * Safely inspects media URLs, domain credibility indicators, and CORS-accessible headers.
 * Never invents article titles, author names, or dates.
 * Generates genuine external reverse-search links instead of pretending internal search ran.
 */

import { SourceVerificationDetails } from '../types/sourceVerification';
import { formatFileSize, getFileExtension } from '../utils/mediaValidation';

const KNOWN_NEWS_DOMAINS = [
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'bbc.co.uk',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'wsj.com',
  'bloomberg.com',
  'afp.com',
  'aljazeera.com',
  'npr.org',
];

const KNOWN_SOCIAL_DOMAINS = [
  'twitter.com',
  'x.com',
  'reddit.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'threads.net',
  't.me',
  'telegram.org',
  'youtube.com',
  'youtu.be',
];

const KNOWN_IMAGE_HOSTS = [
  'imgur.com',
  'i.imgur.com',
  'postimg.cc',
  'i.redd.it',
  'v.redd.it',
  'media.discordapp.net',
  'cdn.discordapp.com',
  'pbs.twimg.com',
];

const KNOWN_STOCK_ARCHIVES = [
  'gettyimages.com',
  'shutterstock.com',
  'unsplash.com',
  'pexels.com',
  'adobe.stock.com',
  'istockphoto.com',
];

export const verifySourceUrl = async (rawUrl: string): Promise<SourceVerificationDetails> => {
  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL provided. Please include http:// or https://');
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol as 'https:' | 'http:' | 'unknown';
  const isHttpsSecure = protocol === 'https:';
  const ext = getFileExtension(parsed.pathname).toLowerCase();

  // Determine domain classification
  let domainCategory: SourceVerificationDetails['domainCategory'] = 'general';
  let domainCategoryLabel = 'General Web Domain';

  const matchesDomain = (list: string[]) =>
    list.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

  if (matchesDomain(KNOWN_NEWS_DOMAINS)) {
    domainCategory = 'news';
    domainCategoryLabel = 'Established News & Wire Service';
  } else if (matchesDomain(KNOWN_SOCIAL_DOMAINS)) {
    domainCategory = 'social_media';
    domainCategoryLabel = 'Social Media / User-Generated Platform';
  } else if (matchesDomain(KNOWN_IMAGE_HOSTS)) {
    domainCategory = 'image_host';
    domainCategoryLabel = 'Third-Party Image / Media Host';
  } else if (matchesDomain(KNOWN_STOCK_ARCHIVES)) {
    domainCategory = 'stock_archive';
    domainCategoryLabel = 'Stock Photography / Footage Archive';
  } else if (!hostname.includes('.')) {
    domainCategory = 'unverified';
    domainCategoryLabel = 'Unverified Hostname';
  }

  // Guess media source type
  const isDirectMediaFile = ['jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'ogg', 'm4a', 'mp4', 'mov', 'webm'].includes(ext);
  const sourceTypeGuess = isDirectMediaFile ? 'Direct Media File' : 'Web Page / Post';

  // Safe client-side fetch attempt (CORS-guarded)
  let metadataAccessible = false;
  let httpStatus: number | undefined;
  let contentType: string | undefined;
  let contentLengthFormatted: string | undefined;
  let lastModified: string | undefined;
  let serverMessage =
    'Source metadata could not be retrieved automatically due to browser CORS restrictions. Verify the original source manually.';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(parsed.toString(), {
      method: 'HEAD',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    httpStatus = response.status;
    contentType = response.headers.get('content-type') || undefined;
    const len = response.headers.get('content-length');
    if (len && !isNaN(parseInt(len, 10))) {
      contentLengthFormatted = formatFileSize(parseInt(len, 10));
    }
    const mod = response.headers.get('last-modified');
    if (mod) {
      lastModified = new Date(mod).toUTCString();
    }

    metadataAccessible = true;
    serverMessage = `Successfully reached server (HTTP ${httpStatus}). Headers retrieved via CORS.`;
  } catch {
    // Expected behavior in web browsers when contacting foreign domains without CORS headers
    metadataAccessible = false;
    serverMessage =
      'Source metadata could not be retrieved automatically due to browser CORS restrictions. Verify the original source manually.';
  }

  // Real external reverse lookup endpoints
  const encodedUrl = encodeURIComponent(parsed.toString());
  const externalReverseLookupUrls = {
    googleLensUrl: `https://lens.google.com/uploadbyurl?url=${encodedUrl}`,
    tineyeUrl: `https://tineye.com/search?url=${encodedUrl}`,
    bingVisualUrl: `https://www.bing.com/images/search?view=detailv2&iss=sbi&FORM=SBIHMP&sbisrc=UrlPaste&q=imgurl:${encodedUrl}`,
  };

  // Structured verification checklist
  const checklist = [
    {
      id: 'source-1',
      label: 'Find Earliest Known Upload',
      description: 'Use external reverse-image tools to determine when and where this media first appeared on the internet.',
    },
    {
      id: 'source-2',
      label: 'Check Publisher Domain Credibility',
      description: `Evaluate ${hostname}. Is this an authorized news agency, an eyewitness account, or an anonymous aggregator?`,
    },
    {
      id: 'source-3',
      label: 'Cross-Check Reputable Reporting',
      description: 'Search wire services (Reuters, AP, BBC) to see if independent journalists corroborated the depicted event.',
    },
    {
      id: 'source-4',
      label: 'Inspect Surrounding Context',
      description: 'Look for cropped watermarks, misleading captions, or out-of-date timestamps repurposed for current news.',
    },
    {
      id: 'source-5',
      label: 'Do Not Share Prematurely',
      description: 'If indicators are elevated or the source cannot be verified, avoid amplifying the media on social platforms.',
    },
  ];

  return {
    inputUrl: rawUrl,
    sanitizedUrl: parsed.toString(),
    isValid: true,
    protocol,
    isHttpsSecure,
    hostname,
    domainCategory,
    domainCategoryLabel,
    fileExtension: ext ? `.${ext.toUpperCase()}` : undefined,
    sourceTypeGuess,
    metadataAccessible,
    httpStatus,
    contentType,
    contentLengthFormatted,
    lastModified,
    serverMessage,
    externalReverseLookupUrls,
    checklist,
  };
};

/**
 * Ensures a URL has a proper protocol (https://)
 * @param url - The URL to validate and fix
 * @returns A properly formatted URL with protocol
 */
export const ensureHttpsProtocol = (url: string): string => {
  if (!url) return url;
  
  // If URL already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL starts with www. or is a domain, add https://
  if (url.startsWith('www.') || url.includes('.')) {
    return `https://${url}`;
  }
  
  // For other cases, add https://
  return `https://${url}`;
};

/**
 * Validates and fixes social media URLs
 * @param socialLinks - Object containing social media links
 * @returns Object with properly formatted URLs
 */
export const normalizeSocialLinks = (socialLinks: Record<string, string>): Record<string, string> => {
  const normalized: Record<string, string> = {};
  
  for (const [platform, url] of Object.entries(socialLinks)) {
    if (url && url.trim()) {
      normalized[platform] = ensureHttpsProtocol(url.trim());
    }
  }
  
  return normalized;
};

import { NextRequest } from 'next/server';

/**
 * Detect the current domain from request headers and environment variables
 * Prioritizes Vercel-specific headers and environment variables for accurate detection
 */
export function detectDomain(request: NextRequest, fallbackDomain?: string): string {
  // Priority order for domain detection:
  // 1. Vercel deployment URL (most accurate for preview deployments)
  // 2. Vercel forwarded host
  // 3. Standard forwarded host
  // 4. Host header
  // 5. Environment variables
  // 6. Fallback domain
  
  const domain = request.headers.get('x-vercel-deployment-url') ||
                request.headers.get('x-vercel-forwarded-host') ||
                request.headers.get('x-forwarded-host') ||
                request.headers.get('host') ||
                process.env.VERCEL_URL ||
                process.env.VERCEL_BRANCH_URL ||
                fallbackDomain ||
                'solarbookers.com';
  
  return domain;
}

/**
 * Generate a full URL with the correct protocol and domain
 */
export function generateFullUrl(request: NextRequest, path: string, fallbackDomain?: string): string {
  const domain = detectDomain(request, fallbackDomain);
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${protocol}://${domain}${cleanPath}`;
}

/**
 * Get the current domain with protocol
 */
export function getCurrentDomain(request: NextRequest, fallbackDomain?: string): string {
  const domain = detectDomain(request, fallbackDomain);
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  
  return `${protocol}://${domain}`;
}

/**
 * Check if the current deployment is a Vercel preview
 */
export function isVercelPreview(request: NextRequest): boolean {
  return !!(request.headers.get('x-vercel-deployment-url') || 
           process.env.VERCEL_URL?.includes('vercel.app'));
}

/**
 * Log domain detection information for debugging
 */
export function logDomainDetection(request: NextRequest, context: string): void {
  console.log(`[${context}] Domain Detection:`, {
    detectedDomain: detectDomain(request),
    isPreview: isVercelPreview(request),
    headers: {
      host: request.headers.get('host'),
      'x-vercel-deployment-url': request.headers.get('x-vercel-deployment-url'),
      'x-vercel-forwarded-host': request.headers.get('x-vercel-forwarded-host'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
    },
    env: {
      VERCEL_URL: process.env.VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV,
    }
  });
} 
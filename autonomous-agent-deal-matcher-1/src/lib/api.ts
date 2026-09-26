/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Clean up any stale or invalid backend URLs stored from previous runs that pointed to dead preview hosts or localhost
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('CUSTOM_BACKEND_URL');
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Helper to resolve the API base URL.
 * All API routes (/api/*) are hosted together on the same origin via Express on port 3000.
 * Relative URLs are always used to ensure seamless operation in browser previews, iframes, and Cloud Run.
 */
export const getApiUrl = (path: string): string => {
  if (typeof window === 'undefined') return path;
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return path.startsWith('/') ? path : `/${path}`;
};

/**
 * Safe fetch wrapper that guarantees responses are valid JSON,
 * retries on transient network disconnects, and prevents syntax crashes.
 */
export async function safeFetchJson<T = any>(
  pathOrUrl: string,
  options?: RequestInit,
  retries = 2
): Promise<T> {
  const url = getApiUrl(pathOrUrl);
  
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      // If response has non-2xx status code
      if (!res.ok) {
        let errorMessage = `Server error (${res.status} ${res.statusText || 'Error'})`;
        try {
          if (contentType.includes('application/json')) {
            const errorJson = await res.json();
            errorMessage = errorJson.error || errorJson.message || JSON.stringify(errorJson);
          } else {
            const text = await res.text();
            if (text && !text.trim().startsWith('<')) {
              errorMessage = text.slice(0, 200);
            }
          }
        } catch {
          // Use fallback status error
        }
        throw new Error(errorMessage);
      }

      // Response is 200 OK: verify it is actual JSON and not an HTML fallback page
      if (!contentType.includes('application/json')) {
        const rawText = await res.text();
        const trimmed = rawText.trim();
        if (trimmed.startsWith('<')) {
          throw new Error(
            `Server returned an HTML document instead of JSON (HTTP ${res.status}). The service may still be initializing.`
          );
        }
        try {
          return JSON.parse(rawText) as T;
        } catch {
          throw new Error(`Invalid JSON response: ${trimmed.slice(0, 80)}`);
        }
      }

      return (await res.json()) as T;
    } catch (err: any) {
      lastError = err;
      
      // If we have retries remaining and it's a GET or idempotent request, delay and retry
      const method = options?.method?.toUpperCase() || 'GET';
      if (attempt < retries && (method === 'GET' || method === 'HEAD')) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  const msg = lastError?.message || 'Unable to reach backend server';
  throw new Error(`Network connection error: ${msg}`);
}

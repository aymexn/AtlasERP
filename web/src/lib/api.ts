export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ─── Recovery Logger ──────────────────────────────────────────────────────────
type LogLevel = 'info' | 'warn' | 'error';
function recoveryLog(level: LogLevel, message: string, meta?: object) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    };
    if (level === 'error') console.error('[AtlasERP Recovery]', entry);
    else if (level === 'warn') console.warn('[AtlasERP Recovery]', entry);
    else console.info('[AtlasERP Recovery]', entry);
}

// ─── Backend Health Probe ─────────────────────────────────────────────────────
export async function probeBackendHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/health`, {
            signal: AbortSignal.timeout(3000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// ─── Exponential Backoff Retry ────────────────────────────────────────────────
const RETRY_DELAYS = [1000, 3000, 5000]; // ms: 1s → 3s → 5s
const MAX_RETRIES = 3;

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
    url: string,
    init: RequestInit,
    attempt = 0
): Promise<{ response: Response; wasRetried: boolean }> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timeoutId);
        return { response, wasRetried: attempt > 0 };
    } catch (err: any) {
        const isRetryable =
            err.name === 'AbortError' || err.message === 'Failed to fetch';

        if (isRetryable && attempt < MAX_RETRIES) {
            const delay = RETRY_DELAYS[attempt] ?? 5000;
            const errorType = err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';

            recoveryLog('warn', `Request failed — retrying`, {
                attempt: attempt + 1,
                maxRetries: MAX_RETRIES,
                delayMs: delay,
                errorType,
                url,
            });

            // Emit event so UI can react
            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('atlas:reconnecting', {
                        detail: { attempt: attempt + 1, maxRetries: MAX_RETRIES, delay },
                    })
                );
            }

            await sleep(delay);
            return fetchWithRetry(url, init, attempt + 1);
        }

        // All retries exhausted — log & fire critical event
        if (attempt >= MAX_RETRIES) {
            recoveryLog('error', 'All retry attempts exhausted — marking CRITICAL', {
                url,
                totalAttempts: attempt + 1,
            });
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('atlas:connection-critical'));
            }
        }

        throw err;
    }
}

// ─── Data Sterilization Utility ───────────────────────────────────────────────
/**
 * Strips metadata and nested relations that the backend ValidationPipe 
 * might reject due to 'forbidNonWhitelisted' constraints.
 */
export function sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    // If it's an array, sanitize each element
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    const clean: any = {};
    const metadataFields = ['id', 'createdAt', 'updatedAt', 'companyId', '_count'];
    
    Object.keys(data).forEach(key => {
        if (metadataFields.includes(key)) return;
        
        const value = data[key];
        
        // Strip out object relations (those would be nested objects with an 'id' that aren't arrays)
        if (value && typeof value === 'object' && !Array.isArray(value) && value.id) {
            return;
        }

        clean[key] = value;
    });

    return clean;
}

// ─── Main apiFetch ────────────────────────────────────────────────────────────
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const isClient = typeof window !== 'undefined';
    const token = isClient ? localStorage.getItem('atlas_token') : null;

    const publicEndpoints = ['/auth/login', '/auth/register', '/health'];
    const isPublic = publicEndpoints.some((p) => endpoint.includes(p));

    // Automatically sanitize body if it's a POST/PATCH/PUT request
    let finalBody = options.body;
    if (options.body && typeof options.body === 'string' && ['POST', 'PATCH', 'PUT'].includes(options.method || '')) {
        try {
            const parsed = JSON.parse(options.body);
            finalBody = JSON.stringify(sanitizeData(parsed));
        } catch {
            // Not JSON or fail, keep original
        }
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as any),
    };


    if (!isPublic && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const { response, wasRetried } = await fetchWithRetry(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            body: finalBody,
        });


        if (response.status === 401 && isClient) {
            recoveryLog('warn', '401 Unauthorized — clearing session');
            localStorage.removeItem('atlas_token');
            const localeMatch = window.location.pathname.match(/^\/(fr|ar|en)/);
            const currentLocale = localeMatch ? localeMatch[1] : 'fr';
            window.location.href = `/${currentLocale}/login`;
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errMsg = errorData.message || 'API request failed';
            throw new Error(errMsg);
        }

        // Connection restored event (ONLY if we previously had issues)
        if (isClient && wasRetried) {
            window.dispatchEvent(new CustomEvent('atlas:connection-restored'));
        }

        return response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            recoveryLog('error', 'Request timed out (10s)', { endpoint });
            throw new Error('TIMEOUT');
        }
        if (error.message === 'Failed to fetch') {
            recoveryLog('error', 'Network unreachable', { endpoint });
            throw new Error('NETWORK_ERROR');
        }
        throw error;
    }
}

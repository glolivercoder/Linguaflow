/**
 * Pixabay API Rate Limiter
 * 
 * Implements rate limiting to respect Pixabay's API limits:
 * - 5,000 requests per hour (default free tier)
 * - We'll be conservative and limit to 4,500 requests/hour to leave a safety margin
 * - Implements a queue system to batch and throttle requests
 * - Caches results for 24 hours as recommended by Pixabay
 */

import { addPixabayLog } from './pixabayLogger';

interface QueuedRequest {
    query: string;
    resolve: (urls: string[]) => void;
    reject: (error: Error) => void;
    timestamp: number;
}

interface CacheEntry {
    urls: string[];
    cachedAt: number;
}

// Rate limiting configuration
const MAX_REQUESTS_PER_HOUR = 4500; // Conservative limit (Pixabay allows 5000)
const MAX_REQUESTS_PER_MINUTE = 75;  // 4500/60 = 75 requests per minute
const MIN_REQUEST_INTERVAL_MS = 800; // Minimum 800ms between requests (75 req/min = 800ms interval)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours as recommended by Pixabay

class PixabayRateLimiter {
    private requestQueue: QueuedRequest[] = [];
    private isProcessing = false;
    private requestHistory: number[] = []; // Timestamps of recent requests
    private cache: Map<string, CacheEntry> = new Map();
    private lastRequestTime = 0;

    /**
     * Add a request to the queue
     */
    async queueRequest(query: string): Promise<string[]> {
        // Check cache first
        const cached = this.getFromCache(query);
        if (cached) {
            addPixabayLog('info', 'Returning cached Pixabay results', {
                query,
                cacheAge: Date.now() - cached.cachedAt
            });
            return cached.urls;
        }

        // Create a promise that will be resolved when the request is processed
        return new Promise<string[]>((resolve, reject) => {
            this.requestQueue.push({
                query,
                resolve,
                reject,
                timestamp: Date.now()
            });

            addPixabayLog('info', 'Request queued', {
                query,
                queueLength: this.requestQueue.length,
                estimatedWaitTime: this.estimateWaitTime()
            });

            // Start processing if not already running
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    /**
     * Process the request queue with rate limiting
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            // Check if we've hit the hourly limit
            if (!this.canMakeRequest()) {
                const waitTime = this.getWaitTimeUntilNextSlot();
                addPixabayLog('warn', 'Rate limit reached, waiting', {
                    waitTimeMs: waitTime,
                    queueLength: this.requestQueue.length
                });

                await this.delay(waitTime);
                continue;
            }

            // Ensure minimum interval between requests
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
                await this.delay(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
            }

            // Process the next request
            const request = this.requestQueue.shift();
            if (request) {
                await this.executeRequest(request);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Execute a single request
     */
    private async executeRequest(request: QueuedRequest): Promise<void> {
        try {
            // Import the internal search function to avoid circular dependency
            const { searchImagesInternal } = await import('./pixabayService');

            this.lastRequestTime = Date.now();
            this.requestHistory.push(this.lastRequestTime);
            this.cleanupRequestHistory();

            const urls = await searchImagesInternal(request.query);

            // Cache the result
            this.addToCache(request.query, urls);

            request.resolve(urls);

            addPixabayLog('info', 'Request completed successfully', {
                query: request.query,
                resultCount: urls.length,
                queueLength: this.requestQueue.length,
                requestsInLastHour: this.requestHistory.length
            });
        } catch (error) {
            addPixabayLog('error', 'Request failed', {
                query: request.query,
                error: error instanceof Error ? error.message : String(error)
            });
            request.reject(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Check if we can make a request without exceeding limits
     */
    private canMakeRequest(): boolean {
        this.cleanupRequestHistory();

        const requestsInLastHour = this.requestHistory.length;
        const requestsInLastMinute = this.requestHistory.filter(
            timestamp => Date.now() - timestamp < 60 * 1000
        ).length;

        return requestsInLastHour < MAX_REQUESTS_PER_HOUR &&
            requestsInLastMinute < MAX_REQUESTS_PER_MINUTE;
    }

    /**
     * Calculate how long to wait before the next request can be made
     */
    private getWaitTimeUntilNextSlot(): number {
        this.cleanupRequestHistory();

        if (this.requestHistory.length === 0) {
            return 0;
        }

        // Check minute limit
        const recentRequests = this.requestHistory.filter(
            timestamp => Date.now() - timestamp < 60 * 1000
        );

        if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
            const oldestRecentRequest = Math.min(...recentRequests);
            const waitForMinute = 60 * 1000 - (Date.now() - oldestRecentRequest);
            return Math.max(0, waitForMinute);
        }

        // Check hour limit
        if (this.requestHistory.length >= MAX_REQUESTS_PER_HOUR) {
            const oldestRequest = Math.min(...this.requestHistory);
            const waitForHour = 60 * 60 * 1000 - (Date.now() - oldestRequest);
            return Math.max(0, waitForHour);
        }

        return MIN_REQUEST_INTERVAL_MS;
    }

    /**
     * Remove requests older than 1 hour from history
     */
    private cleanupRequestHistory(): void {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.requestHistory = this.requestHistory.filter(timestamp => timestamp > oneHourAgo);
    }

    /**
     * Estimate wait time for queued requests
     */
    private estimateWaitTime(): number {
        if (this.requestQueue.length === 0) return 0;

        const requestsAhead = this.requestQueue.length;
        const avgTimePerRequest = MIN_REQUEST_INTERVAL_MS;

        return requestsAhead * avgTimePerRequest;
    }

    /**
     * Get cached result if available and not expired
     */
    private getFromCache(query: string): CacheEntry | null {
        const normalized = query.trim().toLowerCase();
        const cached = this.cache.get(normalized);

        if (!cached) return null;

        const age = Date.now() - cached.cachedAt;
        if (age > CACHE_DURATION_MS) {
            this.cache.delete(normalized);
            return null;
        }

        return cached;
    }

    /**
     * Add result to cache
     */
    private addToCache(query: string, urls: string[]): void {
        const normalized = query.trim().toLowerCase();
        this.cache.set(normalized, {
            urls,
            cachedAt: Date.now()
        });

        // Cleanup old cache entries periodically
        if (this.cache.size > 500) {
            this.cleanupCache();
        }
    }

    /**
     * Remove expired entries from cache
     */
    private cleanupCache(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((entry, key) => {
            if (now - entry.cachedAt > CACHE_DURATION_MS) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));

        addPixabayLog('info', 'Cache cleanup completed', {
            removedEntries: keysToDelete.length,
            remainingEntries: this.cache.size
        });
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current rate limit stats
     */
    getStats() {
        this.cleanupRequestHistory();
        return {
            queueLength: this.requestQueue.length,
            requestsInLastHour: this.requestHistory.length,
            requestsInLastMinute: this.requestHistory.filter(
                t => Date.now() - t < 60 * 1000
            ).length,
            cacheSize: this.cache.size,
            canMakeRequest: this.canMakeRequest(),
            estimatedWaitTime: this.estimateWaitTime()
        };
    }

    /**
     * Clear all cached data
     */
    clearCache(): void {
        this.cache.clear();
        addPixabayLog('info', 'Cache cleared manually');
    }
}

// Singleton instance
const rateLimiter = new PixabayRateLimiter();

/**
 * Search images with automatic rate limiting and caching
 */
export const searchImagesWithRateLimit = async (query: string): Promise<string[]> => {
    return rateLimiter.queueRequest(query);
};

/**
 * Get current rate limiter statistics
 */
export const getPixabayStats = () => rateLimiter.getStats();

/**
 * Clear the cache manually
 */
export const clearPixabayCache = () => rateLimiter.clearCache();

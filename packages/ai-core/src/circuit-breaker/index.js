"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitOpenError = exports.CircuitBreaker = void 0;
exports.withRetry = withRetry;
const utils_1 = require("../../../shared/src/utils");
const DEFAULT_CONFIG = {
    failureThreshold: 5,
    successThreshold: 2,
    cooldownMs: 120_000, // 2 minutes
    requestTimeout: 30_000, // 30 seconds
};
// ─────────────────────────────────────────────────────────────────
// CIRCUIT BREAKER
// ─────────────────────────────────────────────────────────────────
class CircuitBreaker {
    state = 'CLOSED';
    failures = 0;
    successes = 0;
    lastFailureAt = null;
    totalRequests = 0;
    totalFailures = 0;
    config;
    name;
    constructor(name, config = {}) {
        this.name = name;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async execute(fn) {
        this.totalRequests++;
        if (this.state === 'OPEN') {
            if (!this.shouldAttemptReset()) {
                throw new CircuitOpenError(this.name);
            }
            this.transitionTo('HALF_OPEN');
        }
        try {
            const result = await this.withTimeout(fn(), this.config.requestTimeout);
            this.onSuccess();
            return result;
        }
        catch (error) {
            if (error instanceof CircuitOpenError)
                throw error;
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        if (this.state === 'HALF_OPEN') {
            this.successes++;
            if (this.successes >= this.config.successThreshold) {
                this.transitionTo('CLOSED');
            }
        }
    }
    onFailure() {
        this.failures++;
        this.totalFailures++;
        this.lastFailureAt = Date.now();
        if (this.state === 'CLOSED' &&
            this.failures >= this.config.failureThreshold) {
            this.transitionTo('OPEN');
        }
        else if (this.state === 'HALF_OPEN') {
            this.transitionTo('OPEN');
        }
    }
    transitionTo(next) {
        this.state = next;
        this.successes = 0;
        if (next === 'CLOSED') {
            this.failures = 0;
        }
    }
    shouldAttemptReset() {
        if (this.lastFailureAt === null)
            return true;
        return Date.now() - this.lastFailureAt >= this.config.cooldownMs;
    }
    withTimeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Circuit breaker timeout after ${ms}ms`)), ms)),
        ]);
    }
    isAvailable() {
        return (this.state === 'CLOSED' ||
            (this.state === 'OPEN' && this.shouldAttemptReset()));
    }
    getStats() {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureAt: this.lastFailureAt,
            totalRequests: this.totalRequests,
            totalFailures: this.totalFailures,
        };
    }
    reset() {
        this.state = 'CLOSED';
        this.failures = 0;
        this.successes = 0;
        this.lastFailureAt = null;
    }
}
exports.CircuitBreaker = CircuitBreaker;
class CircuitOpenError extends Error {
    provider;
    constructor(provider) {
        super(`Circuit breaker OPEN for provider: ${provider}`);
        this.name = 'CircuitOpenError';
        this.provider = provider;
    }
}
exports.CircuitOpenError = CircuitOpenError;
const DEFAULT_RETRY = {
    maxAttempts: 3,
    baseDelayMs: 1_000,
    maxDelayMs: 10_000,
    jitter: true,
};
async function withRetry(fn, config = {}) {
    const cfg = { ...DEFAULT_RETRY, ...config };
    let lastError = new Error('Unknown error');
    for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === cfg.maxAttempts)
                break;
            const exponential = cfg.baseDelayMs * Math.pow(2, attempt - 1);
            const capped = Math.min(exponential, cfg.maxDelayMs);
            const jitter = cfg.jitter ? Math.random() * 0.3 * capped : 0;
            const delay = Math.floor(capped + jitter);
            await (0, utils_1.sleep)(delay);
        }
    }
    throw lastError;
}
//# sourceMappingURL=index.js.map
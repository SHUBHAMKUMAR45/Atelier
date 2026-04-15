export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    cooldownMs: number;
    requestTimeout: number;
}
export interface CircuitBreakerStats {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureAt: number | null;
    totalRequests: number;
    totalFailures: number;
}
export declare class CircuitBreaker {
    private state;
    private failures;
    private successes;
    private lastFailureAt;
    private totalRequests;
    private totalFailures;
    private readonly config;
    private readonly name;
    constructor(name: string, config?: Partial<CircuitBreakerConfig>);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private transitionTo;
    private shouldAttemptReset;
    private withTimeout;
    isAvailable(): boolean;
    getStats(): CircuitBreakerStats;
    reset(): void;
}
export declare class CircuitOpenError extends Error {
    readonly provider: string;
    constructor(provider: string);
}
export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitter: boolean;
}
export declare function withRetry<T>(fn: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
//# sourceMappingURL=index.d.ts.map
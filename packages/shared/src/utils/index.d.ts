export declare function hashCacheKey(parts: Record<string, unknown>): string;
export declare function hashRequestId(userId: string, occasion: string, weatherSnapshot: {
    temp: number;
    condition: string;
}, profileSnapshot: {
    budget: string;
    styles: string[];
}): string;
export declare function sanitizeString(input: string, maxLen?: number): string;
export declare function sanitizeUserInput(data: Record<string, unknown>): Record<string, unknown>;
export declare function extractJSON(text: string): unknown | null;
export declare function todayDateString(): string;
export declare function addHours(date: Date, hours: number): Date;
export declare function addDays(date: Date, days: number): Date;
export declare function addMinutes(date: Date, minutes: number): Date;
export declare function sleep(ms: number): Promise<void>;
export declare function generateTraceId(): string;
//# sourceMappingURL=index.d.ts.map
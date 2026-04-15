"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashCacheKey = hashCacheKey;
exports.hashRequestId = hashRequestId;
exports.sanitizeString = sanitizeString;
exports.sanitizeUserInput = sanitizeUserInput;
exports.extractJSON = extractJSON;
exports.todayDateString = todayDateString;
exports.addHours = addHours;
exports.addDays = addDays;
exports.addMinutes = addMinutes;
exports.sleep = sleep;
exports.generateTraceId = generateTraceId;
const crypto_1 = require("crypto");
// ─────────────────────────────────────────────────────────────────
// HASH UTILITIES
// ─────────────────────────────────────────────────────────────────
function hashCacheKey(parts) {
    const normalized = JSON.stringify(parts, Object.keys(parts).sort());
    return (0, crypto_1.createHash)('sha256').update(normalized).digest('hex').slice(0, 32);
}
function hashRequestId(userId, occasion, weatherSnapshot, profileSnapshot) {
    // Bucket temperature to nearest 5°C to increase cache hits
    const tempBucket = Math.round(weatherSnapshot.temp / 5) * 5;
    return hashCacheKey({
        userId,
        occasion,
        temp: tempBucket,
        condition: weatherSnapshot.condition,
        budget: profileSnapshot.budget,
        styles: [...profileSnapshot.styles].sort(),
    });
}
// ─────────────────────────────────────────────────────────────────
// INPUT SANITIZATION (Prompt Injection Defense)
// ─────────────────────────────────────────────────────────────────
const INJECTION_PATTERNS = [
    /ignore\s+(previous|all|above)\s+instructions?/gi,
    /system\s*prompt/gi,
    /you\s+are\s+now/gi,
    /act\s+as\s+(a|an)?/gi,
    /forget\s+(everything|all)/gi,
    /\[\s*system\s*\]/gi,
    /<\s*system\s*>/gi,
    /###\s*instruction/gi,
    /prompt\s*injection/gi,
    /jailbreak/gi,
    /DAN\s*mode/gi,
    /do\s+anything\s+now/gi,
];
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const MAX_FIELD_LENGTH = 500;
function sanitizeString(input, maxLen = MAX_FIELD_LENGTH) {
    // 1. Truncate
    let cleaned = input.slice(0, maxLen);
    // 2. Remove control characters
    cleaned = cleaned.replace(CONTROL_CHARS, '');
    // 3. Neutralize injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        cleaned = cleaned.replace(pattern, '[REDACTED]');
    }
    // 4. Trim whitespace
    return cleaned.trim();
}
function sanitizeUserInput(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            result[key] = sanitizeString(value);
        }
        else if (Array.isArray(value)) {
            result[key] = value.map((item) => typeof item === 'string' ? sanitizeString(item) : item);
        }
        else if (value !== null && typeof value === 'object') {
            result[key] = sanitizeUserInput(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
// ─────────────────────────────────────────────────────────────────
// JSON EXTRACTION (LLM output recovery)
// ─────────────────────────────────────────────────────────────────
function extractJSON(text) {
    // Strategy 1: Direct parse
    try {
        return JSON.parse(text);
    }
    catch { /* continue */ }
    // Strategy 2: Extract from markdown fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch?.[1]) {
        try {
            return JSON.parse(fenceMatch[1].trim());
        }
        catch { /* continue */ }
    }
    // Strategy 3: Find first {...} block
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch?.[0]) {
        try {
            return JSON.parse(braceMatch[0]);
        }
        catch { /* continue */ }
    }
    return null;
}
// ─────────────────────────────────────────────────────────────────
// DATE UTILITIES
// ─────────────────────────────────────────────────────────────────
function todayDateString() {
    return new Date().toISOString().split('T')[0];
}
function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}
// ─────────────────────────────────────────────────────────────────
// SLEEP UTILITY
// ─────────────────────────────────────────────────────────────────
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// ─────────────────────────────────────────────────────────────────
// GENERATE TRACE ID
// ─────────────────────────────────────────────────────────────────
function generateTraceId() {
    return (0, crypto_1.createHash)('sha256')
        .update(`${Date.now()}-${Math.random()}`)
        .digest('hex')
        .slice(0, 16);
}
//# sourceMappingURL=index.js.map
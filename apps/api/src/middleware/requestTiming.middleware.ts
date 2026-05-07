// requestTiming.middleware.ts — REMOVED
// X-Response-Time header and nanosecond-precision timing are now handled
// directly inside requestLogger in middleware/index.ts using process.hrtime.bigint().
// This file is kept as an empty module to avoid breaking any stale imports during transition.

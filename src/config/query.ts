/** Default stale time for queries (1 hour) */
export const DEFAULT_STALE_TIME = 60 * 60 * 1000;

/**
 * Stale time for data that other users mutate concurrently (bookings, event availability).
 * Kept short so spot counts and booking state stay fresh (30 seconds).
 */
export const VOLATILE_STALE_TIME = 30 * 1000;

/** Stale time for collection queries (infinite) */
export const COLLECTION_STALE_TIME = Infinity;

/** Duration for toast notifications in ms */
export const TOAST_DURATION = 8000;

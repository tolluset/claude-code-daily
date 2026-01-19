// API and service constants
export const API_V1 = '/api/v1';
export const SERVER_PORT = 3847;
export const DASHBOARD_PORT = 3848;

// Timeout constants
export const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
export const DEFAULT_IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
export const MIN_SESSION_AGE_BEFORE_CLEANUP_MS = 10 * 60 * 1000; // 10 minutes

// Data processing constants
export const SUMMARY_MAX_LENGTH = 100;
export const DEFAULT_STATS_DAYS = 7;

// Server health check constants
export const HEALTH_CHECK_TIMEOUT_MS = 2000;
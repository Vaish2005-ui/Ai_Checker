/**
 * config.ts — Centralized configuration for the dashboard
 * ========================================================
 * Uses NEXT_PUBLIC_API_URL env var in production,
 * falls back to localhost:8000 for local development.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

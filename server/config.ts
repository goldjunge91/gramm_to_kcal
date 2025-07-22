import { env } from "@/lib/env";

// Allgemeine App-Konstanten
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_RECENT_SCANS = 20;
export const RECENT_SCANS_KEY = env.RECENT_SCANS_KEY!;
export const MAX_BARCODE_LENGTH = 13;
// Zeit-Konstanten
export const ONE_MINUTE_MS = 60 * 1000;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

// Gruppiert nach Bereich
export const SCAN_CONFIG = {
    maxRecent: MAX_RECENT_SCANS,
    //   storageKey: SCAN_STORAGE_KEY,
    maxBarcodeLength: MAX_BARCODE_LENGTH,
};

export const API_CONFIG = {
    defaultPageSize: DEFAULT_PAGE_SIZE,
    timeoutMs: 10_000,
};

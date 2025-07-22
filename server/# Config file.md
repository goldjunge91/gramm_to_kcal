# Config file.

## How to use this file

This file is used to define constants and environment variables for the application.

```ts
import { API_CONFIG, MAX_RECENT_SCANS, SCAN_CONFIG } from '@/server/config'

// Direkt als Wert:
```

console.log("Max recent scans:", MAX_RECENT_SCANS);

```

// Aus dem Gruppen-Objekt:
```

console.log(
"Scan-Konfiguration:",
SCAN_CONFIG.maxRecent,
SCAN_CONFIG.maxBarcodeLength,
);

// In einer Funktion:
function getRecentScansLimit() {
return SCAN_CONFIG.maxRecent;
}

function fetchData() {
// z.B. für ein API-Timeout
setTimeout(() => {
// ...fetch logic...
}, API_CONFIG.timeoutMs);
}

```

```

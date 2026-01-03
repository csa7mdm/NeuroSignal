# Project 360° Review

**Date**: October 26, 2023
**Scope**: Architecture, Code Quality, Performance, Security

## Executive Summary
NeuroSignal is a robust **Proof of Concept (PoC)** for a browser-based behavioral analysis tool. It demonstrates sophisticated integration of Real-time UI, AI Services, and Data Visualization. However, its reliance on `localStorage` for image persistence and the lack of a true ML inference engine (currently simulated) limits its use to demonstration and training purposes.

## 🚨 Top Risks

1.  **Storage Quota Exceeded (Critical)**
    *   **Evidence**: `FrameSnapshot` stores Base64 images in `localStorage`.
    *   **Impact**: App will crash or fail to save sessions after 5-10 snapshots.
    *   **Fix**: Migrate to **IndexedDB** for blob storage.

2.  **API Key Security (High)**
    *   **Evidence**: OpenRouter keys are stored in `localStorage` and sent from the client.
    *   **Impact**: Keys are exposed to XSS attacks or malicious extensions.
    *   **Fix**: Proxy AI calls through a lightweight backend (Serverless Function).

3.  **Performance / Memory Leak (Medium)**
    *   **Evidence**: `sessionData` array grows indefinitely during recording.
    *   **Impact**: Long sessions (>30 mins) will degrade UI performance due to React re-rendering large arrays.
    *   **Fix**: Implement windowing for charts and data decimation for long-term storage.

4.  **Simulation vs. Reality (Product)**
    *   **Evidence**: `AnalysisDisplay.tsx` uses `Math.random()` for metrics.
    *   **Impact**: Tool is effectively a toy until real TensorFlow.js / MediaPipe models are integrated.

## 📈 Top Improvements

| Improvement | Impact | Effort | Description |
|-------------|--------|--------|-------------|
| **Integrate MediaPipe** | High | High | Replace random simulation with real Face Mesh / Iris tracking. |
| **IndexedDB Adapter** | High | Medium | Replace `localStorage` persistence layer. |
| **Service Worker Cache** | Medium | Low | Improve offline reliability (already partially present). |
| **Virtual Scrolling** | Medium | Low | Optimize Chat and Journal lists for performance. |

## Documentation Updates
*   Added `ARCHITECTURE.md` to clarify system boundaries.
*   Added `DATA_MODEL.md` to highlight the storage schema and risks.
*   Created `llm/` context pack for future AI agents.

## Verification Status
*   **Auth**: Simulated (Mock ID). TODO: Integrate Firebase/Supabase.
*   **AI**: Functional (Gemini + OpenRouter fallback verified via code review).
*   **Offline**: Logic exists, dependent on browser support.

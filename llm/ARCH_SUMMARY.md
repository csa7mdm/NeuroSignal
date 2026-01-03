# Architecture Summary

**Type**: Client-Side PWA (React)
**Hosting**: Static (Buildless / ESM)

## Critical Flows

1.  **Recording Session (Live)**:
    *   `AnalysisDisplay` (Camera Mode) -> `setInterval` -> Update `currentMetrics` -> Push to `sessionData`.

2.  **Validation Session (Video Upload)**:
    *   `AnalysisDisplay` (File Mode) -> User Selects File -> `video.play()` -> `isRecording=true` -> `setInterval` -> Sync metrics with playback.

3.  **Generating Insight**:
    *   User Chat -> `geminiService.generateSessionInsight` -> Google GenAI SDK -> UI.
    *   *Fallback*: Google GenAI Error -> `geminiService` catches -> Calls OpenRouter REST API.

4.  **Saving Data**:
    *   `AnalysisDisplay` Stop -> Calculate Averages -> `localStorage.setItem('neurosignal_journal')`.

## Key Integration Points
*   **Google Gemini**: `ai.models.generateContent`
*   **OpenRouter**: `POST https://openrouter.ai/api/v1/chat/completions`
*   **Hardware**: `navigator.mediaDevices.getUserMedia`
*   **Inputs**: `HTMLVideoElement` (supports both MediaStream and Blob URL)

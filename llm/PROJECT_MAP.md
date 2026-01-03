# Project Map

## Entry Points
*   `index.html`: Shell, Import Map (Dependency Management), Global Styles.
*   `index.tsx`: React Root, AuthProvider injection.
*   `App.tsx`: Main Router/Layout (Sidebar + View Switching).

## Components (Views)
*   `components/AnalysisDisplay.tsx`: **[CORE]** The main dashboard. Handles Live Camera and Simulation Loop.
*   `components/VideoAnalysis.tsx`: **[NEW]** Physically accurate video file analysis using heuristics (Motion+Audio).
*   `components/Journal.tsx`: History view. Tables/Lists of past sessions.
*   `components/Library.tsx`: Static educational content (Body Language dictionary).
*   `components/Training.tsx`: Interactive quiz mode with AI-generated photorealistic images.
*   `components/Settings.tsx`: API Key configuration (OpenRouter).

## Services & Logic
*   `services/geminiService.ts`: **[CORE]** Handles all AI communications (Text & Image Gen).
*   `contexts/AuthContext.tsx`: Mock Authentication logic.
*   `types.ts`: TypeScript definitions. **Single Source of Truth** for Data Models.

## Configuration
*   `constants.ts`: Translations (`en`/`ar`), Mock Data, Library Content.
*   `metadata.json` / `manifest.json`: PWA Configuration.

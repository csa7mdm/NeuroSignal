# Work Rules

1.  **Docs as Code**:
    *   If you change `types.ts`, you MUST update `docs/DATA_MODEL.md`.
    *   If you change `geminiService.ts`, check if `docs/ARCHITECTURE.md` needs flow updates.

2.  **No Hallucinations**:
    *   Do not import packages (e.g., `axios`, `framer-motion`) unless they are explicitly in the `importmap` in `index.html`.
    *   We use `fetch`, not `axios`.
    *   We use `Recharts`, not `Chart.js`.

3.  **UI/UX**:
    *   Maintain the **Cyberpunk/Dark Mode** aesthetic (Slate-950 background, Primary-500 accents).
    *   Always ensure the UI is responsive (Mobile vs Desktop layouts in `AnalysisDisplay.tsx`).

4.  **Performance**:
    *   Be wary of the `simulationLoop` (1000ms interval). Heavy logic here freezes the UI.
    *   Do not store full-resolution images in `snapshots`.

5.  **Localization**:
    *   All UI strings must be pulled from `TRANSLATIONS` in `constants.ts`. Do not hardcode English strings in components.

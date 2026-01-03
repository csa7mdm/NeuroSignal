# LLM Context: NeuroSignal

**Goal**: You are working on "NeuroSignal", a React-based PWA for body language analysis.

## 🧠 Mental Model
*   **It's a "Smart Mirror"**: The user looks at the camera; the app provides real-time gauges and graphs.
*   **It's a Journal**: Sessions are recorded and saved for review.
*   **It's an AI Assistant**: Users can chat with the data using Gemini.

## 🗺️ Navigation
*   **Start Here**: [PROJECT_MAP.md](./PROJECT_MAP.md) - Where files live.
*   **Rules**: [WORK_RULES.md](./WORK_RULES.md) - How to modify code safely.
*   ** Architecture**: [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System design.

## ⚡ Key Context for Changes
*   **State**: We use `React Context` for Auth, but component-level state for the heavy analysis loop.
*   **Styling**: strict **Tailwind CSS**.
*   **Icons**: **Lucide React** only.
*   **Data**: BE CAREFUL with `localStorage`. Do not add heavy fields to `SessionData` without considering the 5MB limit.

## 🛑 Known Constraints
*   **No Backend**: We cannot run server-side secrets.
*   **Simulation**: The current metrics are random numbers. If asked to "fix the detection", you are likely replacing the `simulationLoop` in `AnalysisDisplay.tsx`.

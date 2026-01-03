# NeuroSignal: Real-Time Behavior Analysis

**NeuroSignal** is a progressive web application (PWA) designed for real-time body language and voice analysis. It leverages browser APIs (Camera, Microphone) and multimodal AI (Google Gemini, OpenRouter) to provide psychological insights, emotion tracking, and behavioral coaching.

## 🚀 Features

- **Real-Time Analysis**: Tracks anxiety, confidence, stress, and deception markers using simulated metrics (extensible to real ML models).
- **Video Validation Mode**: Upload and analyze pre-recorded video files to validate system metrics against known baselines.
- **Eye Tracking**: Monitors gaze deviation, pupil dilation, and blink rate.
- **AI-Powered Insights**: Uses **Google Gemini 1.5/2.0** to generate psychological conclusions and **OpenRouter** as a fallback.
- **Journaling**: Saves session data, snapshots, and metrics to local storage with CSV/PDF export.
- **Training Mode**: Interactive quizzes to improve human detection of micro-expressions.
- **Offline Capable**: PWA support with local heuristics when disconnected.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Visualization**: Recharts
- **Icons**: Lucide React
- **AI**: `@google/genai` SDK
- **Persistence**: `localStorage` (Client-side only)
- **Build**: Browser-native ES Modules (via `esm.sh`)

## 🏃 Quick Start

1. **Clone the repository.**
2. **Environment Setup**:
   - Create a `.env` file (if using a build step) or configure your API keys in the application Settings.
   - Required: `API_KEY` for Google Gemini.
3. **Run**:
   - Serve the directory using any static file server (e.g., `npx serve`, `python -m http.server`).
   - Open `index.html` in a modern browser.

## 🔑 Configuration

- **Gemini API**: Primary intelligence layer.
- **OpenRouter API**: Optional backup layer configured in `Settings`.

## 📂 Project Structure

See [llm/PROJECT_MAP.md](llm/PROJECT_MAP.md) for a detailed breakdown of the codebase.

---
*Documentation maintained by the NeuroSignal Engineering Team.*
# Data Model

NeuroSignal uses a document-based data model stored in the browser's `localStorage` under the key `neurosignal_journal`.

## Core Entities

### 1. SessionData
Represents a single recording session.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique Timestamp-based ID. |
| `userId` | `string` | Link to the User ID. |
| `date` | `ISO String` | Start time of session. |
| `duration` | `number` | Duration in seconds. |
| `timeline` | `EmotionData[]` | Array of time-series data points. |
| `snapshots` | `FrameSnapshot[]` | List of captured images with triggers. |
| `averages` | `Object` | Aggregated stats for the session. |
| `userNotes`| `string?` | Optional user annotations. |

### 2. EmotionData (Time-Series)
A single data point captured every second (1Hz).

```typescript
interface EmotionData {
  timestamp: number;      // Seconds since start
  anxiety: number;        // 0-100
  excitement: number;     // 0-100
  deception: number;      // 0-100 (Calculated probability)
  confidence: number;     // 0-100
  stress: number;         // 0-100
  aggression: number;     // 0-100
  boredom: number;        // 0-100
  empathy: number;        // 0-100
  gazeDeviation: number;  // 0-100 (Eye Tracking)
  pupilDilation: number;  // 0-100 (Eye Tracking)
  blinkRate: number;      // 0-100 (Eye Tracking)
}
```

### 3. FrameSnapshot
Images captured when specific psychological triggers are met (e.g., "High Anxiety").

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique ID. |
| `timestamp`| `number` | Session timestamp. |
| `imageUrl` | `string` | **Base64 encoded JPEG**. |
| `triggerType`| `string` | Reason for capture (e.g., "Deception Hint"). |

## Storage Considerations

*   **Limit**: `localStorage` typically has a 5-10MB limit per origin.
*   **Risk**: Storing `imageUrl` (Base64) in `snapshots` consumes this limit rapidly.
*   **Mitigation**: The app currently stores low-resolution thumbnails (1/4th video size), but long-term usage requires IndexedDB.

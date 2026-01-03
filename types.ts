export type Language = 'en' | 'ar';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface EmotionData {
  timestamp: number;
  anxiety: number;
  excitement: number;
  deception: number;
  confidence: number;
  stress: number;
  aggression: number;
  boredom: number;
  empathy: number;
  gazeDeviation: number;
  pupilDilation: number;
  blinkRate: number;
}

export interface FrameSnapshot {
  id: string;
  timestamp: number;
  imageUrl: string;
  triggerType: string; // e.g., "High Anxiety", "Deception Hint"
}

export interface SessionData {
  id: string;
  userId: string;
  date: string; // ISO string
  duration: number; // seconds
  timeline: EmotionData[];
  snapshots: FrameSnapshot[];
  userNotes?: string;
  title?: string;
  averages: {
    anxiety: number;
    excitement: number;
    deception: number;
    confidence: number;
    stress: number;
    aggression: number;
    boredom: number;
    empathy: number;
    gazeDeviation: number;
    pupilDilation: number;
    blinkRate: number;
  };
}

export interface LibraryItem {
  id: string;
  title: string;
  category: 'body' | 'vocal';
  description: string;
  psychTrigger: string;
  iconName: string; // Mapping to Lucide icon
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  timestamp: number;
}

export interface TrainingQuestion {
  id: string;
  emotion: string;
  description: string;
  options: string[];
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}
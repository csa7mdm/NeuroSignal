import { GoogleGenAI } from "@google/genai";
import { SessionData, ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSessionInsight = async (
  query: string, 
  sessionData: Partial<SessionData>,
  history: ChatMessage[]
): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please check your configuration.";
  }

  // Summarize the timeline to avoid massive token usage if long session
  // We take every Nth point or calculate averages
  const timelineSummary = sessionData.timeline?.filter((_, i) => i % 5 === 0).map(t => 
    `Time: ${t.timestamp}s | Anx: ${t.anxiety.toFixed(0)} | Stress: ${t.stress.toFixed(0)} | Conf: ${t.confidence.toFixed(0)}`
  ).join('\n');

  const contextPrompt = `
    You are an expert Body Language and Voice Analyst AI.
    You are analyzing a user's session data.
    
    Session Summary:
    Total Duration: ${sessionData.duration} seconds.
    Averages: 
    - Anxiety: ${sessionData.averages?.anxiety.toFixed(1)}
    - Stress: ${sessionData.averages?.stress.toFixed(1)}
    - Confidence: ${sessionData.averages?.confidence.toFixed(1)}
    - Deception Hints: ${sessionData.averages?.deception.toFixed(1)}

    Timeline Data Sample (every 5 seconds):
    ${timelineSummary}

    User Question: "${query}"

    Answer the user specifically based on the data. Keep it concise, professional, and insightful.
    If the user asks "Why did X happen at Y time?", look at the timeline around that timestamp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contextPrompt,
    });
    return response.text || "Could not generate an analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error analyzing the data.";
  }
};

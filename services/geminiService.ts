import { GoogleGenAI } from "@google/genai";
import { SessionData, ChatMessage, OpenRouterModel } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define OpenRouter models by priority.
// 1. Primary: Xiaomi Mimo
// 2. Backup: Nex-AGI Deepseek
const OPENROUTER_MODELS = [
  'xiaomi/mimo-v2-flash:free',
  'nex-agi/deepseek-v3.1-nex-n1:free'
];

interface InsightResponse {
  text: string;
  imageUrl?: string;
  source?: 'gemini' | 'openrouter' | 'local';
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch available models from OpenRouter
export async function getOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data || [];
  } catch (e) {
    console.error("Failed to fetch models", e);
    return [];
  }
}

// Call OpenRouter API (OpenAI Compatible) with Model Fallback
async function callOpenRouter(
  prompt: string, 
  history: ChatMessage[],
  openRouterKey: string
): Promise<string> {
  // Filter and map history to ensure valid OpenAI format
  const validHistory = history
    .filter(msg => msg.text && msg.text.trim().length > 0) // Remove empty messages
    .map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text || "..." // Fallback for safety, though filter should catch it
    }));

  const messages = [
    { 
      role: 'system', 
      content: 'You are an expert Body Language and Voice Analyst AI. Output strict markdown.' 
    },
    ...validHistory,
    { role: 'user', content: prompt }
  ];

  let lastError: any = null;

  // Determine model order: Saved Model -> Defaults
  const savedModel = localStorage.getItem('neurosignal_openrouter_model');
  const modelsToTry = [...OPENROUTER_MODELS];
  
  if (savedModel) {
    // Remove it if it's already in defaults to avoid duplicates
    const index = modelsToTry.indexOf(savedModel);
    if (index > -1) {
      modelsToTry.splice(index, 1);
    }
    // Add to front as priority
    modelsToTry.unshift(savedModel);
  }

  // Iterate through defined models
  for (const model of modelsToTry) {
    try {
      console.log(`Attempting OpenRouter call with model: ${model}`);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://neurosignal.app", // Required by OpenRouter
          "X-Title": "NeuroSignal" // Required by OpenRouter
        },
        body: JSON.stringify({
          "model": model,
          "messages": messages,
          "temperature": 0.7,
          "max_tokens": 1000
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`OpenRouter Model ${model} failed (${response.status}):`, errorBody);
        throw new Error(`Model ${model} error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response content from OpenRouter.";

    } catch (err) {
      console.warn(`Failed to call OpenRouter model ${model}:`, err);
      lastError = err;
      // Continue to next model in loop
    }
  }

  // If loop completes without return, throw the last error
  console.error("All OpenRouter backup models failed.");
  throw lastError || new Error("All OpenRouter models failed.");
}

// Robust wrapper for API calls with exponential backoff
async function callGeminiWithRetry(
  model: string, 
  contents: any, 
  config: any = {}, 
  retries = 2
): Promise<any> {
  if (!navigator.onLine) {
    throw new Error('OFFLINE_MODE');
  }

  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config
      });
    } catch (error: any) {
      // Check for rate limit errors (429) or Service Unavailable (503)
      const isRateLimit = error?.status === 429 || error?.code === 429 || (error?.message && error.message.includes('429'));
      const isServiceError = error?.status === 503;
      
      if (isRateLimit || isServiceError) {
         if (i < retries - 1) {
             const waitTime = Math.pow(2, i) * 1000 + Math.random() * 500; 
             console.warn(`Gemini API issue (${error.status}). Retrying in ${Math.round(waitTime)}ms...`);
             await delay(waitTime);
             continue;
         }
      }
      throw error;
    }
  }
}

// Generate a photorealistic training image
export async function generateTrainingImage(description: string, difficulty: 'easy' | 'hard'): Promise<string | null> {
    if (!apiKey || !navigator.onLine) return null;

    const nuance = difficulty === 'hard' ? 'extremely subtle, micro-expression, cinematic lighting' : 'obvious expression, clear lighting';
    const prompt = `Photorealistic portrait of a human face showing ${description}. The expression should be ${nuance}. High resolution, photography style.`;

    try {
        const response = await callGeminiWithRetry(
            'gemini-2.5-flash-image',
            { parts: [{ text: prompt }] },
            { imageConfig: { aspectRatio: "4:3" } },
            1
        );

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error("Failed to generate training image", e);
    }
    return null;
}

// Local Fallback logic when offline
function generateLocalInsight(sessionData: Partial<SessionData>): string {
    const anx = sessionData.averages?.anxiety || 0;
    const dec = sessionData.averages?.deception || 0;
    const conf = sessionData.averages?.confidence || 0;
    const agg = sessionData.averages?.aggression || 0;

    let insight = "🔴 **OFFLINE MODE**: _Cloud analysis is unavailable. Showing local heuristics._\n\n";
    
    insight += "**Key Observations:**\n";
    if (anx > 60) insight += `- **High Anxiety Detected (${anx.toFixed(0)}%)**: Subject appears nervous or uncomfortable.\n`;
    if (dec > 50) insight += `- **Potential Deception (${dec.toFixed(0)}%)**: Multiple stress markers align with deceptive patterns.\n`;
    if (conf > 70) insight += `- **High Confidence (${conf.toFixed(0)}%)**: Subject is exhibiting authoritative body language.\n`;
    if (agg > 60) insight += `- **Hostility Detected (${agg.toFixed(0)}%)**: Signs of aggression or dominance are present.\n`;
    
    insight += "\n**Summary:**\n";
    if (anx > conf) {
        insight += "Subject is currently overwhelmed by stress factors.";
    } else {
        insight += "Subject is maintaining composure despite environmental pressure.";
    }

    return insight;
}

export const generateSessionInsight = async (
  query: string, 
  sessionData: Partial<SessionData>,
  history: ChatMessage[]
): Promise<InsightResponse> => {
  
  // 1. OFFLINE CHECK
  if (!navigator.onLine) {
    return {
        text: generateLocalInsight(sessionData),
        source: 'local'
    };
  }

  if (!apiKey) {
    return { text: "API Key is missing. Please check your configuration.", source: 'local' };
  }

  const sampleRate = (sessionData.timeline?.length || 0) > 100 ? 10 : 5;
  const timelineSummary = sessionData.timeline?.filter((_, i) => i % sampleRate === 0).map(t => 
    `T:${t.timestamp}s|Anx:${t.anxiety.toFixed(0)}|Str:${t.stress.toFixed(0)}|Con:${t.confidence.toFixed(0)}|Dec:${t.deception.toFixed(0)}|Agg:${t.aggression?.toFixed(0) || 0}|Bored:${t.boredom?.toFixed(0) || 0}`
  ).join('\n');

  const contextPrompt = `
    You are an expert Body Language and Voice Analyst AI.
    
    Session Data:
    - Anxiety Avg: ${sessionData.averages?.anxiety?.toFixed(1) || 0}
    - Stress Avg: ${sessionData.averages?.stress?.toFixed(1) || 0}
    - Deception Hints: ${sessionData.averages?.deception?.toFixed(1) || 0}
    - Confidence Avg: ${sessionData.averages?.confidence?.toFixed(1) || 0}
    - Aggression Avg: ${sessionData.averages?.aggression?.toFixed(1) || 0}
    - Boredom Avg: ${sessionData.averages?.boredom?.toFixed(1) || 0}
    - Empathy/Rapport Avg: ${sessionData.averages?.empathy?.toFixed(1) || 0}
    - Eye Tracking - Gaze Aversion Avg: ${sessionData.averages?.gazeDeviation?.toFixed(1) || 0}%
    - Eye Tracking - Pupil Dilation Avg: ${sessionData.averages?.pupilDilation?.toFixed(1) || 0}%
    - Eye Tracking - Blink Rate Avg: ${sessionData.averages?.blinkRate?.toFixed(1) || 0}%
    
    - Timeline Summary (sampled every ${sampleRate}s): 
    ${timelineSummary}

    User Question: "${query}"

    Instructions:
    1. STRUCTURE YOUR ANSWER:
       - **### Analysis**: A direct, data-backed answer to the user's question.
       - **### Psychological Mechanism**: If explaining a reaction, provide a flow using arrows (e.g. Stimulus -> Amygdala Response -> Micro-Expression).
       - **### Key Signals**: A bulleted list of specific things to look for.
    2. Be concise but educational.
    3. VISUAL EXAMPLE: If specific body language is relevant, end your response EXACTLY with: [VISUAL: Photorealistic portrait of a real human face showing {specific_expression}, cinematic lighting, high detail]
  `;

  try {
    // --- PRIMARY: TRY GEMINI ---
    const response = await callGeminiWithRetry('gemini-3-flash-preview', contextPrompt);
    
    let finalText = response.text || "Could not generate an analysis.";
    let generatedImageUrl: string | undefined = undefined;

    // Check for Visual Request
    const visualTagRegex = /\[VISUAL: (.*?)\]/;
    const match = finalText.match(visualTagRegex);

    if (match && match[1]) {
      const visualPrompt = match[1];
      finalText = finalText.replace(match[0], '').trim();
      try {
        const imageResponse = await callGeminiWithRetry(
            'gemini-2.5-flash-image', 
            { parts: [{ text: visualPrompt }] }, 
            { imageConfig: { aspectRatio: "4:3" } },
            1 // Minimal retry for images
        );
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (imgError) {
        console.warn("Image generation skipped:", imgError);
      }
    }

    return { text: finalText, imageUrl: generatedImageUrl, source: 'gemini' };

  } catch (error: any) {
    // --- FALLBACK LOGIC ---
    
    // Check if error is related to quota or service availability
    const isQuotaError = error?.status === 429 || error?.code === 429 || (error?.message && error.message.includes('429'));
    const isServiceError = error?.status === 503;

    if (isQuotaError || isServiceError) {
        const openRouterKey = localStorage.getItem('neurosignal_openrouter_key');
        
        if (openRouterKey) {
            try {
                console.log("Gemini quota exceeded. Failing over to OpenRouter...");
                const fallbackText = await callOpenRouter(contextPrompt, history, openRouterKey);
                
                return { 
                    text: fallbackText + "\n\n_Note: Analysis provided by OpenRouter fallback due to high traffic._",
                    source: 'openrouter'
                };
            } catch (orError: any) {
                console.error("Fallback failed:", orError);
                return { 
                    text: `⚠️ **Service Overload**: Both primary and fallback AI services failed. \n\nDebug Info: ${orError.message || 'Unknown Error'}`,
                    source: 'local'
                };
            }
        }

        return { 
            text: "⚠️ **Quota Exceeded**: The standard AI limit has been reached.\n\n💡 **Tip**: Add an OpenRouter Key in **Settings** to enable automatic fallback to free models when this happens.",
            source: 'local'
        };
    }

    // Generic error
    console.error("Gemini API Fatal Error:", error);
    if (error.message === 'OFFLINE_MODE') {
        return { text: generateLocalInsight(sessionData), source: 'local' };
    }
    
    return { text: "Sorry, I encountered an error analyzing the data. Please try again later.", source: 'local' };
  }
};
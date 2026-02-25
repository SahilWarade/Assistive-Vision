import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeScene(base64Image: string, prompt: string): Promise<string> {
  try {
    const base64Data = base64Image.split(',')[1];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        },
        prompt
      ],
      config: {
        systemInstruction: "You are an AI assistant for a visually impaired user. Keep your responses extremely concise, calm, and clear. Use short sentences. Prioritize safety and immediate obstacles.",
        temperature: 0.4,
      }
    });
    return response.text || "I couldn't analyze the scene.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to the vision service.";
  }
}

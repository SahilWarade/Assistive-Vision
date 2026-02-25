export async function analyzeScene(base64Image: string, prompt: string, retries = 2): Promise<string> {
  const base64Data = base64Image.split(',')[1];
  
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          prompt: prompt
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Vision service temporarily unavailable.";
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Fallback to status codes if JSON parsing fails
          if (response.status === 401) errorMessage = "Vision API key invalid.";
          if (response.status === 429) errorMessage = "Vision service rate limit exceeded.";
          if (response.status === 500) errorMessage = "Vision service temporarily unavailable.";
        }
        
        if (i < retries && response.status !== 401) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
          continue;
        }
        return errorMessage;
      }

      const data = await response.json();
      return data.text || "I couldn't analyze the scene.";
      
    } catch (error: unknown) {
      console.error(`Gemini API Error (Attempt ${i + 1}):`, error);
      
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      
      const err = error as Error;
      if (err.name === 'AbortError') {
        return "Network connection issue. Request timed out.";
      }
      return "Network connection issue.";
    }
  }
  
  return "Error connecting to the vision service.";
}

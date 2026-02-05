
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function categorizeItem(itemName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Categorize this shopping item into one short word (e.g., Dairy, Fruits, Meat, Household): "${itemName}"`,
      config: {
        // @fix: Setting thinkingBudget to 0 when using small maxOutputTokens to ensure tokens are used for the final response text.
        maxOutputTokens: 20,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.1,
      },
    });
    return response.text?.trim() || 'General';
  } catch (error) {
    console.error('Categorization error:', error);
    return 'General';
  }
}

export async function getSmartSuggestions(items: string[]): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these items: ${items.join(', ')}, suggest 3 more relevant items for a shopping list.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
}

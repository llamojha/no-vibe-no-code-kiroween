import type { SupportedLocale } from '@/features/locale/translations';
import type { Analysis } from '@/lib/types';
import { getGenAiClient } from '@/lib/server/ai/client';
import { getAnalysisPrompt } from '@/lib/server/ai/prompts';

export const analyzeStartupIdea = async (
  idea: string,
  locale: SupportedLocale,
): Promise<Analysis> => {
  const ai = getGenAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: getAnalysisPrompt(idea, locale),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const rawText = response.text?.trim() ?? '';
    if (!rawText) {
      throw new Error('Empty response from Gemini');
    }

    const markdownMatch = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
    let jsonText = markdownMatch && markdownMatch[2] ? markdownMatch[2] : rawText;

    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(jsonText) as Analysis;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof SyntaxError) {
      throw new Error(
        "Failed to parse the AI's response. The model returned an invalid format.",
      );
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to get analysis from AI. The model may be unable to process this request.');
  }
};

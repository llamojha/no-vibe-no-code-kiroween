import { GoogleGenAI } from '@google/genai';

export const getGenAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable not set. Configure it in Vercel or your local .env file.',
    );
  }
  return new GoogleGenAI({ apiKey });
};

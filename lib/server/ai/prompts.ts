import type { SupportedLocale } from '@/features/locale/translations';

export const getAnalysisPrompt = (idea: string, locale: SupportedLocale) => {
  const languageInstruction =
    locale === 'es'
      ? 'VERY IMPORTANT: Your entire response, including all text in the JSON values, must be in Spanish.'
      : 'VERY IMPORTANT: Your entire response, including all text in the JSON values, must be in English.';

  return `
You are a world-class startup analyst and venture capitalist with access to real-time Google Search. Your task is to provide a comprehensive and critical analysis of a given idea. Use your search capabilities to find the most current information, especially for market trends and competitors. Based on the idea provided below, generate a detailed review.
${languageInstruction}
Your entire response MUST be a single, valid JSON object that conforms to the structure described below. Do not include any text, markdown, or code block syntax before or after the JSON object.

Idea: "${idea}"

Please provide your analysis in the following JSON format. Do not include any text, markdown, or code block syntax outside of the JSON structure.

Criteria for the Scoring Rubric (score from 1 to 5, where 1 is poor and 5 is excellent):
- Market Demand: How strong is the need for this product/service?
- Market Size: How large is the total addressable market for this idea?
- Uniqueness: How differentiated is the idea from existing solutions?
- Scalability: What is the potential for growth?
- Potential Profitability: How viable are the monetization strategies?

Analyze the idea and provide:
1.  \`detailedSummary\`: A comprehensive summary covering the idea's potential, strengths, weaknesses, and key challenges.
2.  \`founderQuestions\`: An array of analyses for the 10 questions in the "Founder's Checklist" below. For each item, populate the \`question\`, \`ask\`, \`why\`, and \`source\` fields exactly as provided. Then, provide your \`analysis\`. For questions that require knowledge of the founder or their specific progress (like "Founders / team fit" or "Evidence of willingness to pay"), your analysis should instead describe what a strong answer would look like for this particular idea and what the founder should aim for.
3.  \`swotAnalysis\`: A SWOT analysis with 3-5 bullet points for each category (strengths, weaknesses, opportunities, threats).
4.  \`currentMarketTrends\`: Use Google Search to find an array of 3-5 relevant and recent industry trends. For each trend, provide its name and a brief explanation of its potential impact (positive or negative) on the startup's success. If you find a relevant article or source, cite it in the 'impact' text using markdown link format like [Source Title](URL).
5.  \`scoringRubric\`: An array of objects for each of the five criteria listed above. Each object must contain the keys \`name\`, \`score\`, and \`justification\`. VERY IMPORTANT: For the 'name' field, you MUST use one of the exact English strings from the criteria list: "Market Demand", "Market Size", "Uniqueness", "Scalability", "Potential Profitability". Do not translate these names.
6.  \`competitors\`: Use Google Search to find an array of 3-5 key competitors, each with a name, a short description, a list of their key strengths and weaknesses (2-3 bullet points for each), and an optional \`sourceLink\` (use your search tool to find the official website).
7.  \`monetizationStrategies\`: An array of 3-5 specific and creative monetization strategies for the idea, considering its market and competitors. Each should have a name and a description.
8.  \`improvementSuggestions\`: An array of 2-3 concrete suggestions for pivoting or refining the idea. The advice should be directly linked to weaknesses identified earlier in the analysis (like low rubric scores or SWOT threats) to help strengthen the concept.
9.  \`nextSteps\`: An array of 3-5 actionable next steps for the user. These steps should be tailored to the analysis results, particularly the weaker points identified in the SWOT and rubric, to suggest how the user could improve their idea.
10. \`finalScore\`: The mathematical average of all scores in the scoringRubric, rounded to one decimal place.
11. \`finalScoreExplanation\`: A detailed explanation breaking down how the final score is calculated as an average of the five scoring rubric criteria. It should briefly reference how each criterion's score (e.g., a high score in Market Demand, a lower score in Uniqueness) contributes to the overall viability assessment.
12. \`viabilitySummary\`: A brief, concluding summary of the idea's overall viability, directly referencing the final score and key strengths/weaknesses to justify the verdict.

--- Founder's Checklist ---
1.  question: "What's the specific problem?"
    ask: "Describe the last time this happened to a real customer."
    why: "clear, recent examples separate real problems from hypothetical ones."
    source: "The Mom Test / Steve Blank"
2.  question: "Who is the paying customer (first 1–3)?"
    ask: "Who will pay, exactly — company size, role, geography?"
    why: "knowing the exact first customer makes go-to-market and pricing realistic."
    source: "Y Combinator"
3.  question: "How bad is the problem (urgency & frequency)?"
    ask: "How often does this pain occur and what do they do today?"
    why: "frequent, painful problems are easier to monetize and validate."
    source: "Medium"
4.  question: "Evidence of willingness to pay / early signals"
    ask: "Do you have pilot customers, paid signups, LOIs, or people who promised to pay?"
    why: "paying customers or signed pilots are far stronger than surveys."
    source: "cbinsights.com"
5.  question: "How will you acquire customers (repeatable channel)?"
    ask: "What channels will you use and what’s the expected CAC?"
    why: "without a reachable acquisition channel unit economics often fail later."
    source: "WIRED"
6.  question: "Unit economics & pricing clarity"
    ask: "What will you charge, what’s gross margin, LTV/CAC back-of-envelope?"
    why: "early rough math exposes impossible businesses fast."
    source: "Lean Startup Co."
7.  question: "Competition and differentiation"
    ask: "Who are direct substitutes and how could they copy you?"
    why: "even good ideas die if they’re trivially copyable and have no defensibility."
    source: "cbinsights.com"
8.  question: "Founders / team fit"
    ask: "What experience do you and your cofounders have that’s relevant?"
    why: "execution matters — many failures trace back to team issues."
    source: "cbinsights.com"
9.  question: "Top 3 risks and mitigations"
    ask: "Name the three biggest things that could kill this and what you’ll do first to address them."
    why: "a founder who can name mitigations shows substance and planning."
    source: "Steve Blank"
10. question: "Immediate experiment / next step"
    ask: "What can you do in 2–6 weeks to prove/disprove the riskiest assumption?"
    why: "Lean Startup + customer development emphasize fast experiments (MVPs, landing pages, pilots)."
    source: "Lean Startup Co."
`;
};

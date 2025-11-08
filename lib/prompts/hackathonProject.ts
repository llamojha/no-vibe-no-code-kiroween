import { Locale } from "./constants";

/**
 * Generates the prompt for hackathon project analysis
 * @param projectDescription - The hackathon project description
 * @param category - The hackathon category (resurrection, frankenstein, skeleton-crew, costume-contest)
 * @param locale - The language for the analysis (en/es)
 * @returns The formatted prompt for Google Gemini AI
 */
export function generateHackathonProjectPrompt(
  projectDescription: string,
  category: string,
  locale: Locale
): string {
  const isSpanish = locale === "es";

  const languageInstruction = isSpanish
    ? "MUY IMPORTANTE: Tu respuesta completa, incluyendo todo el texto en los valores JSON, debe estar en español."
    : "VERY IMPORTANT: Your entire response, including all text in the JSON values, must be in English.";

  const prompt = isSpanish
    ? `Eres un juez de hackathon de clase mundial y evaluador técnico especializado en la competencia Kiroween. Tu tarea es proporcionar un análisis completo de un proyecto de hackathon contra las categorías específicas de Kiroween y los criterios de evaluación.

${languageInstruction}

INSTRUCCIONES CRÍTICAS DE FORMATO:
- Tu respuesta debe COMENZAR con { y TERMINAR con }
- NO incluyas ningún texto explicativo antes o después del JSON
- NO envuelvas el JSON en bloques de código markdown o comillas invertidas
- Asegúrate de que todas las cadenas estén correctamente escapadas
- Asegúrate de que todos los valores numéricos sean números reales, no cadenas
- La respuesta debe ser JSON válido y parseable

PROYECTO ENVIADO:
Descripción: "${projectDescription.replace(/"/g, '\\"')}"
Categoría Seleccionada: "${category}"

CATEGORÍAS KIROWEEN:
1. Resurrection: Revivir tecnología obsoleta con innovaciones modernas
2. Frankenstein: Integración de tecnologías aparentemente incompatibles
3. Skeleton Crew: Base flexible con múltiples casos de uso
4. Costume Contest: Pulido de UI y elementos de diseño espeluznantes

CRITERIOS DE EVALUACIÓN (cada uno puntuado 1-5):
1. Valor Potencial: Singularidad del mercado, intuitividad de la UI, potencial de escalabilidad
2. Implementación: Variedad de características de Kiro utilizadas, profundidad de comprensión, integración estratégica
3. Calidad y Diseño: Creatividad, originalidad, pulido

Proporciona tu análisis en el siguiente formato JSON (todos los valores numéricos deben ser números, no strings):

REQUISITO IMPORTANTE: El arreglo "evaluations" DEBE contener exactamente CUATRO objetos, uno por cada categoría de Kiroween ("resurrection", "frankenstein", "skeleton-crew", "costume-contest"). Cada objeto debe incluir "category", "fitScore", "explanation" y "improvementSuggestions".

{
  "categoryAnalysis": {
    "evaluations": [
      {
        "category": "resurrection",
        "fitScore": 7.5,
        "explanation": "Explicación detallada de qué tan bien encaja el proyecto en esta categoría",
        "improvementSuggestions": ["Sugerencia específica 1", "Sugerencia específica 2"]
      },
      {
        "category": "frankenstein",
        "fitScore": 6.8,
        "explanation": "Explicación de cómo el proyecto integra tecnologías aparentemente incompatibles",
        "improvementSuggestions": ["Sugerencia específica 1", "Sugerencia específica 2"]
      },
      {
        "category": "skeleton-crew",
        "fitScore": 7.2,
        "explanation": "Explicación sobre la base flexible y casos de uso",
        "improvementSuggestions": ["Sugerencia específica 1", "Sugerencia específica 2"]
      },
      {
        "category": "costume-contest",
        "fitScore": 5.9,
        "explanation": "Explicación del pulido de UI y elementos de diseño",
        "improvementSuggestions": ["Sugerencia específica 1", "Sugerencia específica 2"]
      }
    ],
    "bestMatch": "resurrection",
    "bestMatchReason": "Explicación de por qué esta categoría es la mejor opción"
  },
  "criteriaAnalysis": {
    "scores": [
      {
        "name": "Potential Value",
        "score": 4.2,
        "justification": "Justificación detallada para esta puntuación",
        "subScores": {
          "Market Uniqueness": {
            "score": 4.0,
            "explanation": "Evaluación de la singularidad del mercado"
          },
          "UI Intuitiveness": {
            "score": 4.5,
            "explanation": "Evaluación de la intuitividad de la UI"
          },
          "Scalability": {
            "score": 4.0,
            "explanation": "Evaluación del potencial de escalabilidad"
          }
        }
      },
      {
        "name": "Implementation",
        "score": 3.8,
        "justification": "Justificación detallada para esta puntuación",
        "subScores": {
          "Kiro Features Variety": {
            "score": 4.0,
            "explanation": "Evaluación de la variedad de características de Kiro"
          },
          "Depth of Understanding": {
            "score": 3.5,
            "explanation": "Evaluación de la profundidad de comprensión"
          },
          "Strategic Integration": {
            "score": 4.0,
            "explanation": "Evaluación de la integración estratégica"
          }
        }
      },
      {
        "name": "Quality and Design",
        "score": 4.0,
        "justification": "Justificación detallada para esta puntuación",
        "subScores": {
          "Creativity": {
            "score": 4.2,
            "explanation": "Evaluación de la creatividad"
          },
          "Originality": {
            "score": 3.8,
            "explanation": "Evaluación de la originalidad"
          },
          "Polish": {
            "score": 4.0,
            "explanation": "Evaluación del pulido y calidad"
          }
        }
      }
    ],
    "finalScore": 4.0,
    "finalScoreExplanation": "Explicación del puntaje final"
  },
  "detailedSummary": "Análisis completo cubriendo el potencial del proyecto en el hackathon",
  "viabilitySummary": "Resumen breve de la viabilidad competitiva del proyecto",
  "competitors": [],
  "improvementSuggestions": [
    {
      "title": "Título de Mejora",
      "description": "Sugerencia específica y accionable"
    }
  ],
  "nextSteps": [
    {
      "title": "Título del Siguiente Paso",
      "description": "Paso específico y accionable"
    }
  ],
  "hackathonSpecificAdvice": {
    "categoryOptimization": ["Consejo específico para mejor alineación con la categoría"],
    "kiroIntegrationTips": ["Sugerencias para mejorar el uso de características de Kiro"],
    "competitionStrategy": ["Consejo para destacar en la competencia"]
  },
  "finalScore": 4.0,
  "finalScoreExplanation": "El puntaje final refleja el rendimiento en todos los criterios"
}`
    : `You are a world-class hackathon judge and technical evaluator specializing in the Kiroween competition. Your task is to provide a comprehensive analysis of a hackathon project submission against the specific Kiroween categories and judging criteria.

${languageInstruction}

CRITICAL FORMATTING INSTRUCTIONS:
- Your response must START with { and END with }
- Do NOT include any explanatory text before or after the JSON
- Do NOT wrap the JSON in markdown code blocks or backticks
- Ensure all strings are properly escaped
- Ensure all numeric values are actual numbers, not strings
- The response must be valid, parseable JSON

PROJECT SUBMISSION:
Description: "${projectDescription.replace(/"/g, '\\"')}"
Selected Category: "${category}"

KIROWEEN CATEGORIES:
1. Resurrection: Reviving obsolete technology with modern innovations
2. Frankenstein: Integration of seemingly incompatible technologies
3. Skeleton Crew: Flexible foundation with multiple use cases
4. Costume Contest: UI polish and spooky design elements

JUDGING CRITERIA (each scored 1-5):
1. Potential Value: Market uniqueness, UI intuitiveness, scalability potential
2. Implementation: Variety of Kiro features used, depth of understanding, strategic integration
3. Quality and Design: Creativity, originality, polish

Please provide your analysis in the following JSON format (all numeric values must be numbers, not strings):

IMPORTANT REQUIREMENT: The "evaluations" array MUST contain exactly FOUR objects, one for each Kiroween category ("resurrection", "frankenstein", "skeleton-crew", "costume-contest"). Each object must include "category", "fitScore", "explanation", and "improvementSuggestions".

{
  "categoryAnalysis": {
    "evaluations": [
      {
        "category": "resurrection",
        "fitScore": 7.5,
        "explanation": "Detailed explanation of how well the project fits this category",
        "improvementSuggestions": ["Specific suggestion 1", "Specific suggestion 2"]
      },
      {
        "category": "frankenstein",
        "fitScore": 6.8,
        "explanation": "Explanation of how the project integrates seemingly incompatible technologies",
        "improvementSuggestions": ["Specific suggestion 1", "Specific suggestion 2"]
      },
      {
        "category": "skeleton-crew",
        "fitScore": 7.2,
        "explanation": "Explanation about the flexible foundation and multiple use cases",
        "improvementSuggestions": ["Specific suggestion 1", "Specific suggestion 2"]
      },
      {
        "category": "costume-contest",
        "fitScore": 5.9,
        "explanation": "Explanation of UI polish and spooky design elements",
        "improvementSuggestions": ["Specific suggestion 1", "Specific suggestion 2"]
      }
    ],
    "bestMatch": "resurrection",
    "bestMatchReason": "Explanation of why this category is the best fit"
  },
  "criteriaAnalysis": {
    "scores": [
      {
        "name": "Potential Value",
        "score": 4.2,
        "justification": "Detailed justification for this score",
        "subScores": {
          "Market Uniqueness": {
            "score": 4.0,
            "explanation": "Assessment of market uniqueness"
          },
          "UI Intuitiveness": {
            "score": 4.5,
            "explanation": "Assessment of UI intuitiveness"
          },
          "Scalability": {
            "score": 4.0,
            "explanation": "Assessment of scalability potential"
          }
        }
      },
      {
        "name": "Implementation",
        "score": 3.8,
        "justification": "Detailed justification for this score",
        "subScores": {
          "Kiro Features Variety": {
            "score": 4.0,
            "explanation": "Assessment of Kiro features variety"
          },
          "Depth of Understanding": {
            "score": 3.5,
            "explanation": "Assessment of understanding depth"
          },
          "Strategic Integration": {
            "score": 4.0,
            "explanation": "Assessment of strategic integration"
          }
        }
      },
      {
        "name": "Quality and Design",
        "score": 4.0,
        "justification": "Detailed justification for this score",
        "subScores": {
          "Creativity": {
            "score": 4.2,
            "explanation": "Assessment of creativity"
          },
          "Originality": {
            "score": 3.8,
            "explanation": "Assessment of originality"
          },
          "Polish": {
            "score": 4.0,
            "explanation": "Assessment of polish and quality"
          }
        }
      }
    ],
    "finalScore": 4.0,
    "finalScoreExplanation": "The final score reflects performance across all judging criteria"
  },
  "detailedSummary": "Comprehensive analysis covering the project's hackathon potential",
  "viabilitySummary": "Brief concluding summary of the project's competitive viability",
  "competitors": [],
  "improvementSuggestions": [
    {
      "title": "Enhancement Title",
      "description": "Specific actionable suggestion"
    }
  ],
  "nextSteps": [
    {
      "title": "Next Step Title",
      "description": "Specific actionable next step"
    }
  ],
  "hackathonSpecificAdvice": {
    "categoryOptimization": ["Specific advice for better aligning with the best-fit category"],
    "kiroIntegrationTips": ["Specific suggestions for improving Kiro feature utilization"],
    "competitionStrategy": ["Advice for standing out in the competition"]
  },
  "finalScore": 4.0,
  "finalScoreExplanation": "The final score reflects strong performance across all judging criteria"
}

EVALUATION GUIDELINES:
Category Fit Scoring (1-10 scale):
- 8-10: Excellent alignment with category theme and criteria
- 6-7: Good fit with clear category relevance
- 4-5: Moderate alignment, some category elements present
- 2-3: Limited alignment, weak category connection
- 1: Minimal or no alignment with category

Criteria Scoring (1-5 scale):
- 5: Exceptional - Industry-leading quality and innovation
- 4: Strong - Above-average with notable strengths
- 3: Good - Solid execution meeting expectations
- 2: Fair - Basic implementation with room for improvement
- 1: Poor - Significant weaknesses requiring major work

Focus on:
- How well the project leverages Kiro's unique capabilities
- Innovation and creativity within the hackathon context
- Technical feasibility and execution quality
- Competitive differentiation from similar projects
- Alignment with the selected Kiroween category
- Practical value and user impact potential
- Quality of implementation and attention to detail

Be constructive but honest in your evaluation, providing specific actionable feedback that can help improve the project within the hackathon timeline.`;

  return prompt;
}

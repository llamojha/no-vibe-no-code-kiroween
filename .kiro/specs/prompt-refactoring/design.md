# Design Document

## Overview

Este documento describe el diseño de la refactorización de prompts de AI, moviendo los prompts desde el GoogleAIAdapter a una biblioteca dedicada en `lib/prompts/`. El diseño prioriza la separación de responsabilidades, mantenibilidad y type safety, mientras mantiene compatibilidad total con el código existente.

## Architecture

### Estructura de Directorios

```
lib/
└── prompts/
    ├── constants.ts          # Enums, tipos y constantes
    ├── startupIdea.ts        # Prompt para análisis de startup ideas
    ├── hackathonProject.ts   # Prompt para análisis de hackathon
    └── index.ts              # Exports centralizados
```

### Flujo de Datos

```
GoogleAIAdapter
    ↓
Importa prompts desde lib/prompts
    ↓
Selecciona prompt según tipo de análisis
    ↓
Genera prompt con localización
    ↓
Envía a Google Gemini AI
```

## Components and Interfaces

### 1. Constants and Types (`lib/prompts/constants.ts`)

Define los tipos y enums para la biblioteca de prompts:

```typescript
/**
 * Tipos de análisis disponibles
 */
export enum PromptType {
  STARTUP_IDEA = 'startup_idea',
  HACKATHON_PROJECT = 'hackathon_project'
}

/**
 * Locales soportados para prompts
 */
export type Locale = 'en' | 'es';

/**
 * Configuración de un prompt
 */
export interface PromptConfig {
  type: PromptType;
  locale: Locale;
}

/**
 * Función generadora de prompt
 */
export type PromptGenerator = (input: string, locale: Locale) => string;

/**
 * Mapa de generadores de prompts por tipo
 */
export interface PromptGenerators {
  [PromptType.STARTUP_IDEA]: PromptGenerator;
  [PromptType.HACKATHON_PROJECT]: PromptGenerator;
}
```

### 2. Startup Idea Prompt (`lib/prompts/startupIdea.ts`)

Contiene el prompt para análisis de ideas de startup:

```typescript
import { Locale } from './constants';

/**
 * Genera el prompt para análisis de startup ideas
 * @param idea - La idea de startup a analizar
 * @param locale - El idioma del análisis (en/es)
 * @returns El prompt formateado para Google Gemini AI
 */
export function generateStartupIdeaPrompt(idea: string, locale: Locale): string {
  const prompts = {
    en: `You are an expert startup advisor and product analyst. Analyze the following startup idea and provide a detailed evaluation.

Startup Idea: "${idea}"

Please provide your analysis in the following JSON format:
{
  "score": <number between 0-100>,
  "strengths": [<array of strings, 3-5 key strengths>],
  "weaknesses": [<array of strings, 3-5 key weaknesses>],
  "feedback": "<detailed feedback paragraph>",
  "recommendations": [<array of strings, 3-5 actionable recommendations>]
}

Evaluation Criteria:
1. Market Opportunity (0-20 points)
2. Innovation & Uniqueness (0-20 points)
3. Feasibility & Execution (0-20 points)
4. Value Proposition (0-20 points)
5. Scalability Potential (0-20 points)

Provide honest, constructive feedback. Be specific and actionable in your recommendations.`,

    es: `Eres un experto asesor de startups y analista de productos. Analiza la siguiente idea de startup y proporciona una evaluación detallada.

Idea de Startup: "${idea}"

Por favor proporciona tu análisis en el siguiente formato JSON:
{
  "score": <número entre 0-100>,
  "strengths": [<array de strings, 3-5 fortalezas clave>],
  "weaknesses": [<array de strings, 3-5 debilidades clave>],
  "feedback": "<párrafo de retroalimentación detallada>",
  "recommendations": [<array de strings, 3-5 recomendaciones accionables>]
}

Criterios de Evaluación:
1. Oportunidad de Mercado (0-20 puntos)
2. Innovación y Singularidad (0-20 puntos)
3. Viabilidad y Ejecución (0-20 puntos)
4. Propuesta de Valor (0-20 puntos)
5. Potencial de Escalabilidad (0-20 puntos)

Proporciona retroalimentación honesta y constructiva. Sé específico y accionable en tus recomendaciones.`
  };

  return prompts[locale];
}
```

### 3. Hackathon Project Prompt (`lib/prompts/hackathonProject.ts`)

Contiene el prompt para análisis de proyectos de hackathon:

```typescript
import { Locale } from './constants';

/**
 * Genera el prompt para análisis de proyectos de hackathon
 * @param project - La descripción del proyecto de hackathon
 * @param locale - El idioma del análisis (en/es)
 * @returns El prompt formateado para Google Gemini AI
 */
export function generateHackathonProjectPrompt(project: string, locale: Locale): string {
  const prompts = {
    en: `You are an expert hackathon judge and technical evaluator. Analyze the following hackathon project and provide a detailed evaluation.

Hackathon Project: "${project}"

Please provide your analysis in the following JSON format:
{
  "score": <number between 0-100>,
  "category": "<one of: frankenstein, resurrection, haunted, cursed, possessed>",
  "strengths": [<array of strings, 3-5 key strengths>],
  "weaknesses": [<array of strings, 3-5 key weaknesses>],
  "feedback": "<detailed feedback paragraph>",
  "technicalComplexity": <number between 0-10>,
  "creativity": <number between 0-10>,
  "spookyFactor": <number between 0-10>
}

Categories:
- frankenstein: Projects that combine/mashup different technologies or ideas
- resurrection: Projects that revive or bring back old technologies/concepts
- haunted: Projects with mysterious or unexplained behaviors
- cursed: Projects with inherent problems or challenges
- possessed: Projects with autonomous or AI-driven behaviors

Evaluation Criteria:
1. Technical Implementation (0-25 points)
2. Creativity & Originality (0-25 points)
3. Theme Alignment (0-25 points)
4. Completeness & Polish (0-25 points)

Provide honest, constructive feedback focused on hackathon context.`,

    es: `Eres un experto juez de hackathon y evaluador técnico. Analiza el siguiente proyecto de hackathon y proporciona una evaluación detallada.

Proyecto de Hackathon: "${project}"

Por favor proporciona tu análisis en el siguiente formato JSON:
{
  "score": <número entre 0-100>,
  "category": "<uno de: frankenstein, resurrection, haunted, cursed, possessed>",
  "strengths": [<array de strings, 3-5 fortalezas clave>],
  "weaknesses": [<array de strings, 3-5 debilidades clave>],
  "feedback": "<párrafo de retroalimentación detallada>",
  "technicalComplexity": <número entre 0-10>,
  "creativity": <número entre 0-10>,
  "spookyFactor": <número entre 0-10>
}

Categorías:
- frankenstein: Proyectos que combinan diferentes tecnologías o ideas
- resurrection: Proyectos que reviven tecnologías/conceptos antiguos
- haunted: Proyectos con comportamientos misteriosos o inexplicables
- cursed: Proyectos con problemas o desafíos inherentes
- possessed: Proyectos con comportamientos autónomos o impulsados por IA

Criterios de Evaluación:
1. Implementación Técnica (0-25 puntos)
2. Creatividad y Originalidad (0-25 puntos)
3. Alineación con el Tema (0-25 puntos)
4. Completitud y Pulido (0-25 puntos)

Proporciona retroalimentación honesta y constructiva enfocada en el contexto de hackathon.`
  };

  return prompts[locale];
}
```

### 4. Central Exports (`lib/prompts/index.ts`)

Exporta todos los componentes de la biblioteca:

```typescript
// Types and constants
export { PromptType, type Locale, type PromptConfig, type PromptGenerator, type PromptGenerators } from './constants';

// Prompt generators
export { generateStartupIdeaPrompt } from './startupIdea';
export { generateHackathonProjectPrompt } from './hackathonProject';

/**
 * Mapa de generadores de prompts por tipo
 */
import { generateStartupIdeaPrompt } from './startupIdea';
import { generateHackathonProjectPrompt } from './hackathonProject';
import { PromptType, type PromptGenerators } from './constants';

export const promptGenerators: PromptGenerators = {
  [PromptType.STARTUP_IDEA]: generateStartupIdeaPrompt,
  [PromptType.HACKATHON_PROJECT]: generateHackathonProjectPrompt
};
```

### 5. GoogleAIAdapter Refactoring

Actualizar el adapter para usar la biblioteca de prompts:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateStartupIdeaPrompt, type Locale } from '@/lib/prompts';
import { Result, success, failure } from '@/shared/result';
import { AIServiceError } from '@/domain/types/errors';

export class GoogleAIAdapter {
  constructor(private readonly googleAI: GoogleGenerativeAI) {}

  async analyzeIdea(idea: string, locale: Locale): Promise<Result<AnalysisResult>> {
    try {
      const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Usar prompt desde la biblioteca
      const prompt = generateStartupIdeaPrompt(idea, locale);
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Parsing y validación...
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        return failure(new AIServiceError(
          'Failed to parse AI response',
          'PARSE_ERROR',
          e
        ));
      }
      
      // Validaciones existentes...
      
      return success(parsed);
    } catch (error) {
      // Manejo de errores existente...
    }
  }
  
  async analyzeHackathonProject(project: string, locale: Locale): Promise<Result<HackathonAnalysisResult>> {
    // Similar implementation usando generateHackathonProjectPrompt
  }
}
```

## Data Models

No se requieren cambios en los modelos de datos. Los tipos de respuesta de AI permanecen iguales.

## Error Handling

No se introducen nuevos tipos de errores. Se mantiene el manejo de errores existente en GoogleAIAdapter.

## Testing Strategy

### Unit Tests

1. **Prompt Generators Tests:**
   - Verificar que cada generador retorna string no vacío
   - Verificar que soporta ambos locales (en/es)
   - Verificar que incluye el input en el prompt generado

2. **GoogleAIAdapter Tests:**
   - Verificar que usa los prompts correctos
   - Verificar que mantiene funcionalidad existente
   - Todos los tests existentes deben pasar sin cambios

### Integration Tests

- Verificar que los prompts generan respuestas válidas de Google Gemini AI
- Verificar que la localización funciona correctamente

## Migration Strategy

### Fase 1: Crear Biblioteca de Prompts
1. Crear estructura de directorios
2. Crear archivos de constantes y tipos
3. Extraer prompts a archivos dedicados
4. Crear exports centralizados

### Fase 2: Actualizar GoogleAIAdapter
1. Importar prompts desde biblioteca
2. Reemplazar prompts embebidos con imports
3. Eliminar código duplicado

### Fase 3: Verificación
1. Ejecutar tests existentes
2. Verificar que no hay regresiones
3. Validar que la funcionalidad se mantiene

## Performance Considerations

- Los prompts son strings estáticos, no hay impacto en performance
- Las funciones generadoras son síncronas y muy rápidas
- No se introduce overhead adicional

## Security Considerations

- Los prompts no contienen información sensible
- Se mantienen las mismas prácticas de seguridad existentes
- No se exponen nuevas superficies de ataque

## Maintainability Benefits

1. **Separación de Responsabilidades:** Prompts separados de lógica de adapter
2. **Fácil Actualización:** Cambiar prompts sin tocar código de infraestructura
3. **Type Safety:** Enums y tipos previenen errores
4. **Reusabilidad:** Prompts pueden ser usados por otros adapters en el futuro
5. **Testing:** Más fácil testear prompts independientemente
6. **Documentación:** Cada prompt está documentado en su propio archivo

## Future Extensibility

Esta estructura permite fácilmente:
- Agregar nuevos tipos de análisis
- Implementar versionado de prompts
- A/B testing de diferentes prompts
- Soporte para más idiomas
- Prompts dinámicos basados en configuración

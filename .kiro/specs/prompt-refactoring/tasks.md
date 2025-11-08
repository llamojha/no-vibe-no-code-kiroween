# Implementation Plan

- [x] 1. Crear Estructura de Biblioteca de Prompts





  - Crear directorio y archivos base para la biblioteca de prompts
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Crear archivo de constantes y tipos


  - Crear archivo `lib/prompts/constants.ts`
  - Definir enum `PromptType` con valores STARTUP_IDEA y HACKATHON_PROJECT
  - Definir type `Locale` como 'en' | 'es'
  - Definir interface `PromptConfig` con type y locale
  - Definir type `PromptGenerator` como función que recibe (input: string, locale: Locale) => string
  - Definir interface `PromptGenerators` con mapa de PromptType a PromptGenerator
  - _Requirements: 2.1, 2.2, 2.3, 2.5_


- [x] 1.2 Crear prompt de startup ideas

  - Crear archivo `lib/prompts/startupIdea.ts`
  - Implementar función `generateStartupIdeaPrompt(idea: string, locale: Locale): string`
  - Extraer prompt en inglés desde GoogleAIAdapter
  - Extraer prompt en español desde GoogleAIAdapter
  - Agregar JSDoc documentation
  - Verificar que incluye todos los criterios de evaluación
  - _Requirements: 3.1, 3.3, 3.4_

- [x] 1.3 Crear prompt de hackathon


  - Crear archivo `lib/prompts/hackathonProject.ts`
  - Implementar función `generateHackathonProjectPrompt(project: string, locale: Locale): string`
  - Extraer prompt en inglés desde GoogleAIAdapter (si existe)
  - Extraer prompt en español desde GoogleAIAdapter (si existe)
  - Agregar JSDoc documentation
  - Incluir categorías de hackathon (frankenstein, resurrection, haunted, cursed, possessed)
  - _Requirements: 3.2, 3.3, 3.4_


- [x] 1.4 Crear exports centralizados

  - Crear archivo `lib/prompts/index.ts`
  - Exportar todos los tipos desde constants.ts
  - Exportar generateStartupIdeaPrompt desde startupIdea.ts
  - Exportar generateHackathonProjectPrompt desde hackathonProject.ts
  - Crear objeto `promptGenerators` que mapea PromptType a funciones generadoras
  - _Requirements: 1.5, 2.4_

- [x] 2. Actualizar GoogleAIAdapter




  - Refactorizar GoogleAIAdapter para usar biblioteca de prompts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.1 Importar biblioteca de prompts en GoogleAIAdapter


  - Agregar import de `generateStartupIdeaPrompt` desde `@/lib/prompts`
  - Agregar import de `type Locale` desde `@/lib/prompts`
  - Agregar import de `generateHackathonProjectPrompt` si se usa
  - _Requirements: 4.1_

- [x] 2.2 Reemplazar prompts embebidos con imports


  - Localizar método que genera prompts en GoogleAIAdapter
  - Reemplazar lógica de generación de prompts con llamada a `generateStartupIdeaPrompt(idea, locale)`
  - Eliminar definiciones de prompts embebidas
  - Mantener toda la lógica de parsing y validación existente
  - _Requirements: 4.2, 4.3, 3.5_

- [x] 2.3 Verificar compatibilidad de API


  - Verificar que la firma de métodos públicos no cambia
  - Verificar que los parámetros de entrada son los mismos
  - Verificar que el tipo de retorno es el mismo
  - Asegurar que no se rompe código que usa GoogleAIAdapter
  - _Requirements: 5.1, 5.5_

- [x] 3. Testing y Verificación





  - Crear tests y verificar que todo funciona correctamente
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 3.1 Crear tests para generadores de prompts


  - Crear archivo `lib/prompts/__tests__/startupIdea.test.ts`
  - Test: verificar que generateStartupIdeaPrompt retorna string no vacío para locale 'en'
  - Test: verificar que generateStartupIdeaPrompt retorna string no vacío para locale 'es'
  - Test: verificar que el prompt incluye la idea proporcionada
  - Crear archivo `lib/prompts/__tests__/hackathonProject.test.ts` con tests similares
  - _Requirements: 3.3, 3.4_


- [x] 3.2 Ejecutar tests existentes de GoogleAIAdapter

  - Ejecutar `npm test -- GoogleAIAdapter.test.ts --silent`
  - Verificar que todos los tests pasan sin modificaciones
  - Corregir cualquier test que falle debido a la refactorización
  - _Requirements: 5.2, 5.4_


- [x] 3.3 Verificar funcionalidad end-to-end

  - Verificar que el análisis de ideas funciona correctamente
  - Verificar que la localización (en/es) funciona correctamente
  - Verificar que las respuestas de AI tienen el formato esperado
  - Documentar cualquier cambio de comportamiento observado
  - _Requirements: 5.3, 5.4_

- [x] 4. Limpieza y Documentación





  - Limpiar código y actualizar documentación
  - _Requirements: 3.5_

- [x] 4.1 Limpiar código duplicado


  - Eliminar cualquier código de prompts que quedó en GoogleAIAdapter
  - Verificar que no hay imports no utilizados
  - Ejecutar linter para verificar calidad de código
  - _Requirements: 4.2_

- [x] 4.2 Actualizar documentación


  - Agregar README.md en `lib/prompts/` explicando la estructura
  - Documentar cómo agregar nuevos tipos de prompts
  - Documentar cómo agregar soporte para nuevos idiomas
  - Actualizar comentarios en GoogleAIAdapter si es necesario
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

# Requirements Document

## Introduction

Este documento define los requisitos para refactorizar la gestión de prompts de AI en el proyecto No Vibe No Code. Actualmente, los prompts están embebidos directamente en el GoogleAIAdapter, lo que dificulta su mantenimiento y actualización. La refactorización separará los prompts en archivos dedicados en `lib/prompts/` con una estructura clara de constantes y enums, mejorando la organización y mantenibilidad del código.

## Glossary

- **System**: El proyecto completo No Vibe No Code
- **GoogleAIAdapter**: Adaptador de infraestructura que integra con Google Gemini AI
- **Prompt**: Texto de instrucciones enviado al modelo de AI para generar análisis
- **Prompt Library**: Colección organizada de prompts en `lib/prompts/`
- **PromptType**: Enum que define los tipos de análisis disponibles
- **Startup Idea Prompt**: Prompt para análisis de ideas de startup
- **Hackathon Project Prompt**: Prompt para análisis de proyectos de hackathon

## Requirements

### Requirement 1: Crear Estructura de Biblioteca de Prompts

**User Story:** Como desarrollador, quiero que los prompts estén organizados en una biblioteca dedicada, para poder encontrarlos y actualizarlos fácilmente sin tocar la lógica del adapter.

#### Acceptance Criteria

1. THE System SHALL crear directorio `lib/prompts/` para almacenar todos los prompts
2. THE System SHALL crear archivo `lib/prompts/constants.ts` con enums y constantes
3. THE System SHALL crear archivo `lib/prompts/startupIdea.ts` con prompt de startup ideas
4. THE System SHALL crear archivo `lib/prompts/hackathonProject.ts` con prompt de hackathon
5. THE System SHALL crear archivo `lib/prompts/index.ts` para exports centralizados

### Requirement 2: Definir Tipos y Constantes de Prompts

**User Story:** Como desarrollador, quiero usar enums y constantes tipadas para los prompts, para tener autocompletado y type safety al trabajar con diferentes tipos de análisis.

#### Acceptance Criteria

1. THE System SHALL definir enum `PromptType` con valores para cada tipo de análisis
2. THE System SHALL definir interface `PromptConfig` con estructura de configuración de prompts
3. THE System SHALL exportar constantes tipadas desde `constants.ts`
4. WHEN se importa un PromptType, THE System SHALL proporcionar autocompletado en el IDE
5. THE System SHALL usar tipos TypeScript estrictos para todas las definiciones

### Requirement 3: Extraer Prompts a Archivos Dedicados

**User Story:** Como desarrollador, quiero que cada tipo de prompt esté en su propio archivo, para poder editarlos independientemente y mantener el código organizado.

#### Acceptance Criteria

1. THE System SHALL extraer prompt de startup ideas desde GoogleAIAdapter a `startupIdea.ts`
2. THE System SHALL extraer prompt de hackathon desde GoogleAIAdapter a `hackathonProject.ts`
3. THE System SHALL mantener la funcionalidad de localización (en/es) en cada prompt
4. THE System SHALL preservar toda la lógica de generación de prompts existente
5. WHEN se actualiza un prompt, THE System SHALL requerir cambios solo en el archivo de prompt correspondiente

### Requirement 4: Actualizar GoogleAIAdapter para Usar Biblioteca de Prompts

**User Story:** Como desarrollador, quiero que el GoogleAIAdapter use los prompts importados desde la biblioteca, para mantener la separación de responsabilidades y facilitar el testing.

#### Acceptance Criteria

1. THE System SHALL importar prompts desde `lib/prompts` en GoogleAIAdapter
2. THE System SHALL eliminar definiciones de prompts embebidas en GoogleAIAdapter
3. THE System SHALL mantener la misma funcionalidad de análisis existente
4. WHEN se llama a analyzeIdea, THE System SHALL usar el prompt correcto según el tipo
5. THE System SHALL pasar todos los tests existentes sin modificaciones

### Requirement 5: Mantener Compatibilidad y Testing

**User Story:** Como desarrollador, quiero que la refactorización no rompa funcionalidad existente, para asegurar que el sistema siga funcionando correctamente después de los cambios.

#### Acceptance Criteria

1. THE System SHALL mantener la misma API pública de GoogleAIAdapter
2. THE System SHALL pasar todos los tests existentes de GoogleAIAdapter
3. THE System SHALL mantener la misma estructura de respuestas de AI
4. WHEN se ejecutan los tests, THE System SHALL completar sin errores
5. THE System SHALL mantener compatibilidad con código existente que usa GoogleAIAdapter

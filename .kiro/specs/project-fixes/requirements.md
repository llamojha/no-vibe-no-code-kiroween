# Requirements Document

## Introduction

Este documento define los requisitos para corregir los errores y problemas identificados en el proyecto No Vibe No Code. El proyecto utiliza arquitectura hexagonal con Next.js, TypeScript, Supabase y Google Gemini AI. La revisión identificó problemas en tests, linting, configuración y código que necesitan ser corregidos para mantener la calidad del código y asegurar que el proyecto funcione correctamente.

## Glossary

- **System**: El proyecto completo No Vibe No Code
- **Test Suite**: Conjunto de tests automatizados usando Vitest
- **Linter**: ESLint configurado para Next.js y TypeScript
- **Hexagonal Architecture**: Patrón arquitectónico que separa domain, application e infrastructure
- **GoogleAIAdapter**: Adaptador para integración con Google Gemini AI
- **AnalysisMapper**: Componente que convierte entre DAOs y entidades de dominio
- **AuthMiddleware**: Middleware para autenticación y autorización
- **AnalysisController**: Controlador para operaciones de análisis
- **SupabaseAnalysisRepository**: Repositorio que implementa acceso a datos usando Supabase
- **Mock Query Builder**: Objeto mock que simula el comportamiento del query builder de Supabase

## Requirements

### Requirement 1: Corregir Tests Fallidos

**User Story:** Como desarrollador, quiero que todos los tests pasen exitosamente, para asegurar que el código funciona correctamente y prevenir regresiones.

#### Acceptance Criteria

1. WHEN se ejecutan los tests del dominio, THE System SHALL pasar todos los tests de AnalysisValidationService
2. WHEN se ejecutan los tests del dominio, THE System SHALL pasar todos los tests de HackathonAnalysisService
3. WHEN se ejecutan los tests de infrastructure, THE System SHALL pasar todos los tests de GoogleAIAdapter
4. WHEN se ejecutan los tests de infrastructure, THE System SHALL pasar todos los tests de AnalysisController
5. WHEN se ejecutan los tests de infrastructure, THE System SHALL pasar todos los tests de AuthMiddleware
6. WHEN se ejecutan los tests de mappers, THE System SHALL pasar todos los tests de AnalysisMapper
7. WHEN se ejecutan los tests de repositories, THE System SHALL cargar correctamente SupabaseAnalysisRepository.test.ts
8. WHEN se ejecutan los tests de SupabaseAnalysisRepository, THE System SHALL pasar todos los tests de búsqueda y paginación
9. WHEN se configuran mocks de query builder, THE System SHALL implementar correctamente mockResolvedValue y mockResolvedValueOnce

### Requirement 2: Resolver Warnings de ESLint

**User Story:** Como desarrollador, quiero eliminar los warnings de ESLint, para mantener un código limpio y seguir las mejores prácticas de TypeScript.

#### Acceptance Criteria

1. THE System SHALL eliminar todos los usos de tipo `any` explícito reemplazándolos con tipos específicos
2. THE System SHALL eliminar todas las variables y imports no utilizados
3. THE System SHALL agregar prefijo underscore a parámetros no utilizados que son requeridos por interfaces
4. WHEN se ejecuta el linter, THE System SHALL reportar cero warnings en archivos de producción
5. THE System SHALL mantener warnings de test en nivel aceptable (solo en archivos de test)
6. THE System SHALL agregar prefijo underscore a todos los parámetros no utilizados en API routes
7. THE System SHALL eliminar imports no utilizados en archivos de test

### Requirement 3: Corregir Problemas de Configuración

**User Story:** Como desarrollador, quiero que la configuración del proyecto esté correcta, para evitar errores en tiempo de ejecución y desarrollo.

#### Acceptance Criteria

1. THE System SHALL validar que todas las variables de entorno requeridas estén documentadas en .env.example
2. THE System SHALL asegurar que los imports relativos en tests usen rutas correctas
3. THE System SHALL verificar que la configuración de TypeScript sea consistente con la arquitectura hexagonal
4. WHEN se construye el proyecto, THE System SHALL completar sin errores de configuración

### Requirement 4: Mejorar Manejo de Errores en Tests

**User Story:** Como desarrollador, quiero que los tests tengan mejor manejo de errores y mocking, para que sean más confiables y fáciles de mantener.

#### Acceptance Criteria

1. THE System SHALL implementar mocks correctos para GoogleAIAdapter en tests
2. THE System SHALL implementar mocks correctos para AuthMiddleware en tests
3. THE System SHALL asegurar que los tests de integración manejen correctamente la autenticación
4. WHEN un test falla, THE System SHALL proporcionar mensajes de error claros y útiles
5. THE System SHALL usar beforeEach correctamente para setup de tests
6. THE System SHALL implementar mocks de query builder con métodos mockResolvedValue y mockResolvedValueOnce
7. WHEN se crean mocks de Supabase, THE System SHALL asegurar que todos los métodos encadenables retornen el mock correcto

### Requirement 5: Corregir Lógica de Negocio en Domain Services

**User Story:** Como desarrollador, quiero que los servicios de dominio implementen correctamente la lógica de negocio, para que las validaciones y cálculos sean precisos.

#### Acceptance Criteria

1. THE System SHALL implementar correctamente la validación de ideas cortas en AnalysisValidationService
2. THE System SHALL implementar correctamente la lógica de eliminación de análisis en AnalysisValidationService
3. THE System SHALL identificar correctamente la categoría Frankenstein en HackathonAnalysisService
4. WHEN se valida un análisis, THE System SHALL retornar warnings apropiados sin fallar la validación
5. WHEN se evalúa un proyecto para categoría, THE System SHALL usar los keywords correctos para identificación

### Requirement 6: Corregir Mappers y Conversiones de Datos

**User Story:** Como desarrollador, quiero que los mappers conviertan correctamente entre DAOs y entidades, para mantener la integridad de datos en toda la aplicación.

#### Acceptance Criteria

1. THE System SHALL manejar correctamente campos vacíos en AnalysisMapper convirtiéndolos a undefined
2. THE System SHALL preservar todos los campos requeridos durante conversiones DAO-to-Domain
3. THE System SHALL preservar todos los campos requeridos durante conversiones Domain-to-DAO
4. WHEN un campo opcional está vacío, THE System SHALL convertirlo a undefined en lugar de string vacío
5. THE System SHALL validar la integridad de datos en conversiones round-trip

### Requirement 7: Implementar Métodos Faltantes en Controllers

**User Story:** Como desarrollador, quiero que los controllers implementen todos los métodos necesarios, para soportar todas las operaciones HTTP requeridas.

#### Acceptance Criteria

1. THE System SHALL implementar el método handleOptions en AnalysisController para manejar preflight CORS
2. THE System SHALL asegurar que todos los métodos HTTP necesarios estén implementados en controllers
3. WHEN se recibe una petición OPTIONS, THE System SHALL responder con headers CORS apropiados
4. THE System SHALL mantener consistencia en la implementación de métodos entre controllers

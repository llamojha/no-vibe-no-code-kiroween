# Implementation Plan

- [x] 1. CRÍTICO - Fase 1: Corregir Vulnerabilidad de Seguridad en SupabaseAdapter


  - **PRIORIDAD MÁXIMA:** Eliminar session leak causado por singleton caching
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 1.1 Eliminar singleton de serverInstance en SupabaseAdapter


  - Eliminar la variable estática `private static serverInstance: any = null`
  - Modificar `getServerClient()` para siempre crear un nuevo cliente con `createServerComponentClient({ cookies })`
  - Mantener singleton de `clientInstance` solo para client-side (es seguro en navegador)
  - Actualizar método `resetInstances()` para solo resetear clientInstance
  - _Requirements: 9.1, 9.2, 9.6_

- [x] 1.2 Marcar createServerClient como deprecado


  - Agregar comentario JSDoc indicando que el método ya no es necesario
  - Explicar que `getServerClient()` ahora siempre crea un cliente fresco
  - Mantener el método por compatibilidad pero indicar que será removido
  - _Requirements: 9.7_

- [x] 1.3 Actualizar tests de SupabaseAdapter


  - Modificar test para verificar que `getServerClient()` crea nueva instancia en cada llamada
  - Agregar test que verifica que dos llamadas consecutivas retornan instancias diferentes
  - Agregar test que simula diferentes cookies y verifica aislamiento
  - Verificar que `getClientClient()` sigue siendo singleton
  - _Requirements: 9.3, 9.8_

- [x] 1.4 Crear tests de integración para validar aislamiento de sesiones






  - Crear test que simula dos usuarios diferentes con diferentes tokens
  - Verificar que Usuario A no puede acceder a datos de Usuario B
  - Verificar que RLS (Row Level Security) funciona correctamente
  - Verificar que refresh tokens se actualizan correctamente
  - _Requirements: 9.4, 9.5_

- [x] 1.5 Agregar documentación de seguridad






  - Agregar comentarios JSDoc explicando por qué no se debe cachear server client
  - Documentar el riesgo de session leak
  - Agregar ejemplos de uso correcto vs incorrecto
  - Actualizar README o documentación técnica con esta información
  - _Requirements: 9.8_

- [x] 1.6 Verificar que no hay otros usos problemáticos


  - Buscar en el código otros lugares donde se pueda estar cacheando clientes de Supabase
  - Verificar que todos los repositorios usan `getServerClient()` correctamente
  - Verificar que todos los controllers usan `getServerClient()` correctamente
  - Verificar que todos los API routes usan `getServerClient()` correctamente
  - _Requirements: 9.7, 9.8_

- [x] 2. Fase 2: Configuración y Setup de Tests
  - Corregir imports y configuración de tests para establecer base sólida
  - _Requirements: 1.7, 3.2, 4.1, 4.2, 4.3_

- [x] 2.1 Corregir import en SupabaseAnalysisRepository.test.ts
  - Cambiar import relativo `../mappers/AnalysisMapper` a path alias `@/infrastructure/database/supabase/mappers/AnalysisMapper`
  - Verificar que el test cargue correctamente
  - _Requirements: 1.7, 3.2_

- [x] 2.2 Crear mock factory para GoogleAI
  - Crear función `createMockGoogleAI()` en archivo de test utilities
  - Implementar mock con estructura correcta: `getGenerativeModel` que retorna objeto con `generateContent`
  - Configurar respuestas mock por defecto con datos válidos
  - _Requirements: 4.1, 4.2_

- [x] 2.3 Verificar y corregir export de AuthMiddleware
  - Verificar que AuthMiddleware sea exportado como class, no como function
  - Corregir import en AuthMiddleware.test.ts si es necesario
  - Asegurar que el constructor esté correctamente definido
  - _Requirements: 4.3_

- [x] 3. Fase 3: Corregir Domain Layer
  - Corregir lógica de negocio en servicios de dominio
  - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.1 Corregir AnalysisValidationService.validateAnalysis
  - Modificar lógica para que ideas cortas retornen `isValid: true` con warnings
  - Asegurar que solo errores (no warnings) marquen validación como inválida
  - Actualizar test para verificar comportamiento correcto
  - _Requirements: 5.1, 5.4_

- [x] 3.2 Corregir AnalysisValidationService.canDeleteAnalysis
  - Modificar lógica para permitir eliminación de análisis regulares
  - Solo prevenir eliminación de análisis especiales (templates, demos)
  - Actualizar test para verificar comportamiento correcto
  - _Requirements: 5.2_

- [x] 3.3 Corregir HackathonAnalysisService.evaluateProjectForCategory
  - Mejorar algoritmo de detección de keywords para categoría Frankenstein
  - Implementar scoring system basado en frecuencia de keywords
  - Asegurar que "combines" y "hybrid" identifiquen correctamente categoría frankenstein
  - Actualizar test para verificar comportamiento correcto
  - _Requirements: 1.2, 5.3, 5.5_

- [x] 4. Fase 4: Corregir Infrastructure - Mappers
  - Corregir conversión de datos entre DAOs y entidades
  - _Requirements: 1.6, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4.1 Corregir AnalysisMapper.toDomain para campos vacíos
  - Modificar conversión de `feedback` para convertir strings vacíos a undefined
  - Aplicar misma lógica a otros campos opcionales si es necesario
  - Actualizar test para verificar que campos vacíos se convierten a undefined
  - _Requirements: 6.1, 6.4_

- [x] 4.2 Verificar conversiones round-trip en AnalysisMapper
  - Ejecutar tests de round-trip para asegurar integridad de datos
  - Corregir cualquier pérdida de datos en conversiones
  - _Requirements: 6.2, 6.3, 6.5_

- [x] 5. Fase 5: Corregir Infrastructure - External Services
  - Mejorar manejo de errores y mocking en adaptadores externos
  - _Requirements: 1.3, 4.1, 4.2_

- [x] 5.1 Mejorar manejo de errores en GoogleAIAdapter.analyzeIdea
  - Agregar try-catch específico para parsing JSON con mensaje "Failed to parse AI response"
  - Agregar validación de campos requeridos con mensaje "Invalid AI response format"
  - Agregar validación de score con mensaje "Invalid score value"
  - Agregar detección de rate limit con mensaje "API rate limit exceeded"
  - Agregar detección de timeout con mensaje "Request timeout"
  - _Requirements: 1.3_

- [x] 5.2 Implementar retry mechanism en GoogleAIAdapter
  - Agregar lógica de retry para errores transitorios
  - Configurar máximo de 3 reintentos
  - Actualizar tests para verificar retry mechanism
  - _Requirements: 1.3_

- [x] 5.3 Corregir tests de GoogleAIAdapter
  - Actualizar todos los tests para usar mock factory creado en 2.2
  - Configurar mocks específicos para cada escenario de test
  - Verificar que todos los tests de GoogleAIAdapter pasen
  - _Requirements: 1.3, 4.1, 4.2_

- [x] 6. Fase 6: Corregir Infrastructure - Web Layer
  - Implementar métodos faltantes y corregir tests de controllers y middleware
  - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3, 7.4_

- [x] 6.1 Implementar método handleOptions en AnalysisController
  - Agregar método `handleOptions` que retorne respuesta 204 con headers CORS
  - Incluir headers: Access-Control-Allow-Origin, Methods, Headers, Max-Age
  - _Requirements: 7.1, 7.3_

- [x] 6.2 Verificar implementación de handleOptions en otros controllers
  - Revisar HackathonController y DashboardController
  - Implementar handleOptions si falta
  - Mantener consistencia entre controllers
  - _Requirements: 7.2, 7.4_

- [x] 6.3 Corregir tests de AnalysisController
  - Agregar mock de AuthenticationService en setup de tests
  - Configurar mock para retornar usuario autenticado por defecto
  - Agregar header Authorization con token válido en requests de test
  - Actualizar todos los tests para incluir autenticación
  - Verificar que todos los tests de AnalysisController pasen
  - _Requirements: 1.4, 4.3_

- [x] 6.4 Corregir tests de AuthMiddleware
  - Actualizar beforeEach para crear instancia correcta de AuthMiddleware
  - Configurar mocks apropiados para AuthenticationService
  - Verificar que todos los tests de AuthMiddleware pasen
  - _Requirements: 1.5, 4.3_

- [x] 7. Fase 7: Mejorar Code Quality
  - Eliminar warnings de ESLint y mejorar calidad de código
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7.1 Eliminar uso de `any` en archivos de producción
  - Identificar todos los usos de `any` en src/ (excluyendo tests)
  - Reemplazar con tipos específicos o unknown según corresponda
  - Crear interfaces para tipos complejos si es necesario
  - Verificar que no se introduzcan errores de tipo
  - _Requirements: 2.1_

- [x] 7.2 Limpiar imports y variables no utilizadas
  - Eliminar imports completamente no utilizados
  - Agregar prefijo `_` a parámetros requeridos pero no usados
  - Consolidar imports del mismo módulo
  - _Requirements: 2.2, 2.3_

- [x] 7.3 Ejecutar linter y verificar mejoras
  - Ejecutar `npm run lint` y verificar reducción de warnings
  - Corregir cualquier warning restante en código de producción
  - Documentar warnings aceptables en tests si los hay
  - _Requirements: 2.4, 2.5_

- [x] 8. Verificación Intermedia
  - Ejecutar todos los tests y verificar que pasen
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 3.4_

- [x] 8.1 Ejecutar suite completa de tests
  - Ejecutar `npm run test -- --silent`
  - Verificar que todos los tests pasen (0 failed)
  - Documentar cualquier test que aún falle con justificación
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 8.2 Ejecutar build del proyecto
  - Ejecutar `npm run build`
  - Verificar que el build complete sin errores
  - Verificar que no haya errores de TypeScript
  - _Requirements: 3.4_

- [x] 8.3 Ejecutar validación de arquitectura
  - Ejecutar `npm run validate-architecture`
  - Verificar que la arquitectura hexagonal se mantenga correcta
  - Corregir cualquier violación de arquitectura si existe
  - _Requirements: 3.3_

- [x] 9. Fase 8: Corregir Tests Restantes de SupabaseAnalysisRepository
  - Corregir configuración de mocks para query builder de Supabase
  - _Requirements: 1.8, 1.9, 4.6, 4.7_

- [x] 9.1 Corregir mock query builder en SupabaseAnalysisRepository.test.ts
  - Crear función helper `createMockQueryBuilder()` con todos los métodos necesarios
  - Implementar mockResolvedValue y mockResolvedValueOnce correctamente
  - Configurar encadenamiento de métodos (select, eq, ilike, order, range, single)
  - Actualizar beforeEach para usar el nuevo mock factory
  - _Requirements: 1.8, 1.9, 4.6, 4.7_

- [x] 9.2 Verificar que todos los tests de SupabaseAnalysisRepository pasen
  - Ejecutar tests específicos de SupabaseAnalysisRepository
  - Verificar que los 10 tests fallidos ahora pasen
  - Corregir cualquier problema adicional de mocking si existe
  - _Requirements: 1.8, 1.9_

- [x] 10. Fase 9: Limpiar Warnings de ESLint Restantes
  - Eliminar warnings de variables no utilizadas y tipos any restantes
  - _Requirements: 2.2, 2.3, 2.6, 2.7_

- [x] 10.1 Agregar prefijo underscore a parámetros no utilizados en API routes
  - Corregir app/actions/hackathon.ts (eliminar _command si no se usa)
  - Corregir app/api/health/route.ts (_request)
  - Corregir app/api/v2/analyze/route.ts (_request en ambas funciones)
  - Corregir app/api/v2/analyze/search/route.ts (_request)
  - Corregir app/api/v2/analyze/[id]/route.ts (_request y _params en todas las funciones)
  - _Requirements: 2.3, 2.6_

- [x] 10.2 Limpiar imports y variables no utilizadas en archivos de test
  - Eliminar import de ValidationError en GetAnalysisHandler.test.ts
  - Eliminar imports de AnalysisId y BusinessRuleViolationError en test-runner.ts
  - Agregar prefijo _ a __userId en SessionService.ts
  - Agregar prefijo _ a __analysis en AnalysisValidationService.ts
  - _Requirements: 2.2, 2.7_

- [x] 10.3 Eliminar tipos any restantes en archivos de test
  - Reemplazar any con tipos específicos en AuthenticationService.test.ts
  - Reemplazar any con tipos específicos en test-runner.ts (7 ocurrencias)
  - Usar unknown o tipos específicos según el contexto
  - _Requirements: 2.1_

- [x] 10.4 Ejecutar linter y verificar cero warnings en producción
  - Ejecutar `npm run lint`
  - Verificar que no haya warnings en archivos de producción (src/)
  - Documentar warnings aceptables en tests si los hay
  - _Requirements: 2.4, 2.5_

- [x] 11. Verificación Final Completa
  - Ejecutar todos los tests y linter para confirmar que todo está corregido
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 11.1 Ejecutar suite completa de tests
  - Ejecutar `npm run test -- --silent --run`
  - Verificar que todos los 328 tests pasen (0 failed)
  - Documentar cualquier test que aún falle con justificación
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 11.2 Ejecutar linter final
  - Ejecutar `npm run lint`
  - Verificar cero warnings en archivos de producción
  - Confirmar que solo quedan warnings aceptables en tests (si los hay)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 11.3 Ejecutar build del proyecto
  - Ejecutar `npm run build`
  - Verificar que el build complete sin errores
  - Verificar que no haya errores de TypeScript
  - _Requirements: 3.4_

- [x] 12. Fase 10: Corregir Internacionalización de UI


  - Identificar y corregir componentes con texto hardcodeado que no se traducen
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12.1 Identificar componentes con texto hardcodeado



  - Buscar componentes en features/ y app/ que tengan texto hardcodeado en botones, labels y mensajes
  - Crear lista de componentes que necesitan corrección
  - Priorizar componentes más visibles (botones de acción, formularios principales)
  - _Requirements: 8.1, 8.2, 8.3_




- [ ] 12.2 Agregar useTranslation a componentes identificados
  - Importar y usar hook useTranslation en cada componente



  - Reemplazar texto hardcodeado con llamadas a t('key')
  - Asegurar que el patrón sea consistente en todos los componentes
  - _Requirements: 8.4_



- [ ] 12.3 Agregar claves de traducción faltantes
  - Agregar claves necesarias en locales/en.json
  - Agregar traducciones correspondientes en locales/es.json
  - Mantener estructura jerárquica consistente en ambos archivos
  - _Requirements: 8.5_

- [ ] 12.4 Verificar funcionamiento de traducciones
  - Iniciar servidor de desarrollo
  - Cambiar locale a español y verificar que todos los elementos se traduzcan
  - Cambiar locale a inglés y verificar que todos los elementos vuelvan a inglés
  - Documentar cualquier elemento que aún no se traduzca correctamente
  - _Requirements: 8.1, 8.2, 8.3_
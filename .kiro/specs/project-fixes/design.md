# Design Document

## Overview

Este documento describe el diseño de las soluciones para corregir los errores y problemas identificados en el proyecto. El enfoque es sistemático, priorizando primero los problemas de configuración y estructura, luego los tests, y finalmente el código de producción. Esto asegura que cada corrección se construya sobre una base sólida.

## Architecture

### Estrategia de Corrección por Capas

```
1. Configuración y Setup
   ├── Imports y paths
   └── Mocks y test utilities

2. Domain Layer
   ├── Services (lógica de negocio)
   └── Value objects

3. Infrastructure Layer
   ├── Mappers (conversión de datos)
   ├── External adapters (GoogleAI)
   └── Web layer (controllers, middleware)

4. Linting y Code Quality
   ├── Eliminar `any` types
   └── Limpiar imports no utilizados
```

## Components and Interfaces

### 1. Test Configuration Fixes

#### 1.1 SupabaseAnalysisRepository Test Import Fix

**Problema:** Error de carga de módulo `../mappers/AnalysisMapper`

**Solución:**
```typescript
// Cambiar import relativo a absoluto usando path alias
// Antes:
import { AnalysisMapper } from '../mappers/AnalysisMapper';

// Después:
import { AnalysisMapper } from '@/infrastructure/database/supabase/mappers/AnalysisMapper';
```

#### 1.2 SupabaseAnalysisRepository Mock Query Builder Fix

**Problema:** Tests fallan con "mockResolvedValue is not a function" porque el mock query builder no está configurado correctamente

**Solución:**
```typescript
// Crear mock query builder con todos los métodos necesarios
const createMockQueryBuilder = () => {
  const mockBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    single: vi.fn(),
    mockResolvedValue: vi.fn(),
    mockResolvedValueOnce: vi.fn()
  };
  
  // Hacer que todos los métodos retornen el builder para encadenamiento
  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.ilike.mockReturnValue(mockBuilder);
  mockBuilder.order.mockReturnValue(mockBuilder);
  mockBuilder.range.mockReturnValue(mockBuilder);
  mockBuilder.single.mockReturnValue(mockBuilder);
  
  // Configurar mockResolvedValue para retornar promesa
  mockBuilder.mockResolvedValue.mockImplementation((value) => {
    return Promise.resolve(value);
  });
  
  mockBuilder.mockResolvedValueOnce.mockImplementation((value) => {
    return Promise.resolve(value);
  });
  
  return mockBuilder;
};

// Usar en beforeEach
beforeEach(() => {
  mockQueryBuilder = createMockQueryBuilder();
  mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
});
```

#### 1.3 GoogleAIAdapter Mock Setup

**Problema:** Tests fallan porque el mock no está configurado correctamente

**Solución:**
```typescript
// Crear mock factory para GoogleAI
const createMockGoogleAI = () => ({
  getGenerativeModel: vi.fn().mockReturnValue({
    generateContent: vi.fn()
  })
});

// Usar en beforeEach
beforeEach(() => {
  mockGoogleAI = createMockGoogleAI();
  adapter = new GoogleAIAdapter(mockGoogleAI);
});
```

#### 1.4 AuthMiddleware Test Setup

**Problema:** `AuthMiddleware is not a constructor`

**Solución:**
```typescript
// Verificar export en AuthMiddleware.ts
// Debe ser class export, no function export
export class AuthMiddleware {
  constructor(private authService: AuthenticationService) {}
  // ...
}

// En test, importar correctamente
import { AuthMiddleware } from '../AuthMiddleware';
```

### 2. Domain Layer Fixes

#### 2.1 AnalysisValidationService

**Problema 1:** Validación de ideas cortas retorna `isValid: false` en lugar de `isValid: true` con warnings

**Solución:**
```typescript
validateAnalysis(analysis: Analysis): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Validar longitud de idea
  if (analysis.idea.length < 50) {
    warnings.push('Your idea is quite short. Consider adding more details.');
  }
  
  // Solo marcar como inválido si hay errores, no warnings
  return {
    isValid: errors.length === 0, // Cambiar lógica aquí
    errors,
    warnings
  };
}
```

**Problema 2:** `canDeleteAnalysis` retorna false para análisis regulares

**Solución:**
```typescript
canDeleteAnalysis(analysis: Analysis): boolean {
  // Permitir eliminación de análisis regulares
  // Solo prevenir eliminación de análisis especiales (ej: demos, templates)
  return !analysis.isTemplate && !analysis.isDemo;
}
```

#### 2.2 HackathonAnalysisService

**Problema:** No identifica correctamente categoría "frankenstein"

**Solución:**
```typescript
evaluateProjectForCategory(description: string): CategoryEvaluation {
  const keywords = {
    frankenstein: ['combines', 'hybrid', 'mashup', 'fusion', 'blend'],
    resurrection: ['revive', 'bring back', 'resurrect', 'restore'],
    // ... otras categorías
  };
  
  // Mejorar lógica de detección
  const scores = new Map<string, number>();
  
  for (const [category, words] of Object.entries(keywords)) {
    const score = words.reduce((acc, word) => {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
      const matches = description.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);
    scores.set(category, score);
  }
  
  // Retornar categoría con mayor score
  const [recommendedCategory] = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])[0];
    
  return {
    recommendedCategory: Category.fromString(recommendedCategory),
    confidence: scores.get(recommendedCategory)! / words.length,
    alternativeCategories: []
  };
}
```

### 3. Infrastructure Layer Fixes

#### 3.1 AnalysisMapper

**Problema:** Campos vacíos se convierten a string vacío en lugar de undefined

**Solución:**
```typescript
toDomain(dao: AnalysisDAO): Analysis {
  return Analysis.reconstruct({
    id: AnalysisId.fromString(dao.id),
    idea: dao.idea,
    userId: UserId.fromString(dao.user_id),
    score: new Score(dao.score),
    // Convertir strings vacíos a undefined
    feedback: dao.feedback && dao.feedback.trim() !== '' 
      ? dao.feedback 
      : undefined,
    strengths: dao.strengths || [],
    weaknesses: dao.weaknesses || [],
    // ... otros campos
  });
}
```

#### 3.2 GoogleAIAdapter

**Problema:** Manejo de errores no proporciona mensajes específicos

**Solución:**
```typescript
async analyzeIdea(idea: string, locale: Locale): Promise<Result<AnalysisResult>> {
  try {
    const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = this.generatePrompt(idea, locale);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Mejorar parsing con mensajes específicos
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
    
    // Validar campos requeridos
    if (!parsed.score || !parsed.strengths || !parsed.weaknesses) {
      return failure(new AIServiceError(
        'Invalid AI response format: missing required fields',
        'INVALID_FORMAT'
      ));
    }
    
    // Validar score
    if (parsed.score < 0 || parsed.score > 100) {
      return failure(new AIServiceError(
        'Invalid score value: must be between 0 and 100',
        'INVALID_SCORE'
      ));
    }
    
    return success(parsed);
  } catch (error) {
    // Manejar diferentes tipos de errores
    if (error.message?.includes('rate limit')) {
      return failure(new AIServiceError(
        'API rate limit exceeded',
        'RATE_LIMIT',
        error
      ));
    }
    
    if (error.message?.includes('timeout')) {
      return failure(new AIServiceError(
        'Request timeout',
        'TIMEOUT',
        error
      ));
    }
    
    return failure(new AIServiceError(
      'Failed to analyze idea with Google AI',
      'UNKNOWN_ERROR',
      error
    ));
  }
}
```

#### 3.3 AnalysisController

**Problema:** Método `handleOptions` no existe

**Solución:**
```typescript
export class AnalysisController {
  // ... otros métodos
  
  /**
   * Handle OPTIONS preflight requests for CORS
   */
  async handleOptions(request: NextRequest): Promise<NextResponse> {
    return NextResponse.json(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
}
```

#### 3.4 AnalysisController Tests - Authentication

**Problema:** Tests fallan con 401 porque no hay autenticación configurada

**Solución:**
```typescript
describe('AnalysisController API Integration Tests', () => {
  let controller: AnalysisController;
  let mockAuthService: any;
  let mockUser: User;
  
  beforeEach(() => {
    // Setup mock auth service
    mockAuthService = {
      authenticate: vi.fn().mockResolvedValue({
        success: true,
        user: mockUser
      }),
      validateToken: vi.fn().mockResolvedValue(true)
    };
    
    // Create controller with mocked dependencies
    controller = new AnalysisController(
      mockCreateHandler,
      mockUpdateHandler,
      mockDeleteHandler,
      mockGetHandler,
      mockListHandler,
      mockSearchHandler,
      mockAuthService // Inyectar auth service
    );
  });
  
  it('should successfully create analysis with valid request', async () => {
    // Arrange
    const request = new NextRequest('http://localhost/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token' // Agregar token
      },
      body: JSON.stringify({
        idea: 'Test idea',
        locale: 'en'
      })
    });
    
    // Act
    const response = await controller.create(request);
    
    // Assert
    expect(response.status).toBe(201);
  });
});
```

### 4. Code Quality Improvements

#### 4.1 Eliminar Uso de `any`

**Estrategia:**
1. Identificar todos los usos de `any` en código de producción
2. Crear tipos específicos para cada caso
3. Usar tipos genéricos donde sea apropiado
4. Usar `unknown` para casos donde el tipo es realmente desconocido

**Ejemplos:**

```typescript
// Antes:
function handleError(error: any) {
  console.error(error);
}

// Después:
function handleError(error: Error | unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}

// Antes:
const data: any = await response.json();

// Después:
interface ResponseData {
  score: number;
  strengths: string[];
  weaknesses: string[];
}
const data: ResponseData = await response.json();
```

#### 4.2 Limpiar Imports y Variables No Utilizadas

**Estrategia:**
1. Usar prefijo `_` para parámetros requeridos pero no utilizados
2. Eliminar imports completamente no utilizados
3. Consolidar imports del mismo módulo

**Archivos específicos a corregir:**

```typescript
// app/actions/hackathon.ts
// Antes:
const _command = createCommand(input);
// Después: eliminar la variable si no se usa

// app/api/health/route.ts
// Antes:
export async function GET(request: NextRequest)
// Después:
export async function GET(_request: NextRequest)

// app/api/v2/analyze/route.ts y otros
// Agregar prefijo _ a todos los parámetros request y params no utilizados

// src/application/handlers/queries/__tests__/GetAnalysisHandler.test.ts
// Eliminar import de ValidationError si no se usa

// src/domain/entities/__tests__/test-runner.ts
// Eliminar imports de AnalysisId y BusinessRuleViolationError si no se usan

// src/domain/services/AnalysisValidationService.ts
// Antes:
private someMethod(analysis: Analysis)
// Después:
private someMethod(_analysis: Analysis)

// src/application/services/SessionService.ts
// Agregar prefijo _ a __userId si no se usa
```

**Ejemplos generales:**

```typescript
// Antes:
import { AnalysisId, UserId } from '@/domain/value-objects';

export function someFunction(userId: UserId) {
  // userId no se usa
  return true;
}

// Después:
export function someFunction(_userId: UserId) {
  // Prefijo _ indica que es requerido pero no usado
  return true;
}

// Eliminar import si no se usa en ningún lugar
```

## Data Models

No se requieren cambios en los modelos de datos. Los problemas son de implementación, no de diseño de datos.

## Error Handling

### Error Types Hierarchy

```typescript
// Ya existe, solo documentar uso correcto
DomainError
├── ValidationError
├── BusinessRuleViolationError
└── NotFoundError

ApplicationError
├── AIServiceError
│   ├── PARSE_ERROR
│   ├── INVALID_FORMAT
│   ├── INVALID_SCORE
│   ├── RATE_LIMIT
│   └── TIMEOUT
└── AuthenticationError

InfrastructureError
├── DatabaseError
└── ExternalServiceError
```

### Error Handling Strategy

1. **Domain Layer:** Lanzar errores de dominio específicos
2. **Application Layer:** Capturar y transformar errores de dominio
3. **Infrastructure Layer:** Capturar errores externos y convertir a errores de aplicación
4. **Web Layer:** Convertir todos los errores a respuestas HTTP apropiadas

## Testing Strategy

### Test Pyramid

```
E2E Tests (Mínimo)
    ↑
Integration Tests (Medio)
    ↑
Unit Tests (Máximo)
```

### Test Fixes Priority

1. **Unit Tests (Domain):** Corregir primero - son la base
2. **Unit Tests (Application):** Corregir segundo
3. **Integration Tests (Infrastructure):** Corregir tercero
4. **E2E Tests:** Mantener mínimos

### Mock Strategy

```typescript
// Crear factories para mocks reutilizables
export const createMockAnalysisRepository = (): IAnalysisRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  delete: vi.fn(),
  search: vi.fn()
});

export const createMockGoogleAI = () => ({
  getGenerativeModel: vi.fn().mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          score: 85,
          strengths: ['Good idea'],
          weaknesses: ['Needs work']
        })
      }
    })
  })
});
```

### 5. SupabaseAdapter Security Fix

#### 5.1 Problema de Seguridad: Session Leak por Singleton Caching

**Problema Crítico:** El método `getServerClient()` en `SupabaseAdapter` cachea el cliente de Supabase en una variable estática `serverInstance`. En Next.js, cada petición HTTP debe usar su propio cliente con sus propias cookies porque:

1. Las cookies contienen el token de sesión del usuario
2. El cookie store es específico de cada petición
3. Cachear el cliente significa que el primer usuario que hace una petición "congela" sus cookies para todos los usuarios subsecuentes
4. Esto causa:
   - **Session Leak:** Usuario B puede acceder a la sesión de Usuario A
   - **Stale Tokens:** Los refresh tokens no se actualizan cuando las cookies cambian
   - **Authentication Bypass:** Usuarios no autenticados pueden heredar sesiones de usuarios autenticados

**Severidad:** CRÍTICA - Vulnerabilidad de seguridad que permite acceso no autorizado a cuentas de otros usuarios.

**Solución:**

```typescript
// src/infrastructure/integration/SupabaseAdapter.ts

export class SupabaseAdapter {
  // ELIMINAR: private static serverInstance: any = null;
  private static clientInstance: any = null; // Mantener solo para client-side

  /**
   * Get Supabase client for server-side operations
   * IMPORTANTE: Crea un nuevo cliente para cada petición usando las cookies actuales
   */
  static getServerClient(): SupabaseClient {
    // ANTES (INSEGURO):
    // if (!SupabaseAdapter.serverInstance) {
    //   SupabaseAdapter.serverInstance = createServerComponentClient({ cookies });
    // }
    // return SupabaseAdapter.serverInstance;
    
    // DESPUÉS (SEGURO):
    // Siempre crear un nuevo cliente con el cookie store actual
    return createServerComponentClient({ cookies }) as any;
  }

  /**
   * Get Supabase client for client-side operations
   * El singleton es seguro aquí porque cada navegador tiene su propio contexto
   */
  static getClientClient(): SupabaseClient {
    if (!SupabaseAdapter.clientInstance) {
      SupabaseAdapter.clientInstance = createClientComponentClient();
    }
    return SupabaseAdapter.clientInstance;
  }

  /**
   * Create a new server client instance
   * DEPRECADO: Ya no es necesario porque getServerClient siempre crea uno nuevo
   */
  static createServerClient(): SupabaseClient {
    return createServerComponentClient({ cookies }) as any;
  }

  /**
   * Reset instances
   * ACTUALIZAR: Solo resetear clientInstance
   */
  static resetInstances(): void {
    // ELIMINAR: SupabaseAdapter.serverInstance = null;
    SupabaseAdapter.clientInstance = null;
  }
}
```

**Impacto en el Código:**

1. **Repositorios:** No requieren cambios - ya usan `getServerClient()` correctamente
2. **Controllers:** No requieren cambios - ya usan `getServerClient()` correctamente
3. **API Routes:** No requieren cambios - ya usan `getServerClient()` correctamente
4. **Tests:** Actualizar para no depender del singleton

**Tests Actualizados:**

```typescript
// src/infrastructure/integration/__tests__/SupabaseAdapter.test.ts

describe('SupabaseAdapter', () => {
  beforeEach(() => {
    // Limpiar solo clientInstance
    SupabaseAdapter.resetInstances();
  });

  describe('getServerClient', () => {
    it('should create a new client for each call', () => {
      const client1 = SupabaseAdapter.getServerClient();
      const client2 = SupabaseAdapter.getServerClient();
      
      // IMPORTANTE: Deben ser instancias diferentes
      expect(client1).not.toBe(client2);
    });

    it('should use current request cookies', async () => {
      // Mock cookies para simular diferentes usuarios
      const mockCookies1 = { get: vi.fn().mockReturnValue('user1-token') };
      const mockCookies2 = { get: vi.fn().mockReturnValue('user2-token') };
      
      // Simular dos peticiones diferentes
      vi.mocked(cookies).mockReturnValueOnce(mockCookies1 as any);
      const client1 = SupabaseAdapter.getServerClient();
      
      vi.mocked(cookies).mockReturnValueOnce(mockCookies2 as any);
      const client2 = SupabaseAdapter.getServerClient();
      
      // Verificar que cada cliente usa sus propias cookies
      expect(client1).not.toBe(client2);
    });
  });

  describe('getClientClient', () => {
    it('should return singleton for client-side', () => {
      const client1 = SupabaseAdapter.getClientClient();
      const client2 = SupabaseAdapter.getClientClient();
      
      // Client-side puede ser singleton
      expect(client1).toBe(client2);
    });
  });
});
```

**Validación de Seguridad:**

```typescript
// Crear test de integración para verificar aislamiento de sesiones
describe('Session Isolation Integration Test', () => {
  it('should not leak sessions between users', async () => {
    // Simular Usuario A haciendo login
    const userARequest = new NextRequest('http://localhost/api/analyze', {
      headers: { 'Cookie': 'sb-access-token=user-a-token' }
    });
    
    const clientA = SupabaseAdapter.getServerClient();
    const { data: userA } = await clientA.auth.getUser();
    
    // Simular Usuario B haciendo login
    const userBRequest = new NextRequest('http://localhost/api/analyze', {
      headers: { 'Cookie': 'sb-access-token=user-b-token' }
    });
    
    const clientB = SupabaseAdapter.getServerClient();
    const { data: userB } = await clientB.auth.getUser();
    
    // Verificar que son usuarios diferentes
    expect(userA?.id).not.toBe(userB?.id);
    
    // Verificar que Usuario B no puede acceder a datos de Usuario A
    const analysisA = await clientA.from('analyses').select().eq('user_id', userA?.id);
    const analysisBAttempt = await clientB.from('analyses').select().eq('user_id', userA?.id);
    
    expect(analysisA.data?.length).toBeGreaterThan(0);
    expect(analysisBAttempt.data?.length).toBe(0); // RLS debe bloquear acceso
  });
});
```

**Documentación:**

```typescript
/**
 * IMPORTANTE: Seguridad de Supabase Client
 * 
 * Server-Side:
 * - NUNCA cachear el cliente de Supabase en server-side
 * - Cada petición debe crear su propio cliente con cookies frescas
 * - El cookie store contiene tokens de sesión específicos del usuario
 * - Cachear el cliente causa session leaks entre usuarios
 * 
 * Client-Side:
 * - Es seguro usar singleton porque cada navegador tiene su propio contexto
 * - Las cookies son manejadas automáticamente por el navegador
 * 
 * Uso Correcto:
 * ```typescript
 * // En Server Components, API Routes, Server Actions:
 * const supabase = SupabaseAdapter.getServerClient(); // Siempre fresco
 * 
 * // En Client Components:
 * const supabase = SupabaseAdapter.getClientClient(); // Singleton OK
 * ```
 */
```

### 6. UI Internationalization Fixes

#### 5.1 Problema de Traducción de Componentes

**Problema:** Cuando el usuario cambia el locale a español, algunos elementos de la UI (botones, labels, mensajes) permanecen en inglés.

**Causa Raíz:** Componentes que no están usando el hook `useTranslation` o que tienen texto hardcodeado en lugar de usar claves de traducción.

**Solución:**

1. **Identificar componentes sin traducción:**
```bash
# Buscar componentes con texto hardcodeado
grep -r "button.*>" features/ app/ --include="*.tsx" | grep -v "useTranslation"
```

2. **Patrón correcto de uso:**
```typescript
// Antes (texto hardcodeado):
export function AnalyzeButton() {
  return <button>Analyze Idea</button>;
}

// Después (usando traducción):
import { useTranslation } from '@/features/locale/context/LocaleContext';

export function AnalyzeButton() {
  const { t } = useTranslation();
  return <button>{t('analyzer.analyzeButton')}</button>;
}
```

3. **Verificar claves de traducción:**
```typescript
// Asegurar que las claves existan en ambos archivos:
// locales/en.json
{
  "analyzer": {
    "analyzeButton": "Analyze Idea",
    "submitButton": "Submit",
    "cancelButton": "Cancel"
  }
}

// locales/es.json
{
  "analyzer": {
    "analyzeButton": "Analizar Idea",
    "submitButton": "Enviar",
    "cancelButton": "Cancelar"
  }
}
```

4. **Componentes comunes a revisar:**
   - Botones de acción (Submit, Cancel, Analyze, etc.)
   - Labels de formularios
   - Mensajes de error y éxito
   - Tooltips y placeholders
   - Títulos y descripciones

5. **Estrategia de búsqueda:**
```typescript
// Buscar patrones comunes de texto hardcodeado:
// - <button>Text</button>
// - <label>Text</label>
// - placeholder="Text"
// - title="Text"
// - aria-label="Text"

// Reemplazar con:
// - <button>{t('key')}</button>
// - <label>{t('key')}</label>
// - placeholder={t('key')}
// - title={t('key')}
// - aria-label={t('key')}
```

6. **Validación:**
```typescript
// Crear script de validación para verificar que todas las claves
// en en.json tengan su equivalente en es.json
const validateTranslations = () => {
  const enKeys = Object.keys(flatten(enTranslations));
  const esKeys = Object.keys(flatten(esTranslations));
  
  const missingInEs = enKeys.filter(key => !esKeys.includes(key));
  const missingInEn = esKeys.filter(key => !enKeys.includes(key));
  
  if (missingInEs.length > 0) {
    console.error('Missing in es.json:', missingInEs);
  }
  if (missingInEn.length > 0) {
    console.error('Missing in en.json:', missingInEn);
  }
};
```

## Implementation Order

1. **Fase 1: CRÍTICO - Security Fix**
   - **PRIORIDAD MÁXIMA:** Corregir SupabaseAdapter session leak
   - Eliminar singleton de serverInstance
   - Actualizar tests de SupabaseAdapter
   - Crear tests de integración para validar aislamiento de sesiones
   - Verificar que no hay session leaks en producción

2. **Fase 2: Configuración y Setup**
   - Corregir imports en tests
   - Configurar mocks correctamente
   - Verificar exports de clases

3. **Fase 3: Domain Layer**
   - Corregir AnalysisValidationService
   - Corregir HackathonAnalysisService

4. **Fase 4: Infrastructure - Mappers**
   - Corregir AnalysisMapper
   - Verificar otros mappers

5. **Fase 5: Infrastructure - External**
   - Corregir GoogleAIAdapter
   - Mejorar manejo de errores

6. **Fase 6: Infrastructure - Web**
   - Agregar handleOptions a controllers
   - Corregir tests de controllers
   - Corregir tests de middleware

7. **Fase 7: Code Quality**
   - Eliminar uso de `any`
   - Limpiar imports no utilizados
   - Agregar prefijo `_` a parámetros no usados

8. **Fase 8: UI Internationalization**
   - Identificar componentes con texto hardcodeado
   - Agregar useTranslation a componentes
   - Agregar claves de traducción faltantes
   - Validar completitud de traducciones

## Performance Considerations

- Los cambios son principalmente de corrección, no de performance
- Asegurar que los mocks no agreguen overhead en tests
- Mantener la estrategia de caching existente en factories

## Security Considerations

### CRÍTICO: SupabaseAdapter Session Leak

**Vulnerabilidad Identificada:**
- Caching de cliente Supabase server-side causa session leaks entre usuarios
- Tokens de autenticación pueden ser compartidos entre diferentes usuarios
- Refresh tokens no se actualizan correctamente

**Mitigación:**
- Eliminar singleton pattern para server-side client
- Crear nuevo cliente para cada petición HTTP
- Mantener singleton solo para client-side (seguro en navegador)
- Implementar tests de integración para validar aislamiento

**Validación:**
- Tests unitarios verifican que cada llamada crea nueva instancia
- Tests de integración verifican aislamiento de sesiones
- Tests de seguridad verifican que RLS funciona correctamente

**Otras Consideraciones:**
- Mantener validación de inputs existente
- Asegurar que los tests no expongan datos sensibles
- Verificar que todos los API routes usan autenticación correcta

## Monitoring and Logging

- Mejorar mensajes de error para facilitar debugging
- Mantener logging existente en capa de infrastructure
- Agregar logs específicos en GoogleAIAdapter para diferentes tipos de errores

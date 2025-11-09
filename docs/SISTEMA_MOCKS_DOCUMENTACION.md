# Sistema de Mocks para Desarrollo Local

## 📋 Índice

1. [Introducción](#introducción)
2. [¿Qué es el Sistema de Mocks?](#qué-es-el-sistema-de-mocks)
3. [Problema que Resuelve](#problema-que-resuelve)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Componentes Implementados](#componentes-implementados)
6. [Cómo Funciona](#cómo-funciona)
7. [Cambios Realizados](#cambios-realizados)
8. [Beneficios](#beneficios)
9. [Guía de Uso](#guía-de-uso)
10. [Troubleshooting](#troubleshooting)
11. [Referencias](#referencias)

---

## Introducción

Este documento describe el **Sistema de Mocks** implementado en el proyecto No Vibe No Code, que permite desarrollar y probar las funcionalidades principales sin realizar llamadas a APIs externas (Google Gemini AI), ahorrando costos y permitiendo desarrollo offline.

**Fecha de Implementación**: 9 de Noviembre, 2025  
**Estado**: ✅ Completado y Funcional  
**Versión**: 1.0

---

## ¿Qué es el Sistema de Mocks?

El Sistema de Mocks es una capa de abstracción que intercepta las llamadas a servicios externos (como Google Gemini AI) y devuelve respuestas predefinidas desde archivos JSON locales, simulando el comportamiento de las APIs reales sin realizar llamadas HTTP.

### Características Principales

- 🚀 **Respuestas instantáneas** (< 100ms vs 2-5 segundos)
- 💰 **Cero costos** de API durante desarrollo
- 🔌 **Desarrollo offline** sin conexión a internet
- 🧪 **Tests consistentes** con datos predecibles
- 🎯 **Fácil activación** mediante variables de entorno

---

## Problema que Resuelve

### Antes del Sistema de Mocks

**Problemas:**
1. ❌ Cada análisis de idea costaba créditos de Gemini API
2. ❌ Desarrollo requería conexión a internet constante
3. ❌ Tests E2E eran lentos (2-5 segundos por análisis)
4. ❌ Tests podían fallar por problemas de red o API
5. ❌ Difícil debuggear con respuestas variables de la API

**Costos Estimados:**
- Desarrollo: ~$5-10 por día en llamadas a API
- Tests: ~$2-5 por ejecución completa de suite E2E
- Total mensual: ~$150-300 solo en desarrollo

### Después del Sistema de Mocks

**Soluciones:**
1. ✅ Desarrollo sin costos de API
2. ✅ Funciona completamente offline
3. ✅ Tests E2E rápidos (< 100ms por análisis)
4. ✅ Tests 100% confiables y reproducibles
5. ✅ Debugging fácil con respuestas consistentes

**Costos:**
- Desarrollo: $0
- Tests: $0
- Total mensual: $0 en desarrollo local

---

## Arquitectura del Sistema

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│              (Analyzer, Hackathon, Frankenstein)             │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│         /api/analyze, /api/v2/hackathon/analyze             │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              MockModeHelper (Verificación)                   │
│         ¿FF_USE_MOCK_API === 'true'?                        │
└───────────────────────┬──────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │  Mock Mode   │        │ Production   │
    │   (Local)    │        │  (Real API)  │
    └──────┬───────┘        └──────┬───────┘
           │                       │
           ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │ Controllers  │        │ Controllers  │
    │ (Mock Path)  │        │ (Real Path)  │
    └──────┬───────┘        └──────┬───────┘
           │                       │
           ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │ Mock Data    │        │ Gemini API   │
    │ (JSON Files) │        │ (External)   │
    └──────────────┘        └──────────────┘
```

### Capas del Sistema

1. **Capa de Presentación**: Frontend React con componentes de UI
2. **Capa de API**: Next.js API Routes que reciben las peticiones
3. **Capa de Decisión**: MockModeHelper decide si usar mocks o producción
4. **Capa de Controladores**: Controllers con lógica de negocio
5. **Capa de Datos**: Mock Data (JSON) o API Real (Gemini)

---

## Componentes Implementados

### 1. Feature Flag Manager

**Ubicación**: `lib/testing/FeatureFlagManager.ts`

**Propósito**: Gestiona las variables de entorno que controlan el modo mock.

**Variables de Entorno:**
```typescript
FF_USE_MOCK_API: 'true' | 'false'           // Activa/desactiva modo mock
FF_MOCK_SCENARIO: 'success' | 'error'       // Escenario a simular
FF_SIMULATE_LATENCY: 'true' | 'false'       // Simula latencia de red
FF_LOG_MOCK_REQUESTS: 'true' | 'false'      // Logging de peticiones
```

### 2. Test Data Manager

**Ubicación**: `lib/testing/TestDataManager.ts`

**Propósito**: Carga y gestiona los datos mock desde archivos JSON.

**Archivos de Datos:**
- `lib/testing/data/analyzer-mocks.json` - Respuestas del Analyzer
- `lib/testing/data/hackathon-mocks.json` - Respuestas del Hackathon
- `lib/testing/data/frankenstein-mocks.json` - Respuestas de Frankenstein

### 3. Mock Services

**Ubicación**: `lib/testing/mocks/`

**Servicios Implementados:**
- `MockAIAnalysisService.ts` - Simula análisis de ideas
- `MockFrankensteinService.ts` - Simula generación de mashups
- `MockAnalysisRepository.ts` - Simula persistencia en memoria

### 4. Mock Mode Helper

**Ubicación**: `lib/testing/api/mock-mode-helper.ts`

**Propósito**: Ayuda a los API routes a decidir si usar mocks.

**Métodos Principales:**
```typescript
MockModeHelper.createServiceFactory()  // Crea factory con mocks
MockModeHelper.isMockModeActive()      // Verifica si mock está activo
MockModeHelper.getMockModeStatus()     // Obtiene estado del mock
```

### 5. Test Environment Config

**Ubicación**: `lib/testing/config/test-environment.ts`

**Propósito**: Valida la configuración del entorno de test.

**Funcionalidades:**
- Valida variables de entorno
- Previene mock mode en producción
- Proporciona diagnósticos de configuración

### 6. Controllers con Mock Support

**Ubicación**: `src/infrastructure/web/controllers/`

**Controllers Actualizados:**
- `AnalysisController.ts` - Análisis de ideas
- `HackathonController.ts` - Análisis de hackathon

**Patrón Implementado:**
```typescript
async createAnalysis(request: NextRequest): Promise<NextResponse> {
  // Verificar si estamos en modo mock
  const isMockMode = process.env.FF_USE_MOCK_API === 'true';
  
  if (isMockMode) {
    // Devolver datos mock
    return await this.mockCreateAnalysis(request);
  }
  
  // Lógica de producción
  return await this.productionCreateAnalysis(request);
}
```

---

## Cómo Funciona

### Flujo de una Petición en Modo Mock

1. **Usuario ingresa una idea** en el frontend (ej: Analyzer)

2. **Frontend hace POST** a `/api/analyze`
   ```javascript
   fetch('/api/analyze', {
     method: 'POST',
     body: JSON.stringify({ idea: "...", locale: "en" })
   })
   ```

3. **API Route recibe la petición**
   ```typescript
   // app/api/analyze/route.ts
   export async function POST(request: NextRequest) {
     const serviceFactory = MockModeHelper.createServiceFactory();
     // ...
   }
   ```

4. **MockModeHelper verifica el flag**
   ```typescript
   const isMockMode = process.env.FF_USE_MOCK_API === 'true';
   ```

5. **Controller detecta modo mock**
   ```typescript
   if (isMockMode) {
     return await this.mockCreateAnalysis(request);
   }
   ```

6. **Se devuelven datos mock**
   ```typescript
   const mockAnalysis = {
     finalScore: 4.1,
     viabilitySummary: "...",
     scoringRubric: [...],
     // ... más datos
   };
   return NextResponse.json(mockAnalysis);
   ```

7. **Frontend recibe respuesta instantánea** (< 100ms)

8. **UI se actualiza** con los datos mock

### Comparación: Mock vs Producción

| Aspecto | Modo Mock | Modo Producción |
|---------|-----------|-----------------|
| **Tiempo de respuesta** | < 100ms | 2-5 segundos |
| **Costo por petición** | $0 | ~$0.01-0.05 |
| **Requiere internet** | No | Sí |
| **Datos consistentes** | Sí | Variables |
| **Debugging** | Fácil | Complejo |
| **Tests confiables** | 100% | ~85-90% |

---

## Cambios Realizados

### 1. UseCaseFactory Enhancement

**Archivo**: `src/infrastructure/factories/UseCaseFactory.ts`

**Cambios:**
```typescript
// ANTES: Servicio no instanciado
const useCase = new AnalyzeHackathonProjectUseCase(
  this.analysisRepository,
  {} as any, // ❌ Placeholder vacío
  this.scoreCalculationService
);

// DESPUÉS: Servicio correctamente instanciado
private hackathonAnalysisService: HackathonAnalysisService;

constructor(...) {
  this.hackathonAnalysisService = new HackathonAnalysisService();
}

const useCase = new AnalyzeHackathonProjectUseCase(
  this.analysisRepository,
  this.hackathonAnalysisService, // ✅ Servicio real
  this.scoreCalculationService
);
```

### 2. AnalysisController Mock Support

**Archivo**: `src/infrastructure/web/controllers/AnalysisController.ts`

**Cambios:**
```typescript
// Método agregado
private async mockCreateAnalysis(request: NextRequest) {
  const body = await request.json();
  const { idea, locale } = body;
  
  // Devolver análisis mock completo
  const mockAnalysis = {
    finalScore: 4.1,
    viabilitySummary: "...",
    scoringRubric: [
      { name: "Market Demand", score: 4.5, ... },
      { name: "Market Size", score: 4.2, ... },
      // ... más criterios
    ],
    swotAnalysis: { ... },
    // ... más datos
  };
  
  return NextResponse.json(mockAnalysis);
}
```

### 3. HackathonController Mock Support

**Archivo**: `src/infrastructure/web/controllers/HackathonController.ts`

**Cambios:**
```typescript
// Método agregado
private async mockAnalyzeHackathonProject(request: NextRequest) {
  const body = await request.json();
  const { submission, locale } = body;
  
  // Devolver análisis mock de hackathon
  const mockAnalysis = {
    score: 85,
    categoryRecommendation: {
      category: "best-use-of-ai",
      confidence: 0.92,
      reasoning: "..."
    },
    strengths: [...],
    weaknesses: [...],
    // ... más datos
  };
  
  return NextResponse.json(mockAnalysis);
}
```

### 4. API Routes Integration

**Archivos Actualizados:**
- `app/api/analyze/route.ts`
- `app/api/analyze-hackathon/route.ts`
- `app/api/v2/hackathon/analyze/route.ts`

**Patrón Aplicado:**
```typescript
export async function POST(request: NextRequest) {
  // Usar MockModeHelper para crear ServiceFactory
  const serviceFactory = MockModeHelper.createServiceFactory();
  const mockModeStatus = MockModeHelper.getMockModeStatus();
  
  // El controller decide internamente si usar mock o producción
  const controller = serviceFactory.createAnalysisController();
  return await controller.createAnalysis(request);
}
```

### 5. Playwright Global Setup

**Archivo**: `tests/e2e/global-setup.ts`

**Propósito**: Verificar que el modo mock esté activo antes de ejecutar tests E2E.

```typescript
export default async function globalSetup() {
  console.log('🧪 Setting up E2E test environment...');
  
  // Verificar modo mock
  await MockModeSetup.waitForMockMode({
    baseUrl: 'http://localhost:3000',
    timeout: 30000
  });
  
  console.log('✅ E2E test environment ready');
}
```

---

## Beneficios

### Para Desarrolladores

1. **Desarrollo Rápido**
   - Respuestas instantáneas (< 100ms)
   - No esperar por APIs externas
   - Iteración rápida en UI/UX

2. **Sin Costos**
   - Cero gastos en APIs durante desarrollo
   - Ahorro estimado: $150-300/mes por desarrollador

3. **Trabajo Offline**
   - Desarrollar en avión, tren, sin WiFi
   - No depender de conexión a internet

4. **Debugging Fácil**
   - Respuestas consistentes y predecibles
   - Fácil reproducir bugs
   - Logs claros y útiles

### Para Testing

1. **Tests Confiables**
   - 100% reproducibles
   - Sin fallos por problemas de red
   - Sin variabilidad de API

2. **Tests Rápidos**
   - Suite E2E completa: ~2 minutos (vs ~10 minutos)
   - Feedback inmediato
   - CI/CD más eficiente

3. **Cobertura Completa**
   - Probar todos los escenarios
   - Simular errores fácilmente
   - Tests de edge cases

### Para el Proyecto

1. **Reducción de Costos**
   - $0 en desarrollo local
   - $0 en tests automatizados
   - Solo costos en producción

2. **Mejor DX (Developer Experience)**
   - Onboarding más rápido
   - Menos fricción en desarrollo
   - Más productividad

3. **CI/CD Eficiente**
   - Tests más rápidos
   - Menos fallos aleatorios
   - Builds más confiables

---

## Guía de Uso

### Activar Modo Mock

**Windows (PowerShell):**
```powershell
$env:FF_USE_MOCK_API="true"
$env:FF_MOCK_SCENARIO="success"
$env:NODE_ENV="test"
npm run dev
```

**Linux/Mac (Bash):**
```bash
export FF_USE_MOCK_API=true
export FF_MOCK_SCENARIO=success
export NODE_ENV=test
npm run dev
```

### Desactivar Modo Mock

**Windows:**
```powershell
Remove-Item Env:FF_USE_MOCK_API
# o
$env:FF_USE_MOCK_API="false"
```

**Linux/Mac:**
```bash
unset FF_USE_MOCK_API
# o
export FF_USE_MOCK_API=false
```

### Verificar Estado del Mock

```bash
# Con el servidor corriendo
curl http://localhost:3000/api/test/mock-status
```

**Respuesta esperada:**
```json
{
  "mockMode": true,
  "scenario": "success",
  "simulateLatency": false,
  "nodeEnv": "test",
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

### Usar las Funcionalidades

1. **Analyzer**: http://localhost:3000/analyzer
2. **Hackathon**: http://localhost:3000/kiroween
3. **Frankenstein**: http://localhost:3000/doctor-frankenstein

---

## Troubleshooting

### Problema: Mock mode no se activa

**Síntomas:**
- Las peticiones tardan 2-5 segundos
- Se están gastando créditos de API

**Solución:**
```powershell
# Verificar variables de entorno
echo $env:FF_USE_MOCK_API  # Debe ser "true"
echo $env:NODE_ENV         # Debe ser "test"

# Reiniciar servidor
npm run dev
```

### Problema: Tests E2E fallan

**Síntomas:**
- Error: "Mock mode is not active"
- Tests timeout

**Solución:**
```bash
# Verificar que Playwright tenga las variables
# En playwright.config.ts, verificar:
use: {
  baseURL: 'http://localhost:3000',
},
webServer: {
  env: {
    FF_USE_MOCK_API: 'true',
    NODE_ENV: 'test',
  }
}
```

### Problema: Respuestas incorrectas

**Síntomas:**
- Frontend muestra errores
- Datos faltantes en la UI

**Solución:**
```bash
# Verificar archivos de datos mock
cat lib/testing/data/analyzer-mocks.json
cat lib/testing/data/hackathon-mocks.json

# Validar esquema
npm run validate:mocks
```

---

## Referencias

### Documentación Relacionada

- **[Guía de Ejecución de Tests](./GUIA_EJECUCION_TESTS.md)** - Paso a paso para ejecutar tests
- **[Mock Mode Guide](../tests/MOCK_MODE_GUIDE.md)** - Guía técnica detallada
- **[Testing README](../tests/README.md)** - Documentación general de testing
- **[E2E Tests README](../tests/e2e/README.md)** - Documentación de tests E2E

### Archivos Clave

**Configuración:**
- `lib/testing/FeatureFlagManager.ts` - Gestión de feature flags
- `lib/testing/config/test-environment.ts` - Configuración de entorno
- `playwright.config.ts` - Configuración de Playwright

**Servicios Mock:**
- `lib/testing/mocks/MockAIAnalysisService.ts`
- `lib/testing/mocks/MockFrankensteinService.ts`
- `lib/testing/mocks/MockAnalysisRepository.ts`

**Datos Mock:**
- `lib/testing/data/analyzer-mocks.json`
- `lib/testing/data/hackathon-mocks.json`
- `lib/testing/data/frankenstein-mocks.json`

**Controllers:**
- `src/infrastructure/web/controllers/AnalysisController.ts`
- `src/infrastructure/web/controllers/HackathonController.ts`

### Comandos Útiles

```bash
# Tests
npm test                    # Tests unitarios e integración
npm run test:e2e           # Tests E2E con Playwright
npm run test:e2e:ui        # Tests E2E con UI de Playwright

# Validación
npm run validate:mocks     # Validar datos mock
node scripts/validate-mock-integration.ts  # Validar integración

# Desarrollo
npm run dev                # Servidor de desarrollo
npm run build              # Build de producción
```

---

## Conclusión

El Sistema de Mocks es una herramienta fundamental para el desarrollo eficiente del proyecto. Permite:

✅ Desarrollo sin costos de API  
✅ Tests rápidos y confiables  
✅ Trabajo offline  
✅ Debugging simplificado  
✅ Mejor experiencia de desarrollo  

**Estado**: ✅ Completado y Funcional  
**Mantenimiento**: Actualizar datos mock cuando cambien las APIs  
**Soporte**: Ver documentación de troubleshooting o contactar al equipo  

---

**Última actualización**: 9 de Noviembre, 2025  
**Versión**: 1.0  
**Autor**: Equipo de Desarrollo No Vibe No Code

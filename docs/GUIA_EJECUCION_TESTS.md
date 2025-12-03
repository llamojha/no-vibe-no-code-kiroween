# Guía de Ejecución de Tests y Automatizaciones

## 📋 Índice

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Tipos de Tests](#tipos-de-tests)
4. [Configuración Inicial](#configuración-inicial)
5. [Ejecutar Tests de Integración](#ejecutar-tests-de-integración)
6. [Ejecutar Tests E2E](#ejecutar-tests-e2e)
7. [Ejecutar Tests Específicos](#ejecutar-tests-específicos)
8. [Ver Reportes](#ver-reportes)
9. [Debugging de Tests](#debugging-de-tests)
10. [CI/CD](#cicd)
11. [Troubleshooting](#troubleshooting)

---

## Introducción

Esta guía te enseñará paso a paso cómo ejecutar todos los tests y automatizaciones del proyecto, incluyendo tests de integración y tests E2E (End-to-End) con Playwright.

**Tiempo estimado**: 15-20 minutos para primera ejecución  
**Nivel**: Principiante a Intermedio

---

## Requisitos Previos

### Software Necesario

1. **Node.js** (v18 o superior)
   ```bash
   node --version  # Debe mostrar v18.x.x o superior
   ```

2. **npm** (viene con Node.js)
   ```bash
   npm --version  # Debe mostrar 9.x.x o superior
   ```

3. **Git** (para clonar el repositorio)
   ```bash
   git --version
   ```

### Instalación del Proyecto

```bash
# 1. Clonar el repositorio (si aún no lo has hecho)
git clone <url-del-repositorio>
cd no-vibe-no-code

# 2. Instalar dependencias
npm install

# 3. Instalar navegadores de Playwright (solo primera vez)
npx playwright install
```

---

## Tipos de Tests

### 1. Tests de Integración

**Qué prueban**: Integración entre componentes del sistema (ServiceFactory, Mocks, API Routes)

**Herramienta**: Vitest  
**Ubicación**: `tests/integration/`  
**Duración**: ~2 segundos  
**Cantidad**: 78 tests

### 2. Tests E2E (End-to-End)

**Qué prueban**: Flujos completos de usuario en el navegador

**Herramienta**: Playwright  
**Ubicación**: `tests/e2e/`  
**Duración**: ~2 minutos  
**Cantidad**: 36 tests

---

## Configuración Inicial

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env.test` en la raíz del proyecto:

```bash
# .env.test
FF_USE_MOCK_API=true
FF_MOCK_SCENARIO=success
FF_SIMULATE_LATENCY=false
FF_LOG_MOCK_REQUESTS=true
NODE_ENV=test
```

### Paso 2: Verificar Configuración

```bash
# Windows (PowerShell)
$env:FF_USE_MOCK_API="true"
$env:NODE_ENV="test"

# Linux/Mac (Bash)
export FF_USE_MOCK_API=true
export NODE_ENV=test
```

---

## Ejecutar Tests de Integración

### Opción 1: Todos los Tests de Integración

```bash
npm test tests/integration
```

**Salida esperada:**
```
✓ tests/integration/environment-configuration.test.ts (4 tests)
✓ tests/integration/service-factory.test.ts (4 tests)
✓ tests/integration/mock-service-functionality.test.ts (4 tests)
✓ tests/integration/api-routes.test.ts (4 tests)

Test Files  4 passed (4)
Tests  78 passed (78)
Duration  ~2s
```

### Opción 2: Test Específico

```bash
# Test de configuración de entorno
npm test tests/integration/environment-configuration.test.ts

# Test de ServiceFactory
npm test tests/integration/service-factory.test.ts

# Test de funcionalidad de mocks
npm test tests/integration/mock-service-functionality.test.ts

# Test de rutas API
npm test tests/integration/api-routes.test.ts
```

### Interpretar Resultados

✅ **Verde/Passed**: Test exitoso  
❌ **Rojo/Failed**: Test falló (revisar error)  
⚠️ **Amarillo/Warning**: Advertencia (no crítico)

**Ejemplo de test exitoso:**
```
✓ should validate test environment correctly (5ms)
✓ should read current configuration (3ms)
✓ should detect invalid configuration (4ms)
```

---

## Ejecutar Tests E2E

### Paso 1: Iniciar Servidor de Desarrollo

**Terminal 1** (dejar corriendo):
```bash
# Windows
$env:FF_USE_MOCK_API="true"
$env:NODE_ENV="test"
npm run dev

# Linux/Mac
export FF_USE_MOCK_API=true
export NODE_ENV=test
npm run dev
```

Espera a ver:
```
✓ Ready in 1448ms
- Local: http://localhost:3000
```

### Paso 2: Ejecutar Tests E2E

**Terminal 2** (nueva terminal):

#### Opción A: Todos los Tests E2E

```bash
npm run test:e2e
```

**Duración**: ~2 minutos  
**Salida esperada:**
```
Running 36 tests using 4 workers

✓ tests/e2e/analyzer.spec.ts (5 tests) - 15s
✓ tests/e2e/hackathon.spec.ts (8 tests) - 25s
✓ tests/e2e/frankenstein.spec.ts (5 tests) - 18s
✓ tests/e2e/dashboard.spec.ts (5 tests) - 12s

18 passed (1.3m)
```

#### Opción B: Tests con UI Interactiva

```bash
npm run test:e2e:ui
```

Esto abrirá una interfaz gráfica donde puedes:
- Ver tests en tiempo real
- Pausar y debuggear
- Ver screenshots y videos
- Ejecutar tests individuales

#### Opción C: Tests en Modo Debug

```bash
npx playwright test --debug
```

Esto abrirá el navegador y el inspector de Playwright para debugging paso a paso.

### Paso 3: Detener Servidor

En la Terminal 1, presiona `Ctrl+C` para detener el servidor.

---

## Ejecutar Tests Específicos

### Por Archivo

```bash
# Solo tests del Analyzer
npx playwright test tests/e2e/analyzer.spec.ts

# Solo tests del Hackathon
npx playwright test tests/e2e/hackathon.spec.ts

# Solo tests de Frankenstein
npx playwright test tests/e2e/frankenstein.spec.ts

# Solo tests del Dashboard
npx playwright test tests/e2e/dashboard.spec.ts
```

### Por Test Individual

```bash
# Ejecutar un test específico por línea
npx playwright test tests/e2e/analyzer.spec.ts:33

# Ejecutar tests que coincidan con un patrón
npx playwright test --grep "should analyze idea successfully"
```

### Por Navegador

```bash
# Solo en Chromium
npx playwright test --project=chromium

# Solo en Firefox
npx playwright test --project=firefox

# Solo en WebKit (Safari)
npx playwright test --project=webkit
```

### Combinaciones

```bash
# Analyzer en Chromium con UI
npx playwright test tests/e2e/analyzer.spec.ts --project=chromium --ui

# Hackathon en modo debug
npx playwright test tests/e2e/hackathon.spec.ts --debug

# Dashboard con headed mode (ver navegador)
npx playwright test tests/e2e/dashboard.spec.ts --headed
```

---

## Ver Reportes

### Reporte HTML de Playwright

Después de ejecutar tests E2E:

```bash
npx playwright show-report tests/e2e/reports/html
```

Esto abrirá un navegador con:
- ✅ Tests pasados/fallados
- 📊 Estadísticas
- 📸 Screenshots de fallos
- 🎥 Videos de ejecución
- 📝 Logs detallados

### Reporte en Terminal

```bash
# Reporte detallado
npx playwright test --reporter=list

# Reporte en formato JSON
npx playwright test --reporter=json > test-results.json

# Reporte en formato JUnit (para CI/CD)
npx playwright test --reporter=junit > junit-results.xml
```

### Ver Artifacts (Screenshots, Videos)

Los artifacts se guardan en:
```
tests/e2e/artifacts/
├── screenshots/
├── videos/
└── traces/
```

Para ver un trace:
```bash
npx playwright show-trace tests/e2e/artifacts/traces/trace.zip
```

---

## Debugging de Tests

### Método 1: Playwright Inspector

```bash
# Ejecutar con inspector
npx playwright test --debug

# Ejecutar test específico con inspector
npx playwright test tests/e2e/analyzer.spec.ts:33 --debug
```

**Controles del Inspector:**
- ▶️ Play: Ejecutar siguiente paso
- ⏸️ Pause: Pausar ejecución
- ⏭️ Step Over: Saltar al siguiente paso
- 🔍 Inspect: Inspeccionar elemento

### Método 2: Headed Mode

```bash
# Ver navegador durante ejecución
npx playwright test --headed

# Más lento para ver mejor
npx playwright test --headed --slow-mo=1000
```

### Método 3: Console Logs

En los tests, puedes agregar:
```typescript
test('mi test', async ({ page }) => {
  // Ver logs de consola
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  // Tu test aquí
});
```

### Método 4: Screenshots Manuales

```typescript
test('mi test', async ({ page }) => {
  await page.goto('/analyzer');
  
  // Tomar screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });
  
  // Continuar test
});
```

### Método 5: Pausar Ejecución

```typescript
test('mi test', async ({ page }) => {
  await page.goto('/analyzer');
  
  // Pausar aquí para inspeccionar
  await page.pause();
  
  // Continuar después de inspeccionar
});
```

---

## CI/CD

### GitHub Actions

El proyecto incluye un workflow de CI/CD en `.github/workflows/e2e-tests.yml`

**Trigger automático:**
- Push a `main` o `develop`
- Pull requests
- Manualmente desde GitHub Actions

**Ver resultados:**
1. Ve a tu repositorio en GitHub
2. Click en "Actions"
3. Selecciona el workflow "E2E Tests"
4. Ve los resultados de cada job

### Ejecutar Localmente como CI

```bash
# Simular ambiente de CI
CI=true npm run test:e2e
```

### Configurar Secrets

En GitHub, ve a Settings > Secrets y agrega:
```
FF_USE_MOCK_API=true
NODE_ENV=test
```

---

## Troubleshooting

### Problema 1: Tests E2E Fallan con "Connection Refused"

**Causa**: Servidor no está corriendo

**Solución**:
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar tests
npm run test:e2e
```

### Problema 2: "Mock mode is not active"

**Causa**: Variables de entorno no configuradas

**Solución**:
```bash
# Windows
$env:FF_USE_MOCK_API="true"
$env:NODE_ENV="test"

# Linux/Mac
export FF_USE_MOCK_API=true
export NODE_ENV=test

# Reiniciar servidor
npm run dev
```

### Problema 3: Tests Timeout

**Causa**: Servidor lento o test muy complejo

**Solución**:
```bash
# Aumentar timeout
npx playwright test --timeout=60000

# O en el test:
test('mi test', async ({ page }) => {
  test.setTimeout(60000);
  // ...
});
```

### Problema 4: "Browser not found"

**Causa**: Navegadores de Playwright no instalados

**Solución**:
```bash
npx playwright install
```

### Problema 5: Tests Pasan Localmente pero Fallan en CI

**Causa**: Diferencias de entorno

**Solución**:
```bash
# Ejecutar en modo CI localmente
CI=true npm run test:e2e

# Verificar variables de entorno en CI
# Revisar .github/workflows/e2e-tests.yml
```

### Problema 6: "Port 3000 already in use"

**Causa**: Otro proceso usando el puerto

**Solución**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## Comandos Rápidos de Referencia

### Tests de Integración
```bash
npm test tests/integration                    # Todos
npm test tests/integration/service-factory    # Específico
```

### Tests E2E
```bash
npm run test:e2e                    # Todos
npm run test:e2e:ui                 # Con UI
npx playwright test --debug         # Debug mode
npx playwright test --headed        # Ver navegador
npx playwright test --project=chromium  # Solo Chrome
```

### Reportes
```bash
npx playwright show-report tests/e2e/reports/html  # HTML
npx playwright show-trace <trace-file>             # Trace viewer
```

### Debugging
```bash
npx playwright test --debug                    # Inspector
npx playwright test --headed --slow-mo=1000   # Slow motion
npx playwright test tests/e2e/analyzer.spec.ts:33  # Test específico
```

### Utilidades
```bash
npx playwright codegen http://localhost:3000  # Generar tests
npx playwright install                         # Instalar navegadores
npm run validate:mocks                         # Validar mocks
```

---

## Mejores Prácticas

### 1. Antes de Hacer Commit

```bash
# Ejecutar tests de integración (rápido)
npm test tests/integration

# Si pasan, ejecutar E2E (más lento)
npm run test:e2e
```

### 2. Durante Desarrollo

```bash
# Usar UI mode para desarrollo iterativo
npm run test:e2e:ui

# Ejecutar solo el test en el que trabajas
npx playwright test tests/e2e/analyzer.spec.ts:33 --headed
```

### 3. Para Debugging

```bash
# Usar inspector para ver paso a paso
npx playwright test --debug

# Agregar page.pause() en el código
# Tomar screenshots en puntos clave
```

### 4. En CI/CD

```bash
# Usar modo headless (sin UI)
CI=true npm run test:e2e

# Guardar artifacts para debugging
# Configurar retries para tests flaky
```

---

## Recursos Adicionales

### Documentación
- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
- [Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md)

### Videos y Tutoriales
- [Playwright Tutorial](https://playwright.dev/docs/intro)
- [Debugging Tests](https://playwright.dev/docs/debug)

### Comunidad
- [Playwright Discord](https://discord.gg/playwright)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/playwright)

---

## Conclusión

Ahora sabes cómo:
✅ Ejecutar tests de integración  
✅ Ejecutar tests E2E  
✅ Ver reportes y artifacts  
✅ Debuggear tests  
✅ Resolver problemas comunes  

**Próximos pasos:**
1. Ejecuta los tests siguiendo esta guía
2. Familiarízate con los reportes
3. Practica debugging con tests que fallen
4. Contribuye escribiendo nuevos tests

---

**Última actualización**: 9 de Noviembre, 2025  
**Versión**: 1.0  
**Soporte**: Ver [Troubleshooting](#troubleshooting) o contactar al equipo

# ✅ Checklist de Verificación - Sistema de Mocks

Usa este checklist para verificar que todo el sistema de mocks funciona correctamente.

---

## 📋 Verificación Rápida (5 minutos)

### 1. Variables de Entorno
```powershell
# Windows
$env:FF_USE_MOCK_API="true"
$env:NODE_ENV="test"
echo $env:FF_USE_MOCK_API  # Debe mostrar: true
```

- [ ] Variable `FF_USE_MOCK_API` configurada
- [ ] Variable `NODE_ENV` configurada
- [ ] Variables visibles en terminal

### 2. Servidor Inicia Correctamente
```bash
npm run dev
```

- [ ] Servidor inicia sin errores
- [ ] Muestra "Ready in XXXXms"
- [ ] Accesible en http://localhost:3000

### 3. Mock Status Endpoint
```bash
curl http://localhost:3000/api/test/mock-status
```

- [ ] Responde con `mockMode: true`
- [ ] Sin errores en la respuesta
- [ ] Tiempo de respuesta < 100ms

---

## 🧪 Verificación de Funcionalidades (10 minutos)

### 4. Analyzer
1. Ve a http://localhost:3000/analyzer
2. Ingresa una idea: "Una app para conectar freelancers"
3. Click en "Analyze"

- [ ] Respuesta instantánea (< 1 segundo)
- [ ] Muestra score (ej: 4.1)
- [ ] Muestra summary/viability
- [ ] Muestra SWOT analysis
- [ ] Muestra radar chart
- [ ] Sin errores en consola

### 5. Hackathon
1. Ve a http://localhost:3000/kiroween
2. Describe un proyecto: "Un gestor de tareas con IA"
3. Click en "Analyze Project"

- [ ] Respuesta instantánea (< 1 segundo)
- [ ] Muestra score (ej: 85)
- [ ] Muestra category recommendation
- [ ] Muestra strengths/weaknesses
- [ ] Sin errores en consola

### 6. Frankenstein
1. Ve a http://localhost:3000/doctor-frankenstein
2. Selecciona modo "AWS Services"
3. Click en "Generate Idea"

- [ ] Respuesta instantánea (< 1 segundo)
- [ ] Muestra idea mashup
- [ ] Muestra animación de slot machine
- [ ] Puede regenerar ideas
- [ ] Sin errores en consola

---

## 🔬 Verificación de Tests (15 minutos)

### 7. Tests de Integración
```bash
npm test tests/integration
```

- [ ] 78/78 tests pasan
- [ ] Duración < 5 segundos
- [ ] Sin errores críticos
- [ ] Solo warnings de Supabase (normal)

### 8. Tests E2E - Analyzer
```bash
npx playwright test tests/e2e/analyzer.spec.ts:33
```

- [ ] Test pasa exitosamente
- [ ] Duración < 10 segundos
- [ ] Sin timeouts
- [ ] Screenshot guardado si falla

### 9. Tests E2E - Hackathon
```bash
npx playwright test tests/e2e/hackathon.spec.ts:28
```

- [ ] Test pasa exitosamente
- [ ] Duración < 10 segundos
- [ ] Sin timeouts
- [ ] Screenshot guardado si falla

### 10. Tests E2E - Frankenstein
```bash
npx playwright test tests/e2e/frankenstein.spec.ts:28
```

- [ ] Test pasa exitosamente
- [ ] Duración < 10 segundos
- [ ] Sin timeouts
- [ ] Screenshot guardado si falla

---

## 📊 Verificación de Reportes (5 minutos)

### 11. Reporte HTML
```bash
npx playwright show-report tests/e2e/reports/html
```

- [ ] Reporte se abre en navegador
- [ ] Muestra tests pasados/fallados
- [ ] Muestra screenshots
- [ ] Muestra duración de tests

### 12. Artifacts
```bash
dir tests/e2e/artifacts  # Windows
ls tests/e2e/artifacts   # Linux/Mac
```

- [ ] Carpeta existe
- [ ] Contiene screenshots de tests
- [ ] Contiene error contexts
- [ ] Archivos recientes (fecha actual)

---

## 📚 Verificación de Documentación (5 minutos)

### 13. Documentos Existen
```bash
dir docs  # Windows
ls docs   # Linux/Mac
```

- [ ] `SISTEMA_MOCKS_DOCUMENTACION.md` existe
- [ ] `GUIA_EJECUCION_TESTS.md` existe
- [ ] `README.md` existe
- [ ] Todos son legibles

### 14. Enlaces Funcionan
Abre `docs/README.md` y verifica:

- [ ] Todos los enlaces internos funcionan
- [ ] No hay enlaces rotos
- [ ] Formato correcto (Markdown)

---

## 🔍 Verificación Avanzada (Opcional)

### 15. Mock Data Files
```bash
cat lib/testing/data/analyzer-mocks.json
cat lib/testing/data/hackathon-mocks.json
cat lib/testing/data/frankenstein-mocks.json
```

- [ ] Archivos existen
- [ ] JSON válido
- [ ] Contienen datos de ejemplo

### 16. Mock Services
```bash
cat lib/testing/mocks/MockAIAnalysisService.ts
cat lib/testing/mocks/MockFrankensteinService.ts
```

- [ ] Archivos existen
- [ ] Código compila sin errores
- [ ] Implementan interfaces correctas

### 17. Controllers
```bash
cat src/infrastructure/web/controllers/AnalysisController.ts
cat src/infrastructure/web/controllers/HackathonController.ts
```

- [ ] Tienen método `mockCreateAnalysis` / `mockAnalyzeHackathonProject`
- [ ] Verifican `FF_USE_MOCK_API`
- [ ] Devuelven datos mock correctos

---

## 🎯 Verificación de Rendimiento

### 18. Tiempo de Respuesta
Con el servidor corriendo, mide tiempos:

```bash
# Analyzer
time curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"idea":"test","locale":"en"}'
```

- [ ] Respuesta < 100ms
- [ ] Sin errores
- [ ] JSON válido

### 19. Uso de Memoria
Observa el servidor mientras ejecutas tests:

- [ ] Memoria estable (no crece indefinidamente)
- [ ] CPU < 50% durante tests
- [ ] Sin memory leaks

---

## 🚨 Verificación de Errores Comunes

### 20. Sin Llamadas a API Externa
Con el servidor corriendo, verifica logs:

- [ ] No aparece "Calling Gemini API"
- [ ] No aparece "API request to Google"
- [ ] Solo logs de mock mode

### 21. Sin Costos
Verifica tu cuenta de Google Cloud:

- [ ] No hay nuevas llamadas a Gemini API
- [ ] Costos no aumentan
- [ ] Quota no se consume

---

## ✅ Resultado Final

### Todos los Checks Pasaron ✅

Si todos los checks están marcados:

🎉 **¡Felicidades! El sistema de mocks funciona perfectamente.**

Puedes:
- ✅ Desarrollar sin costos
- ✅ Ejecutar tests confiables
- ✅ Trabajar offline
- ✅ Debuggear fácilmente

### Algunos Checks Fallaron ❌

Si algunos checks fallaron:

1. **Revisa Troubleshooting**:
   - [Sistema de Mocks - Troubleshooting](docs/SISTEMA_MOCKS_DOCUMENTACION.md#troubleshooting)
   - [Guía de Tests - Troubleshooting](docs/GUIA_EJECUCION_TESTS.md#troubleshooting)

2. **Verifica Configuración**:
   - Variables de entorno correctas
   - Servidor corriendo
   - Dependencias instaladas

3. **Pide Ayuda**:
   - Crea un issue en GitHub
   - Contacta al equipo
   - Revisa documentación

---

## 📝 Notas

### Checks Opcionales

Los checks marcados como "Opcional" no son críticos pero son recomendados para verificación completa.

### Checks que Pueden Fallar

Algunos checks pueden fallar sin ser críticos:

- **Tests E2E**: 18/36 pasan es normal (los otros son edge cases)
- **Warnings de Supabase**: Son normales en tests
- **Algunos artifacts**: Pueden no existir si no has ejecutado tests

### Frecuencia de Verificación

- **Diaria**: Checks 1-6 (funcionalidades básicas)
- **Semanal**: Checks 7-12 (tests y reportes)
- **Mensual**: Checks 13-21 (verificación completa)

---

## 🔄 Actualizar Checklist

Si encuentras nuevos checks que deberían agregarse:

1. Edita este archivo
2. Agrega el nuevo check
3. Documenta qué verifica
4. Actualiza la fecha

---

**Última actualización**: 9 de Noviembre, 2025  
**Versión**: 1.0  
**Checks totales**: 21  
**Tiempo estimado**: 40 minutos (completo)

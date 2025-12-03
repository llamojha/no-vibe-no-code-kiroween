# Documentación del Proyecto

Bienvenido a la documentación completa de No Vibe No Code. Aquí encontrarás toda la información necesaria para desarrollar, probar y mantener el proyecto.

## 📚 Índice General

### 🏗️ Arquitectura y Desarrollo

1. **[Architecture Overview](./ARCHITECTURE.md)**

   - Visión general de la arquitectura hexagonal
   - Capas del sistema
   - Patrones de diseño

2. **[Developer Guide](./DEVELOPER_GUIDE.md)**

   - Guía paso a paso para agregar features
   - Mejores prácticas
   - Ejemplos de código

3. **[API Documentation](./API.md)**
   - Referencia completa de APIs
   - Endpoints disponibles
   - Ejemplos de uso

### 📄 Features y Funcionalidades

4. **[Document Generation Feature Guide](./DOCUMENT_GENERATION_GUIDE.md)** ⭐ NUEVO

   - **¿Qué es?** Generación de documentación profesional con IA
   - **¿Por qué?** Transforma ideas en documentación ejecutable
   - **¿Cómo?** PRDs, Diseño Técnico, Arquitectura, Roadmaps
   - **Incluye:**
     - Guía de usuario completa
     - Workflow recomendado
     - Gestión de versiones
     - Exportación de documentos
     - Troubleshooting

5. **[Document Generation Developer Guide](./DOCUMENT_GENERATION_DEVELOPER_GUIDE.md)** ⭐ NUEVO
   - **Arquitectura** del sistema de generación
   - **Configuración** de tipos de documentos
   - **Plantillas de IA** y prompts
   - **Integración** con sistema de créditos
   - **Cómo agregar** nuevos tipos de documentos
   - **Testing** y mejores prácticas

### 🧪 Testing y Mocks

6. **[Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md)** ⭐ NUEVO

   - **¿Qué es?** Sistema para desarrollar sin gastar créditos de API
   - **¿Por qué?** Ahorra $150-300/mes en desarrollo
   - **¿Cómo?** Respuestas instantáneas desde archivos JSON
   - **Incluye:**
     - Arquitectura completa del sistema
     - Componentes implementados
     - Flujo de peticiones
     - Guía de uso
     - Troubleshooting

7. **[Guía de Ejecución de Tests](./GUIA_EJECUCION_TESTS.md)** ⭐ NUEVO
   - **Paso a paso** para ejecutar todos los tests
   - **Tests de Integración** con Vitest
   - **Tests E2E** con Playwright
   - **Debugging** de tests
   - **CI/CD** configuración
   - **Troubleshooting** común

### 📖 Documentación por Capa

8. **[Domain Layer](../src/domain/README.md)**

   - Entidades y value objects
   - Servicios de dominio
   - Reglas de negocio

9. **[Application Layer](../src/application/README.md)**

   - Use cases
   - Handlers
   - DTOs

10. **[Infrastructure Layer](../src/infrastructure/README.md)**
    - Adaptadores externos
    - Configuración
    - Factories

### 📋 Estándares y Guías

11. **[Hexagonal Architecture Standards](../.kiro/steering/hexagonal-architecture-standards.md)**

    - Estándares de arquitectura
    - Patrones obligatorios
    - Ejemplos de implementación

12. **[Testing Documentation](../tests/README.md)**

    - Documentación general de testing
    - Estructura de tests
    - Convenciones

13. **[Mock Mode Guide](../tests/MOCK_MODE_GUIDE.md)**
    - Guía técnica del modo mock
    - Configuración avanzada
    - API reference

---

## 🚀 Quick Start

### Para Desarrolladores Nuevos

1. **Leer primero:**

   - [Architecture Overview](./ARCHITECTURE.md) - Entender la estructura
   - [Developer Guide](./DEVELOPER_GUIDE.md) - Cómo agregar features
   - [Document Generation Developer Guide](./DOCUMENT_GENERATION_DEVELOPER_GUIDE.md) - Sistema de generación de documentos

2. **Configurar entorno:**

   - [Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md) - Desarrollo sin costos
   - [Guía de Tests](./GUIA_EJECUCION_TESTS.md) - Ejecutar tests

3. **Empezar a desarrollar:**

   ```bash
   # Activar modo mock
   $env:FF_USE_MOCK_API="true"
   $env:NODE_ENV="test"

   # Iniciar servidor
   npm run dev

   # Ejecutar tests
   npm run test:e2e
   ```

### Para Testing

1. **Tests de Integración:**

   ```bash
   npm test tests/integration
   ```

2. **Tests E2E:**

   ```bash
   npm run test:e2e
   ```

3. **Ver reportes:**
   ```bash
   npx playwright show-report tests/e2e/reports/html
   ```

Ver [Guía de Ejecución de Tests](./GUIA_EJECUCION_TESTS.md) para más detalles.

---

## 📊 Documentos por Tema

### Desarrollo Local

- ✅ [Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md) - Desarrollo sin API costs
- ✅ [Developer Guide](./DEVELOPER_GUIDE.md) - Agregar features
- ✅ [Architecture Overview](./ARCHITECTURE.md) - Entender estructura

### Testing

- ✅ [Guía de Ejecución de Tests](./GUIA_EJECUCION_TESTS.md) - Ejecutar tests
- ✅ [Mock Mode Guide](../tests/MOCK_MODE_GUIDE.md) - Configuración avanzada
- ✅ [Testing README](../tests/README.md) - Documentación general

### APIs

- ✅ [API Documentation](./API.md) - Referencia completa
- ✅ [Infrastructure Layer](../src/infrastructure/README.md) - Implementación

### Features

- ✅ [Document Generation Feature Guide](./DOCUMENT_GENERATION_GUIDE.md) - Guía de usuario
- ✅ [Document Generation Developer Guide](./DOCUMENT_GENERATION_DEVELOPER_GUIDE.md) - Guía de desarrollo

### Arquitectura

- ✅ [Architecture Overview](./ARCHITECTURE.md) - Visión general
- ✅ [Hexagonal Architecture Standards](../.kiro/steering/hexagonal-architecture-standards.md) - Estándares
- ✅ [Domain Layer](../src/domain/README.md) - Capa de dominio
- ✅ [Application Layer](../src/application/README.md) - Capa de aplicación

---

## 🎯 Casos de Uso Comunes

### "Quiero desarrollar sin gastar en APIs"

1. Lee: [Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md)
2. Configura variables de entorno
3. Inicia servidor en modo mock
4. ¡Desarrolla sin costos!

### "Quiero ejecutar los tests"

1. Lee: [Guía de Ejecución de Tests](./GUIA_EJECUCION_TESTS.md)
2. Configura entorno de test
3. Ejecuta tests de integración
4. Ejecuta tests E2E
5. Revisa reportes

### "Quiero agregar una nueva feature"

1. Lee: [Developer Guide](./DEVELOPER_GUIDE.md)
2. Lee: [Hexagonal Architecture Standards](../.kiro/steering/hexagonal-architecture-standards.md)
3. Implementa siguiendo los patrones
4. Escribe tests
5. Documenta cambios

### "Quiero agregar un nuevo tipo de documento"

1. Lee: [Document Generation Developer Guide](./DOCUMENT_GENERATION_DEVELOPER_GUIDE.md)
2. Sigue la sección "Adding a New Document Type"
3. Actualiza schema de base de datos
4. Crea plantilla de IA
5. Agrega configuración
6. Crea página de generación
7. Escribe tests

### "Quiero usar la generación de documentos"

1. Lee: [Document Generation Feature Guide](./DOCUMENT_GENERATION_GUIDE.md)
2. Navega al Idea Panel
3. Genera documentos (PRD, Technical Design, etc.)
4. Edita y gestiona versiones
5. Exporta a Markdown o PDF

### "Quiero entender la arquitectura"

1. Lee: [Architecture Overview](./ARCHITECTURE.md)
2. Lee: [Domain Layer](../src/domain/README.md)
3. Lee: [Application Layer](../src/application/README.md)
4. Lee: [Infrastructure Layer](../src/infrastructure/README.md)
5. Revisa ejemplos de código

---

## 🔍 Búsqueda Rápida

### Por Tecnología

- **Next.js**: [Architecture Overview](./ARCHITECTURE.md), [API Documentation](./API.md)
- **Playwright**: [Guía de Tests](./GUIA_EJECUCION_TESTS.md), [Testing README](../tests/README.md)
- **Vitest**: [Guía de Tests](./GUIA_EJECUCION_TESTS.md)
- **Supabase**: [Infrastructure Layer](../src/infrastructure/README.md)
- **TypeScript**: [Developer Guide](./DEVELOPER_GUIDE.md)

### Por Funcionalidad

- **Analyzer**: [API Documentation](./API.md), [Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md)
- **Hackathon**: [API Documentation](./API.md), [Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md)
- **Frankenstein**: [API Documentation](./API.md), [Sistema de Mocks](./SISTEMA_MOCKS_DOCUMENTACION.md)
- **Dashboard**: [Application Layer](../src/application/README.md)

### Por Problema

- **Tests fallan**: [Guía de Tests - Troubleshooting](./GUIA_EJECUCION_TESTS.md#troubleshooting)
- **Mock no funciona**: [Sistema de Mocks - Troubleshooting](./SISTEMA_MOCKS_DOCUMENTACION.md#troubleshooting)
- **Error de arquitectura**: [Hexagonal Architecture Standards](../.kiro/steering/hexagonal-architecture-standards.md)
- **API no responde**: [API Documentation](./API.md)

---

## 📝 Contribuir a la Documentación

Si encuentras algo que falta o necesita mejora:

1. Crea un issue describiendo el problema
2. O mejor, crea un PR con la mejora
3. Sigue el formato de los documentos existentes
4. Actualiza este índice si agregas nuevos documentos

---

## 🆘 Soporte

Si no encuentras lo que buscas:

1. Revisa el [Troubleshooting](./GUIA_EJECUCION_TESTS.md#troubleshooting)
2. Busca en los issues de GitHub
3. Pregunta al equipo en Slack/Discord
4. Crea un nuevo issue con tu pregunta

---

## 📅 Última Actualización

**Fecha**: 25 de Noviembre, 2025
**Versión**: 1.1
**Documentos Nuevos**: Document Generation Feature Guide, Document Generation Developer Guide

---

**¡Feliz desarrollo! 🚀**

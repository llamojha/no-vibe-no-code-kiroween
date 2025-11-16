# Plan de Funcionalidad del Panel de Ideas

## 🎯 Resumen

Transformar los análisis guardados en un sistema interactivo de gestión de ideas con un "Panel de Ideas" que permite la generación de documentos y flujos de trabajo para el inicio de proyectos.

---

## Fase 1: Fundamentos del Panel de Ideas

### 1.1 Tarjeta de Análisis Mejorada con Acción "Abrir Panel"

- Agregar nuevo botón "Gestionar" a `AnalysisCard` que abre el Panel de Ideas
- Crear indicador visual del estado de preparación del análisis (borrador → validado → documentado → listo)
- Agregar insignias de estado mostrando la finalización de PRD, documento de diseño, roadmap

### 1.2 Ruta y Diseño del Panel de Ideas

```
/idea-panel/[analysisId]
```

- Panel de pantalla completa con navegación lateral
- Secciones: Resumen, Documentos, Acciones
- Navegación de migas de pan de regreso al dashboard
- Seguimiento de estado en tiempo real

### 1.3 Extensiones del Modelo de Datos

Agregar a la tabla `saved_analyses`:

```sql
- documents_generated: jsonb { prd: boolean, design: boolean, roadmap: boolean, architecture: boolean }
- project_status: enum (idea, documented, ready)
- metadata: jsonb (información adicional del proyecto)
```

---

## Fase 2: Sistema de Generación de Documentos

### 2.1 Tipos de Documentos

Implementar generación asistida por IA para:

1. **PRD (Documento de Requisitos del Producto)**

   - Declaración del problema
   - Personas de usuario
   - Características y requisitos
   - Métricas de éxito
   - Fuera de alcance

2. **Documento de Diseño Técnico**

   - Resumen de arquitectura
   - Decisiones de stack tecnológico
   - Modelos de datos
   - Especificaciones de API
   - Consideraciones de seguridad
   - Estrategia de despliegue

3. **Roadmap (Hoja de Ruta)**

   - Hitos con cronogramas
   - Priorización de características
   - Dependencias
   - Asignación de recursos
   - Mitigación de riesgos

4. **Documento de Arquitectura**
   - Diagrama de arquitectura del sistema
   - Desglose de componentes
   - Puntos de integración
   - Consideraciones de escalabilidad

### 2.2 UI de Generación de Documentos

```typescript
// features/idea-panel/components/DocumentGenerator.tsx
- Selector de tipo de documento
- Vista previa de plantilla
- Botón "Generar" con asistencia de IA
- Edición en vivo con soporte de markdown
- Historial de versiones
- Opciones de exportación (MD, PDF)
```

### 2.3 Casos de Uso de Documentos

```typescript
// src/application/use-cases/documents/
-GeneratePRDUseCase -
  GenerateDesignDocUseCase -
  GenerateRoadmapUseCase -
  GenerateArchitectureDocUseCase -
  SaveDocumentUseCase -
  ExportDocumentUseCase;
```

---

## Fase 3: Dashboard del Panel de Ideas

### 3.1 Secciones del Panel

**Sección de Resumen:**

- Resumen del análisis con puntuación
- Indicador de estado actual
- Estadísticas rápidas (documentos generados, % de finalización)
- Próxima acción recomendada

**Sección de Documentos:**

- Tarjetas de documentos con estado de generación
- Vista previa rápida
- Opciones de editar/regenerar
- Botones de exportación
- Historial de versiones

**Sección de Acciones:**

- Opciones de exportación
- Compartir análisis
- Archivar/eliminar
- Clonar para nueva iteración

### 3.2 Estados del Flujo de Trabajo

```typescript
// Progresión del flujo de trabajo:
1. Nueva Idea → Generar Documentos
2. Documentado → Revisar y Editar
3. Listo → Exportar y Ejecutar
4. Completado → Archivar y Aprender
```

---

## Fase 4: Mejoras de UI/UX

### 4.1 Diseño Visual

- Indicador de progreso mostrando % de finalización
- Línea de tiempo de estado mostrando el recorrido
- Recomendaciones de acciones basadas en el estado actual
- Animaciones de celebración en hitos

### 4.2 Accesibilidad

- Navegación por teclado
- Soporte para lectores de pantalla
- Gestión de foco
- Etiquetas ARIA

### 4.3 Responsividad Móvil

- Barra lateral colapsable en móvil
- Botones táctiles amigables
- Editor de documentos responsivo

---

## Arquitectura Técnica

### Capa de Dominio

```typescript
// src/domain/entities/
- IdeaPanel.ts (raíz agregada)
- Document.ts

// src/domain/value-objects/
- DocumentType.ts
- ProjectStatus.ts
```

### Capa de Aplicación

```typescript
// src/application/use-cases/idea-panel/
-OpenIdeaPanelUseCase.ts -
  UpdatePanelStatusUseCase.ts -
  GetPanelOverviewUseCase.ts;
```

### Capa de Infraestructura

```typescript
// src/infrastructure/external/ai/
-DocumentGeneratorAdapter.ts;
```

---

## Actualizaciones del Esquema de Base de Datos

```sql
-- Nueva tabla para documentos generados
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES saved_analyses(id),
  document_type TEXT NOT NULL,
  content TEXT,
  version INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar índices
CREATE INDEX idx_generated_documents_analysis_id ON generated_documents(analysis_id);
CREATE INDEX idx_generated_documents_type ON generated_documents(document_type);
```

---

## Feature Flags

```typescript
// lib/featureFlags.config.ts
ENABLE_IDEA_PANEL: boolean;
ENABLE_DOCUMENT_GENERATION: boolean;
```

---

## Métricas de Éxito

1. **Compromiso**: % de análisis que abren el Panel de Ideas
2. **Documentación**: % de ideas con documentos completos (PRD + Diseño + Roadmap)
3. **Tiempo hasta Documentación**: Tiempo promedio desde idea → documentación completa
4. **Tasa de Exportación**: % de ideas documentadas que se exportan
5. **Finalización**: % de ideas que alcanzan el estado "Listo"

---

## Ideas Futuras

### Sistema de Validación (Mejora Futura)

Validadores potenciales a considerar:

1. **Validador de Mercado** - Analizar tamaño de mercado, competencia, timing
2. **Validador de Viabilidad Técnica** - Viabilidad del stack tecnológico, evaluación de complejidad
3. **Validador de Modelo de Negocio** - Potencial de ingresos, estructura de costos, economía unitaria
4. **Validador de Ajuste de Equipo** - Habilidades requeridas, brechas del equipo, necesidades de contratación
5. **Validador de Riesgos** - Riesgos técnicos, riesgos de mercado, riesgos de ejecución
6. **Validador de Alcance MVP** - Priorización de características, definición de alcance

### Integración con GitHub (Mejora Futura)

- Crear repositorio desde plantilla
- Generar tablero de proyecto con hitos
- Crear issues desde tareas del roadmap
- Vincular PRD y documentos de diseño al proyecto
- Configurar etiquetas y flujos de trabajo

### Integraciones Adicionales (Mejora Futura)

- Integración con Jira
- Exportación a Notion
- Exportación a Confluence
- Integración con Linear
- Notificaciones de Slack

---

## Prioridad de Implementación

1. **Fase 1**: Fundamentos - Ruta del panel, diseño, modelo de datos
2. **Fase 2**: Generación de documentos - PRD, Documento de Diseño, Roadmap
3. **Fase 3**: Dashboard - Resumen, seguimiento de estado, acciones
4. **Fase 4**: Pulido - Mejoras de UI/UX, accesibilidad, móvil

---

## Notas

- Toda la generación de documentos usa asistencia de IA con revisión/edición humana
- Documentos almacenados en base de datos con historial de versiones
- Formatos de exportación: Markdown (primario), PDF (secundario)
- Mantener principios de arquitectura hexagonal durante toda la implementación
- Seguir patrones existentes de las funcionalidades del analizador
- Asegurar integración del sistema de créditos para la generación de documentos

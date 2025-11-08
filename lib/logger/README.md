# Sistema de Logging Profesional

Sistema completo de logging con categorización, niveles de severidad y captura automática.

## 📁 Estructura de Archivos de Log

Los logs se guardan en el directorio `logs/` con la siguiente estructura:

```
logs/
├── all.log              # Todos los logs
├── errors.log           # Solo errores
├── warnings.log         # Solo warnings
├── api.log             # Logs de API
├── database.log        # Logs de base de datos
├── ai.log              # Logs de IA
├── auth.log            # Logs de autenticación
├── ui.log              # Logs de interfaz
├── validation.log      # Logs de validación
├── business.log        # Logs de lógica de negocio
├── infrastructure.log  # Logs de infraestructura
└── general.log         # Logs generales
```

## 🚀 Uso Básico

### Importar el Logger

```typescript
import { logger, LogCategory } from '@/lib/logger';
```

### Logging Manual (Recomendado)

```typescript
// Error
logger.error(LogCategory.API, 'Failed to fetch data', { 
  endpoint: '/api/users',
  statusCode: 500 
});

// Warning
logger.warn(LogCategory.DATABASE, 'Slow query detected', { 
  query: 'SELECT * FROM large_table',
  duration: 5000 
});

// Info
logger.info(LogCategory.AUTH, 'User logged in', { 
  userId: '123',
  timestamp: new Date() 
});

// Debug
logger.debug(LogCategory.UI, 'Component rendered', { 
  component: 'UserProfile',
  props: { userId: '123' } 
});
```

### Logging con Errores

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error(LogCategory.BUSINESS, 'Operation failed', error);
}
```

## 📊 Categorías Disponibles

```typescript
enum LogCategory {
  API = 'API',                           // Peticiones HTTP, endpoints
  DATABASE = 'DATABASE',                 // Queries, conexiones
  AI = 'AI',                            // Servicios de IA (Gemini, etc.)
  AUTH = 'AUTH',                        // Autenticación, autorización
  UI = 'UI',                            // Componentes React, renders
  VALIDATION = 'VALIDATION',            // Validaciones de datos
  BUSINESS = 'BUSINESS',                // Lógica de negocio
  INFRASTRUCTURE = 'INFRASTRUCTURE',    // Servicios externos, config
  GENERAL = 'GENERAL',                  // Otros logs
}
```

## 🎯 Niveles de Severidad

```typescript
enum LogLevel {
  DEBUG = 'DEBUG',   // Información detallada para debugging
  INFO = 'INFO',     // Información general
  WARN = 'WARN',     // Advertencias que no son errores
  ERROR = 'ERROR',   // Errores que requieren atención
}
```

## ⚙️ Captura Automática

El logger intercepta automáticamente:
- `console.error()` → LogLevel.ERROR, LogCategory.GENERAL
- `console.warn()` → LogLevel.WARN, LogCategory.GENERAL
- `console.info()` → LogLevel.INFO, LogCategory.GENERAL
- `console.log()` → LogLevel.DEBUG, LogCategory.GENERAL

**Nota:** Para mejor categorización, usa el logger directamente en lugar de console.

## 📝 Formato de Log

```
[2025-11-07T20:00:00.000Z] [ERROR] [API] Failed to fetch data
Data: {
  "endpoint": "/api/users",
  "statusCode": 500
}
Stack: Error: Failed to fetch data
    at fetchUsers (api.ts:45:11)
    ...
================================================================================
```

## 🔧 Ejemplos por Capa de Arquitectura

### Domain Layer

```typescript
import { logger, LogCategory } from '@/lib/logger';

export class AnalysisValidationService {
  validate(analysis: Analysis): ValidationResult {
    logger.debug(LogCategory.VALIDATION, 'Validating analysis', {
      analysisId: analysis.id.value,
      ideaLength: analysis.idea.length
    });

    if (analysis.idea.length < 10) {
      logger.warn(LogCategory.VALIDATION, 'Idea too short', {
        analysisId: analysis.id.value,
        length: analysis.idea.length
      });
    }

    return result;
  }
}
```

### Application Layer

```typescript
import { logger, LogCategory } from '@/lib/logger';

export class AnalyzeIdeaUseCase {
  async execute(command: AnalyzeIdeaCommand): Promise<Result<Analysis>> {
    logger.info(LogCategory.BUSINESS, 'Starting idea analysis', {
      userId: command.userId,
      ideaLength: command.idea.length
    });

    try {
      const result = await this.aiService.analyze(command.idea);
      
      logger.info(LogCategory.BUSINESS, 'Analysis completed', {
        score: result.score,
        duration: Date.now() - startTime
      });

      return success(result);
    } catch (error) {
      logger.error(LogCategory.BUSINESS, 'Analysis failed', error);
      return failure(error);
    }
  }
}
```

### Infrastructure Layer - Database

```typescript
import { logger, LogCategory } from '@/lib/logger';

export class SupabaseAnalysisRepository {
  async save(analysis: Analysis): Promise<Result<Analysis>> {
    logger.debug(LogCategory.DATABASE, 'Saving analysis', {
      analysisId: analysis.id.value
    });

    try {
      const { data, error } = await this.client
        .from('analyses')
        .insert(dao);

      if (error) {
        logger.error(LogCategory.DATABASE, 'Failed to save analysis', {
          error: error.message,
          code: error.code
        });
        return failure(new DatabaseError(error.message));
      }

      logger.info(LogCategory.DATABASE, 'Analysis saved successfully', {
        analysisId: data.id
      });

      return success(this.mapper.toDomain(data));
    } catch (error) {
      logger.error(LogCategory.DATABASE, 'Unexpected database error', error);
      return failure(error);
    }
  }
}
```

### Infrastructure Layer - External Services

```typescript
import { logger, LogCategory } from '@/lib/logger';

export class GoogleAIAdapter {
  async analyzeIdea(idea: string): Promise<Result<AnalysisResult>> {
    logger.info(LogCategory.AI, 'Calling Gemini API', {
      ideaLength: idea.length,
      model: 'gemini-pro'
    });

    const startTime = Date.now();

    try {
      const result = await this.client.generateContent(prompt);
      const duration = Date.now() - startTime;

      if (duration > 3000) {
        logger.warn(LogCategory.AI, 'Slow AI response', {
          duration,
          model: 'gemini-pro'
        });
      }

      logger.info(LogCategory.AI, 'AI analysis completed', {
        duration,
        tokensUsed: result.usage?.totalTokens
      });

      return success(result);
    } catch (error) {
      logger.error(LogCategory.AI, 'AI service error', error);
      return failure(error);
    }
  }
}
```

### Web Layer - API Routes

```typescript
import { logger, LogCategory } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.info(LogCategory.API, 'POST /api/analyze', {
    method: 'POST',
    path: '/api/analyze'
  });

  try {
    const body = await request.json();
    
    logger.debug(LogCategory.API, 'Request body parsed', {
      ideaLength: body.idea?.length
    });

    const result = await analyzeIdea(body);

    logger.info(LogCategory.API, 'Request completed successfully', {
      statusCode: 200,
      duration: Date.now() - startTime
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error(LogCategory.API, 'Request failed', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Web Layer - React Components

```typescript
'use client';

import { logger, LogCategory } from '@/lib/logger';

export function AnalysisDisplay({ analysis }: Props) {
  useEffect(() => {
    logger.debug(LogCategory.UI, 'AnalysisDisplay mounted', {
      analysisId: analysis.id
    });
  }, []);

  const handleExport = () => {
    try {
      logger.info(LogCategory.UI, 'Exporting analysis', {
        analysisId: analysis.id,
        format: 'PDF'
      });

      exportToPDF(analysis);

      logger.info(LogCategory.UI, 'Export completed');
    } catch (error) {
      logger.error(LogCategory.UI, 'Export failed', error);
      showErrorToast('Failed to export');
    }
  };

  return <div>...</div>;
}
```

## 🧪 Testing

Endpoint de prueba:
```
GET http://localhost:3000/api/dev/test-new-logger
```

Esto generará logs de ejemplo en todas las categorías.

## 📊 Análisis de Logs

### Ver todos los errores
```bash
cat logs/errors.log
```

### Ver logs de una categoría específica
```bash
cat logs/api.log
cat logs/database.log
```

### Buscar logs por palabra clave
```bash
grep "Failed" logs/all.log
grep "slow" logs/warnings.log
```

### Ver últimas 50 líneas
```bash
tail -n 50 logs/all.log
```

## ⚠️ Notas Importantes

1. **Solo en Desarrollo**: El logger solo funciona en `NODE_ENV=development`
2. **Logs se limpian**: Los archivos se limpian en cada reinicio del servidor
3. **No para Producción**: Este es un sistema temporal para desarrollo
4. **Reemplazo Futuro**: Antes de producción, usar Winston, Pino o servicio cloud

## 🔄 Migración desde dev-logger.ts

Si estabas usando el logger anterior:

```typescript
// Antes
import { logError, logWarning } from '@/lib/dev-logger';
logError('Something failed', error);
logWarning('This is slow');

// Ahora
import { logger, LogCategory } from '@/lib/logger';
logger.error(LogCategory.GENERAL, 'Something failed', error);
logger.warn(LogCategory.GENERAL, 'This is slow');
```

## 🎯 Best Practices

1. **Usa categorías apropiadas** - Facilita el análisis posterior
2. **Incluye contexto relevante** - userId, ids, durations, etc.
3. **No logues datos sensibles** - Passwords, tokens, PII
4. **Usa niveles correctos**:
   - DEBUG: Información detallada para debugging
   - INFO: Eventos importantes del flujo normal
   - WARN: Situaciones anormales pero manejables
   - ERROR: Errores que requieren atención
5. **Logea en puntos clave**:
   - Inicio/fin de operaciones importantes
   - Errores y excepciones
   - Operaciones lentas o costosas
   - Cambios de estado importantes

## 📚 Recursos

- Código fuente: `lib/logger/`
- Tipos: `lib/logger/types.ts`
- Logger principal: `lib/logger/Logger.ts`
- Endpoint de prueba: `app/api/dev/test-new-logger/route.ts`

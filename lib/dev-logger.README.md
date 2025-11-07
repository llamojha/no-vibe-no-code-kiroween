# Development Logger

Sistema simple de logging para desarrollo que guarda errores y warnings en archivos.

## 📁 Ubicación de Logs

Los logs se guardan en el directorio `logs/` en la raíz del proyecto:
- `logs/errors.log` - Todos los errores
- `logs/warnings.log` - Todos los warnings

## 🚀 Uso

### Importar las funciones

```typescript
import { logError, logWarning } from '@/lib/dev-logger';
```

### Registrar errores

```typescript
// Error simple
logError('Something went wrong');

// Error con objeto
logError('Database error:', error);

// Error con múltiples argumentos
logError('Failed to process', { userId: '123', action: 'update' });
```

### Registrar warnings

```typescript
// Warning simple
logWarning('This feature is deprecated');

// Warning con contexto
logWarning('Slow query detected', { duration: 5000, query: 'SELECT *' });
```

## ⚙️ Características

- ✅ Solo funciona en modo desarrollo (`NODE_ENV=development`)
- ✅ Los logs se guardan automáticamente en archivos
- ✅ También imprime en consola (comportamiento normal)
- ✅ Formato con timestamp y separadores
- ✅ Maneja objetos, errores y strings
- ✅ Los archivos se limpian en cada reinicio del servidor

## 📝 Formato de Log

```
[2025-11-07T19:24:23.623Z] [ERROR] Test error message
================================================================================
```

## 🧪 Probar el Logger

Puedes probar el logger visitando:
```
http://localhost:3000/api/dev/test-logger
```

## ⚠️ Nota Importante

Este es un sistema temporal para desarrollo. Antes de producción, debe ser reemplazado con una solución de logging profesional como:
- Winston
- Pino
- Bunyan
- O un servicio de logging en la nube

## 🔧 Configuración

El logger se inicializa automáticamente en el bootstrap de la aplicación.
No requiere configuración adicional.

## 📂 Archivos Relacionados

- `lib/dev-logger.ts` - Implementación del logger
- `logs/` - Directorio de logs (ignorado por git)
- `app/api/dev/test-logger/route.ts` - Endpoint de prueba

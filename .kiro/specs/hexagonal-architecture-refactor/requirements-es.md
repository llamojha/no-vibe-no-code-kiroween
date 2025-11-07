# Documento de Requisitos

## Introducción

Esta especificación define los requisitos para refactorizar la aplicación No Vibe No Code desde su arquitectura actual basada en características hacia una arquitectura hexagonal (patrón Puertos y Adaptadores). El refactor tiene como objetivo mejorar la mantenibilidad, testabilidad y separación de responsabilidades implementando límites claros entre la lógica de negocio, servicios de aplicación y preocupaciones de infraestructura.

## Glosario

- **Arquitectura_Hexagonal**: Un patrón arquitectónico que aísla la lógica de negocio central de las preocupaciones externas mediante el uso de puertos y adaptadores
- **Capa_Dominio**: La capa más interna que contiene entidades de negocio, objetos de valor y servicios de dominio con lógica de negocio pura
- **Capa_Aplicación**: La capa que contiene casos de uso, servicios de aplicación y lógica de orquestación que coordina operaciones del dominio
- **Capa_Infraestructura**: La capa más externa que contiene adaptadores externos como bases de datos, frameworks web y servicios de terceros
- **Puerto**: Una interfaz que define cómo el núcleo de la aplicación se comunica con el mundo exterior
- **Adaptador**: Una implementación concreta de un puerto que maneja la integración con sistemas externos
- **Patrón_Repositorio**: Interfaces TypeScript que abstraen las operaciones de acceso a datos de la lógica de dominio
- **Manejador_Comando**: Funciones que manejan operaciones de escritura (crear, actualizar, eliminar) con validación de negocio
- **Manejador_Consulta**: Funciones que manejan operaciones de lectura optimizadas para recuperación de datos sin restricciones de negocio
- **Objeto_Valor**: Un objeto inmutable que representa un concepto en el dominio sin identidad
- **Entidad**: Un objeto de dominio con una identidad única que persiste en el tiempo
- **Caso_Uso**: Una operación o flujo de trabajo de negocio específico que la aplicación puede realizar
- **ID_Entidad**: Un identificador fuertemente tipado encapsulado dentro de entidades como objetos de valor (ej. PersonId, AnalysisId)
- **DTO**: Objeto de Transferencia de Datos usado para operaciones de entrada/salida en límites de API
- **DAO**: Objeto de Acceso a Datos que representa la estructura específica de base de datos para persistencia
- **Mapeador**: Un componente responsable de convertir entre entidades de dominio, DTOs y DAOs
- **Modelo_Documento**: Representación específica de base de datos para bases de datos de documentos (ej. MongoDB con esquemas Mongoose)
- **Modelo_Supabase**: Representación específica de base de datos para Supabase/PostgreSQL usando tipos del cliente Supabase
- **Ruta_API_Next**: Manejadores de rutas API de Next.js que sirven como adaptadores web en la capa de infraestructura
- **Acción_Servidor**: Acciones de servidor de Next.js que proporcionan funcionalidad directa del lado del servidor
- **Componente_Servidor_React**: Componentes React del lado del servidor que pueden acceder directamente a servicios de aplicación
- **Esquema_Zod**: Biblioteca de validación de esquemas TypeScript-first usada para verificación de tipos en tiempo de ejecución y validación
- **Composición_Servicios**: Patrón de combinar servicios a través de composición de funciones e importaciones de módulos en lugar de inyección de dependencias tradicional

## Requisitos

### Requisito 1

**Historia de Usuario:** Como desarrollador, quiero que la aplicación tenga una separación clara entre la lógica de negocio y las dependencias externas, para poder probar y mantener fácilmente la funcionalidad central sin estar acoplado a frameworks o servicios específicos.

#### Criterios de Aceptación

1. LA Arquitectura_Hexagonal DEBERÁ aislar toda la lógica de negocio en la Capa_Dominio sin dependencias de Next.js, React o frameworks externos
2. LA Capa_Aplicación DEBERÁ orquestar operaciones de negocio a través de interfaces Caso_Uso bien definidas usando interfaces TypeScript
3. LA Capa_Infraestructura DEBERÁ implementar todas las integraciones de sistemas externos (Supabase, Google AI, etc.) a través de interfaces Puerto
4. LA Capa_Dominio DEBERÁ contener solo código TypeScript puro con definiciones de tipos estrictas y sin importaciones de framework
5. CUANDO las dependencias externas cambien, LA Arquitectura_Hexagonal DEBERÁ requerir modificaciones solo en los adaptadores de la Capa_Infraestructura

### Requisito 2

**Historia de Usuario:** Como desarrollador, quiero una estructura de directorios clara que refleje los principios de la arquitectura hexagonal, para poder localizar y entender rápidamente el propósito de cada componente.

#### Criterios de Aceptación

1. LA Arquitectura_Hexagonal DEBERÁ organizar el código en capas distintas: app, domain, infrastructure y utilidades compartidas
2. LA Capa_Dominio DEBERÁ contener modelos, repositorios (abstractos) y servicios de dominio en subdirectorios separados
3. LA Capa_Aplicación DEBERÁ contener servicios de implementación, casos de uso y lógica específica de aplicación
4. LA Capa_Infraestructura DEBERÁ contener adaptadores de base de datos, controladores web, clientes de servicios externos y mapeadores
5. LA Arquitectura_Hexagonal DEBERÁ mantener un directorio de recursos para configuración y assets estáticos

### Requisito 3

**Historia de Usuario:** Como desarrollador, quiero implementar el patrón Repository con abstracciones claras, para poder cambiar fácilmente entre diferentes implementaciones de almacenamiento de datos y escribir pruebas exhaustivas.

#### Criterios de Aceptación

1. EL Patrón_Repositorio DEBERÁ definir interfaces abstractas para todas las operaciones de acceso a datos en la Capa_Dominio
2. EL Patrón_Repositorio DEBERÁ implementar clases de repositorio concretas en la Capa_Infraestructura
3. EL Patrón_Repositorio DEBERÁ soportar tanto operaciones Patrón_Comando (crear, actualizar, eliminar) como operaciones Patrón_Consulta (leer, buscar)
4. EL Patrón_Repositorio DEBERÁ proporcionar interfaces base genéricas para operaciones CRUD comunes
5. EL Patrón_Repositorio DEBERÁ habilitar la inyección de dependencias de implementaciones de repositorio en servicios de aplicación

### Requisito 4

**Historia de Usuario:** Como desarrollador, quiero separar las operaciones de comando y consulta, para poder optimizar las operaciones de lectura y escritura independientemente y mantener una separación clara de responsabilidades.

#### Criterios de Aceptación

1. EL Patrón_Comando DEBERÁ manejar todas las operaciones de escritura (crear, actualizar, eliminar) a través de manejadores de comando dedicados
2. EL Patrón_Consulta DEBERÁ manejar todas las operaciones de lectura a través de manejadores de consulta dedicados
3. LA Capa_Aplicación DEBERÁ proporcionar interfaces separadas para operaciones de comando y consulta
4. EL Patrón_Comando DEBERÁ validar reglas de negocio antes de ejecutar operaciones
5. EL Patrón_Consulta DEBERÁ optimizar la recuperación de datos sin restricciones de lógica de negocio

### Requisito 5

**Historia de Usuario:** Como desarrollador, quiero un modelado de dominio adecuado con entidades y objetos de valor, para poder representar conceptos de negocio con precisión y hacer cumplir invariantes de negocio.

#### Criterios de Aceptación

1. LA Capa_Dominio DEBERÁ definir clases Entidad con objetos de valor ID_Entidad fuertemente tipados encapsulados como identificadores
2. LA Capa_Dominio DEBERÁ definir clases Objeto_Valor para conceptos de dominio inmutables con métodos de validación y comparación
3. LAS clases Entidad DEBERÁN encapsular reglas de negocio e invariantes dentro de sus métodos
4. EL ID_Entidad DEBERÁ implementarse como objetos de valor type-safe (ej. PersonId conteniendo DNI como string)
5. LA Capa_Dominio DEBERÁ usar tipos TypeScript para hacer cumplir restricciones de dominio en tiempo de compilación

### Requisito 8

**Historia de Usuario:** Como desarrollador, quiero separación clara entre objetos de transferencia de datos y entidades de dominio, para poder mantener límites de API limpios y proteger la integridad del dominio.

#### Criterios de Aceptación

1. LA Capa_Infraestructura DEBERÁ definir clases DTO para todas las operaciones de entrada y salida de API
2. LA Capa_Infraestructura DEBERÁ definir clases DAO para estructuras de datos específicas de base de datos
3. LA Capa_Infraestructura DEBERÁ proporcionar componentes Mapeador para convertir entre objetos Entity, DTO y DAO
4. LAS clases DAO DEBERÁN soportar múltiples implementaciones de base de datos (Modelo_Documento para MongoDB, Modelo_JPA para bases de datos relacionales)
5. LAS clases DTO DEBERÁN usarse solo para límites de API y nunca contener lógica de negocio

### Requisito 9

**Historia de Usuario:** Como desarrollador, quiero separación estricta entre operaciones de comando y consulta a nivel de acceso a datos, para poder optimizar operaciones de lectura y escritura independientemente y mantener integridad de datos.

#### Criterios de Aceptación

1. LAS operaciones Patrón_Comando (crear, actualizar, eliminar) DEBERÁN usar objetos DTO para validación de entrada y transformación
2. LAS operaciones Patrón_Consulta (leer, buscar) DEBERÁN retornar entidades de dominio directamente sin requerir transformación DTO
3. EL Patrón_Repositorio DEBERÁ proporcionar interfaces separadas para operaciones de comando y operaciones de consulta
4. LAS operaciones Patrón_Comando DEBERÁN hacer cumplir reglas de negocio y validación antes de la persistencia
5. LAS operaciones Patrón_Consulta DEBERÁN optimizar para rendimiento de lectura sin restricciones de lógica de negocio

### Requisito 6

**Historia de Usuario:** Como desarrollador, quiero mantener compatibilidad con Next.js App Router y las características existentes, para que el refactor no rompa la funcionalidad actual mientras mejora la arquitectura.

#### Criterios de Aceptación

1. LA Arquitectura_Hexagonal DEBERÁ preservar todos los endpoints de API existentes y su funcionalidad
2. LA Capa_Infraestructura DEBERÁ integrarse sin problemas con la estructura de Next.js App Router
3. LA Arquitectura_Hexagonal DEBERÁ mantener compatibilidad con los sistemas de autenticación y base de datos existentes
4. LA Capa_Aplicación DEBERÁ preservar todas las características de negocio actuales (análisis de ideas, análisis de hackathon, dashboard)
5. LA Arquitectura_Hexagonal DEBERÁ soportar el sistema de feature flags existente e internacionalización

### Requisito 7

**Historia de Usuario:** Como desarrollador, quiero inyección de dependencias integral y gestión de configuración, para poder gestionar fácilmente las dependencias de servicios y la configuración de la aplicación.

#### Criterios de Aceptación

1. LA Arquitectura_Hexagonal DEBERÁ implementar un contenedor de inyección de dependencias para la gestión de servicios
2. LA Capa_Aplicación DEBERÁ recibir todas las dependencias a través de inyección por constructor
3. LA Capa_Infraestructura DEBERÁ proporcionar métodos factory para crear instancias de servicio configuradas
4. LA Arquitectura_Hexagonal DEBERÁ centralizar la gestión de configuración en un módulo dedicado
5. LA Arquitectura_Hexagonal DEBERÁ soportar sobrescrituras de configuración específicas del entorno
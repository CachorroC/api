# API de Actuaciones y Carpetas – Rama Judicial

Este proyecto es una API y conjunto de scripts para
sincronizar, consultar y actualizar información de
actuaciones judiciales y carpetas, utilizando datos de la
Rama Judicial de Colombia. Utiliza Node.js, TypeScript y
Prisma ORM para la gestión de datos y automatización de
procesos.

## Características principales

- **Sincronización automática de actuaciones**: Obtiene y
  actualiza actuaciones judiciales de procesos almacenados
  en la base de datos.
- **Integración con Prisma**: Utiliza Prisma ORM para
  operaciones eficientes de lectura y escritura en la base
  de datos.
- **Automatización y robustez**: Incluye mecanismos de
  espera, manejo de errores y actualización masiva de datos.
- **Cliente API robusto**: Permite la consulta y
  procesamiento de actuaciones de múltiples procesos
  judiciales de manera concurrente y segura.

## Estructura de archivos relevante

- `src/actuaciones.ts`: Script principal para sincronización
  y actualización de actuaciones.
- `src/services/prisma.ts`: Configuración y cliente Prisma
  para acceso a la base de datos.
- `src/models/actuacion.ts`: Modelo de datos para
  actuaciones.
- `src/types/actuaciones.ts`: Tipos TypeScript para las
  entidades y respuestas de la API.
- `src/utils/awaiter.js`: Utilidad para funciones asíncronas
  y retardos.
- `src/utils/fetcher.js`: Cliente robusto para llamadas HTTP
  y procesamiento de lotes.

## Operaciones y flujo principal

1. **Obtención de procesos**: Se consultan todas las
   carpetas y sus procesos asociados desde la base de datos
   (`getIdProcesos`).
2. **Consulta de actuaciones**: Por cada proceso, se realiza
   una petición HTTP a la API pública de la Rama Judicial
   para obtener las actuaciones.
3. **Procesamiento y transformación**: Las fechas y campos
   relevantes se transforman a objetos Date y se normalizan
   los datos.
4. **Actualización en base de datos**: Se realiza un upsert
   (insertar o actualizar) de cada actuación en la base de
   datos, asegurando que no haya duplicados y que la
   información esté actualizada.
5. **Automatización**: El script puede ejecutarse de forma
   continua o programada para mantener la base de datos
   sincronizada.

## Ejemplo de ejecución

El script principal ejecuta la función `runSync`, que
realiza todo el flujo de sincronización:

```bash
node src/actuaciones.ts
```

Esto:

- Obtiene todos los procesos de la base de datos.
- Consulta las actuaciones de cada proceso.
- Actualiza la base de datos con la información más
  reciente.
- Muestra en consola el progreso y el estado final.

## Salidas y archivos generados

- `actuacionesOutput.json`: Archivo de ejemplo con el
  resultado de la sincronización de actuaciones.
- Mensajes de log en consola sobre el progreso y errores.

## Requisitos

- Node.js >= 18
- Prisma ORM
- Acceso a la API pública de la Rama Judicial

## Instalación y configuración

1. Instala las dependencias:
   ```bash
   pnpm install
   # o npm install
   ```
2. Configura la base de datos en `prisma/schema.prisma` y
   ejecuta las migraciones:
   ```bash
   npx prisma migrate dev
   ```
3. Ajusta las variables de entorno si es necesario.

## Uso

Ejecuta el script principal para sincronizar actuaciones:

```bash
node src/actuaciones.ts
```

## Notas adicionales

- El script implementa retardos automáticos entre peticiones
  para evitar bloqueos por parte de la API externa.
- El manejo de errores es robusto: los fallos en la consulta
  de un proceso no detienen la sincronización global.
- El código es fácilmente extensible para agregar nuevas
  fuentes de datos o modificar la lógica de actualización.

## Licencia

MIT

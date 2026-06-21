# Workshop: GitHub Copilot para BCPR - Desarrollo Asistido por IA con TypeScript

## Tabla de Contenidos

- [Introduccion](#-introduccion)
- [Conceptos Clave de GitHub Copilot](#-conceptos-clave-de-github-copilot)
- [Pre-requisitos](#%EF%B8%8F-pre-requisitos)
- [Agenda del Workshop](#-agenda-del-workshop)
- [Ejercicio 1: Montar el Marco de Copilot para BCPR](#-ejercicio-1-montar-el-marco-de-copilot-para-bcpr)
- [Ejercicio 2: Construir un Feature Nuevo con el Marco](#-ejercicio-2-construir-un-feature-nuevo-con-el-marco)
- [Ejercicio 3: Tests y Validacion con el Agente QA](#-ejercicio-3-tests-y-validacion-con-el-agente-qa)
- [Ejercicio 4: QA Completo — Caza de Bugs, Test Plan y Datos](#-ejercicio-4-qa-completo--caza-de-bugs-test-plan-y-datos)
- [Bonus: Introduccion a Harness Engineering](#bonus-introduccion-a-harness-engineering)
- [Referencia Rapida](#-referencia-rapida)
- [Recursos Adicionales](#-recursos-adicionales)

---

## Introduccion

Este workshop practico de **3 horas** tiene dos objetivos:

1. **Montar un marco de personalizacion de Copilot** (instrucciones, skills, agents, prompts) que todo el equipo BCPR pueda usar desde el dia 1
2. **Usar ese marco para construir un feature nuevo** siguiendo la arquitectura limpia del proyecto

> **La idea central:** No empezamos de cero. Trabajamos sobre el proyecto real, con el core real, y le ensenamos a Copilot a hablar "BCPR" para que nos ayude a generar features correctamente desde el primer intento.

### Aprenderas a:

- Crear instrucciones por capa (`.instructions.md`) que se activan segun el archivo que editas
- Crear prompt files (`.prompt.md`) como comandos `/slash` reutilizables para el equipo
- Crear un Agent Skill que empaquete los patrones de testing de BCPR
- Crear Custom Agents especializados (Arquitecto, QA)
- **Usar todo lo anterior para construir un feature completo de Notificaciones** con Domain, Application, Infrastructure y Presentation -- sin escribir boilerplate manualmente

### Estandares del Proyecto (los que ya usamos)

| Aspecto | Estandar |
|---------|----------|
| Lenguaje | TypeScript 5+ strict mode |
| Runtime | Node.js 20 (Lambda) |
| Infraestructura | AWS CDK |
| Arquitectura | Clean Architecture (Ports & Adapters) |
| DI | `injection-js` (@Injectable, @Inject, InjectionToken) |
| Validacion | `class-validator` + `class-transformer` |
| API | Express REST API |
| Base de datos | DynamoDB (en el workshop: adaptador en memoria) |
| Pruebas | Jest |

### Escenario: Feature de Notificaciones

Vamos a construir un modulo de notificaciones usando el core que ya tenemos:

- **Notificaciones**: mensajes enviados a los usuarios (push, email, SMS)
- **Preferencias**: configuracion de canales preferidos por usuario (bonus)

### Arquitectura que vamos a seguir

El feature se integra al proyecto existente asi:

```
src/
├── examples/
│   └── example-use-case.ts            # Referencia del patron (Port + UseCase + DI)
│
├── core/                              # YA EXISTE - modificamos injector.ts y app.ts
│   ├── server/
│   │   ├── server.ts                  # Express server (puerto 3000)
│   │   └── app.ts                     # <-- AGREGAMOS rutas del controller
│   ├── injection/
│   │   ├── injector.ts                # <-- AGREGAMOS providers del feature
│   │   └── providers/                 # <-- AGREGAMOS notification-provider.ts
│   ├── middlewares/
│   │   ├── interceptor/error-interceptor.ts
│   │   └── converter/converter-function.ts
│   ├── error/                         # BaseError, NotFoundError, etc.
│   └── logger/                        # AbstractLogger
│
├── features/
│   └── notification/                  # <-- ESTO ES LO QUE CONSTRUIMOS
│       ├── application/
│       │   ├── ports/
│       │   │   ├── read-notifications-port.ts
│       │   │   └── write-notification-port.ts
│       │   └── usecases/
│       │       ├── list-notifications-use-case.ts
│       │       ├── create-notification-use-case.ts
│       │       └── mark-as-read-use-case.ts
│       ├── domain/
│       │   ├── entities/
│       │   │   └── notification.ts
│       │   └── notification-type.ts
│       ├── infrastructure/
│       │   ├── adapter/
│       │   │   └── notification-memory-adapter.ts
│       │   ├── converter/
│       │   │   └── notification-view-model-converter.ts
│       │   └── controller/
│       │       └── notification-controller.ts
│       ├── presentation/
│       │   ├── arguments/
│       │   │   └── create-notification-arguments.ts
│       │   └── view-models/
│       │       └── notification-view-model.ts
│       └── tests/
│           ├── unit/
│           └── integration/
```

### Flujo de un Request (como funciona en el proyecto)

```
HTTP Request (GET /api/notifications/:userId)
    |
    v
[Controller]  -->  Validates input with class-validator
    |                Delegates to use case
    v
[Use Case]    -->  @Injectable, injects Port via InjectionToken
    |                Structured logging, orchestrates logic
    v
[Port]        -->  Interface (contract): ReadNotificationsPort
    |
    v
[Adapter]     -->  Concrete implementation (memory/DynamoDB/API)
    |
    v
[Converter]   -->  ConverterFunction<Notification, NotificationViewModel>
    |
    v
HTTP Response (JSON: { success: true, data: NotificationViewModel[] })
```

> **Clave:** El controller inyecta directamente los use cases via constructor (injection-js). Los use cases dependen de **ports** (interfaces), no de adapters.

---

## Conceptos Clave de GitHub Copilot

### Que es GitHub Copilot?

GitHub Copilot es un asistente de programacion impulsado por IA que se integra directamente en tu editor de codigo. Funciona como un par de programacion que:

- Sugiere lineas completas o bloques de codigo mientras escribes
- Entiende el contexto de tu proyecto (nombres de archivos, comentarios, codigo existente)
- Aprende de tus patrones y se adapta a tu estilo

### El Arte del Prompting en Copilot

La clave para obtener buenos resultados esta en como describes lo que necesitas.

**Prompt debil:**
```
Crea un endpoint de notificaciones
```
*Que esta mal? No hay contexto de arquitectura, ni patron, ni donde ponerlo.*

**Prompt efectivo:**
```
@workspace Crea un nuevo use case ListNotificationsUseCase en
features/notification/application/usecases/ siguiendo el mismo
patron que ya existe en el core. Inyecta el port ReadNotificationsPort
con su InjectionToken. Incluye logging estructurado.
```

Observa como el segundo prompt le da a Copilot **contexto** (proyecto BCPR), **referencia** (patrones del core), **ubicacion** (ruta exacta) y **patrones** (port, InjectionToken, logging).

### Que es @workspace?

El `@workspace` le da a Copilot contexto de todo tu proyecto.

| Uso | Ejemplo |
|-----|---------|
| Buscar patron | `@workspace como se implementan los use cases en este proyecto?` |
| Referenciar existente | `@workspace crea algo similar al notification-memory-adapter.ts` |
| Entender flujo | `@workspace como llega un request desde el controller hasta el adapter?` |

### Modos de GitHub Copilot Chat

> **Nota:** La interfaz puede variar segun tu version de VS Code.

| Modo | Funcion | Cuando usarlo |
|------|---------|--------------|
| **Ask** | Solo responde, NO modifica archivos | Explorar, entender, planificar |
| **Agent** | PUEDE crear y modificar archivos | Implementar, crear codigo |
| **Plan** | Genera plan detallado ANTES de ejecutar | Tareas complejas multi-archivo |

### Comandos Especiales

| Comando | Descripcion |
|---------|-------------|
| `/tests` | Genera pruebas unitarias |
| `/doc` | Genera documentacion |
| `/fix` | Propone correccion de errores |
| `/explain` | Explica codigo seleccionado |
| `/init` | Genera `copilot-instructions.md` inicial |
| `/create-instruction` | Scaffoldea instrucciones nuevas |
| `/create-prompt` | Scaffoldea un prompt file |
| `/create-skill` | Scaffoldea un agent skill |
| `/create-agent` | Scaffoldea un custom agent |

---

## Pre-requisitos

### Software Necesario

```bash
node --version        # 20 o superior
npm --version
code --version        # Visual Studio Code
git --version
```

### Extensiones de VS Code

- **GitHub Copilot** -- Extension principal
- **GitHub Copilot Chat** -- Chat integrado

### Acceso

- Cuenta GitHub con licencia de Copilot
- Clon del repositorio con dependencias instaladas (`npm install`)

---

## Agenda del Workshop

| Hora | Bloque | Actividad | Modo Copilot |
|------|--------|-----------|--------------|
| 0:00 - 0:15 | Bienvenida | Setup, intro a la arquitectura, demo del flujo Controller->UseCase->Port->Adapter | - |
| 0:15 - 0:20 | Demo | **"Antes"**: pedir un use case SIN instrucciones, ver resultado generico | Agent |
| 0:20 - 1:00 | Ejercicio 1 | Montar el marco de Copilot + comparar **"Despues"** al final | Ask -> Agent |
| 1:00 - 1:05 | Break | Descanso y Q&A rapido | - |
| 1:05 - 1:50 | Ejercicio 2 | Construir el feature de Notificaciones usando el marco + verificar con curl | Agent + Tab |
| 1:50 - 1:55 | Break | Descanso rapido | - |
| 1:55 - 2:20 | Ejercicio 3 | Tests, `npm test`, validacion con el agente QA | Agent + /tests |
| 2:20 - 2:50 | Ejercicio 4 | QA completo: test plan, caza de bugs, datos de prueba | Agent + QA |
| 2:50 - 3:00 | Cierre | Recap, que commitear, y como mantener las customizaciones | - |

> **Nota para el instructor:** Si el setup toma mas de 15 minutos, reduce los pasos bonus del Ejercicio 2. Lo mas importante es que completen el Ejercicio 1 (el marco) y al menos el scaffold del feature en el Ejercicio 2.

---

## Ejercicio 1: Montar el Marco de Copilot para BCPR (45 min)

> **Este es el ejercicio mas valioso del workshop.** Todo lo que creamos aqui se commitea al repo y beneficia a todo el equipo desde el dia 1.

### Objetivos

- Entender los 5 niveles de personalizacion de Copilot
- Crear instrucciones que se activan por capa de arquitectura
- Crear prompt files para scaffold de features y use cases
- Crear un skill de testing con los patrones del equipo
- Crear custom agents especializados (Arquitecto y QA)

---

### Paso 1.0: Demo "Antes vs Despues" -- por que importa el marco

> **Este paso es clave.** Vamos a ver que genera Copilot SIN instrucciones para luego comparar.

**PROMPT en Modo Agent (sin haber creado ningun archivo .github todavia):**

```
Crea un use case llamado ListNotificationsUseCase en
features/notification/application/usecases/list-notifications-use-case.ts
```

**Guarda el resultado** (o toma screenshot). Observa:
- Usa la DI correcta (`injection-js` con `@Injectable` y `@Inject`)... o inventa otra?
- Incluye logging estructurado con `AbstractLogger`?
- Inyecta un Port con `InjectionToken` o importa el adapter directamente?
- Retorna ViewModels transformados con `ConverterFunction`?

> **Spoiler:** Probablemente genera algo generico que no sigue nuestros patrones. **Al final del Ejercicio 1**, vamos a pedir exactamente lo mismo y comparar. Esa diferencia es el ROI del marco.

**Deshaz los cambios** (Copilot: `Ctrl+Z` o rechaza los archivos) antes de continuar.

---

### Paso 1.1: Explorar el proyecto con Modo Ask

> **IMPORTANTE:** Asegurate de estar en **Modo Ask**. Este modo NO modifica archivos.

Antes de crear nada, hagamos que Copilot entienda nuestro proyecto.

**PROMPT -- Copia y pega en Copilot Chat:**

```
@workspace Analiza la arquitectura de este proyecto y respondeme:

1. Que patron de arquitectura se usa? Describe las capas.
2. Muestra como se conecta el server.ts con app.ts y los middlewares.
3. Como funciona la inyeccion de dependencias? Que es un InjectionToken?
   (mira el ejemplo en src/examples/example-use-case.ts)
4. Que es un ConverterFunction y como se usa?
   (mira core/middlewares/converter/converter-function.ts)
5. Como se manejan los errores? (mira core/error/)
6. Donde se registran los providers de un feature?
   (mira core/injection/injector.ts)
```

> **Observa:** Copilot analiza el proyecto real y te explica la arquitectura. Esto es util tanto para onboarding de nuevos devs como para confirmar que Copilot "entiende" el codebase.

---

### Paso 1.2: Crear Instrucciones Globales del Proyecto

> **Cambia a Modo Agent.** A partir de aqui, Copilot va a crear archivos.

**PROMPT en Modo Agent:**

```
Crea el archivo .github/copilot-instructions.md con instrucciones
globales para el proyecto:

# Instrucciones para GitHub Copilot - BCPR Dev API

## Arquitectura
- Este proyecto sigue Clean Architecture con patron Port-Adapter
- Capas: Domain, Application (ports + usecases), Infrastructure (adapters,
  converters, controller), Presentation (view-models, arguments)
- La DI usa injection-js con @Injectable(), @Inject() e InjectionToken<T>
- La API es Express REST con controllers que registran rutas en el Router
- Los controllers registran sus rutas via registerRoutes(router) method

## Patrones obligatorios
- Use Cases: una clase con un metodo execute(), @Injectable()
- Ports: interfaces en application/ports/ con InjectionToken exportado
- Adapters: implementan ports, van en infrastructure/adapter/, @Injectable()
- Converters: implementan ConverterFunction<T, R> o ConverterBiFunction<T, R, V>
- Controllers: Express Router handlers, validan input con class-validator, delegan a use cases
- ViewModels: plain TypeScript classes (sin decoradores de presentacion)
- Arguments: usan decoradores de class-validator (@IsNotEmpty, @IsString, @IsEnum)

## DI: Como registrar un feature nuevo
1. Crear providers en core/injection/providers/<feature>-provider.ts
2. Mapear: { provide: ITokenProvider, useClass: ConcreteAdapter }
3. Agregar el array de providers al injector.ts
4. Agregar controller al array de providers

## Nomenclatura
- Clases: PascalCase (ListNotificationsUseCase)
- Archivos: kebab-case (list-notifications-use-case.ts)
- Tokens: I + nombre + Provider (IReadNotificationsPortProvider)
- Ports: nombre + Port (ReadNotificationsPort)

## Errores
- Extender BaseError (core/error/base-error.ts)
- Tipos: NotFoundError, UnprocessableEntityError, ForbiddenError

## Logging
- Inyectar AbstractLogger
- Inicio: logger.info('Event started: <accion>', { contexto })
- Fin: logger.info('Event finished: <accion>', { resultado })
- Usar converters de logging para no loguear datos sensibles
```

---

### Paso 1.3: Crear Instrucciones por Capa de Arquitectura

Estas instrucciones se activan **automaticamente** segun el archivo que estas editando.

**PROMPT en Modo Agent:**

```
@workspace Crea 4 archivos de instrucciones especificas por capa.
Mira src/examples/example-use-case.ts y los archivos en core/ para entender los patrones:

1. .github/instructions/domain-layer.instructions.md
---
name: 'Reglas de Domain Layer'
description: 'Convenciones para entidades y logica de dominio BCPR'
applyTo: '**/domain/**/*.ts'
---

Estas editando la capa de DOMINIO. Reglas:

- Las entidades NO importan de infrastructure, application ni presentation
- Patrones validos en este proyecto:
  * Interface + funcion mapper:
    export function mapToNotification(source: Record<string, any>): Notification { ... }
  * Clase con constructor y metodos de negocio
- La logica de negocio vive aqui: validaciones, calculos, estado
- Los DTOs son interfaces planas en archivos separados (*-dto.ts)
- NO usar @Injectable(), decoradores de DI, ni imports de Express
- Los enums de dominio van en archivos separados (*-type.ts)


2. .github/instructions/usecases-layer.instructions.md
---
name: 'Reglas de Use Cases'
description: 'Convenciones para casos de uso en application layer BCPR'
applyTo: '**/application/usecases/**/*.ts'
---

Estas editando un USE CASE. Reglas del proyecto:

- @Injectable() de injection-js obligatorio
- Un metodo publico: execute() (puede recibir params tipados)
- Inyectar dependencias en constructor:
  * AbstractLogger para logging
  * Ports via @Inject(ITokenProvider) (NUNCA adapters concretos)
  * Converters via @Inject(IConverterProvider)
- Logging estructurado obligatorio:
  * Inicio: this.logger.info('Event started: <accion>', { user/params })
  * Fin: this.logger.info('Event finished: <accion>', { resultado })
- Usar converters de logging para datos sensibles (no loguear tarjetas, SSN, etc.)
- Retornar ViewModels (no entidades de dominio)
- Para errores: lanzar NotFoundError, UnprocessableEntityError, etc.
- Referencia: ver src/examples/example-use-case.ts para el patron base


3. .github/instructions/adapters-layer.instructions.md
---
name: 'Reglas de Adapters'
description: 'Convenciones para adapters en infrastructure layer BCPR'
applyTo: '**/infrastructure/adapter/**/*.ts'
---

Estas editando un ADAPTER. Reglas del proyecto:

- @Injectable() obligatorio
- DEBE implementar el Port (interface) de application/ports/
- Un adapter puede implementar multiples ports
- Para el workshop: usar Map en memoria (en produccion seria DynamoDB)
- Encapsular TODOS los detalles de infraestructura
- NO contener logica de negocio (eso va en domain o use case)
- Manejar errores de infra y transformar a errores de dominio:
  if (response.error) throw new UnprocessableEntityError(...)
- Mappear respuestas externas a entidades de dominio usando mappers


4. .github/instructions/controllers-layer.instructions.md
---
name: 'Reglas de Controllers'
description: 'Convenciones para controllers Express BCPR'
applyTo: '**/infrastructure/controller/**/*.ts'
---

Estas editando un CONTROLLER (entry point HTTP). Reglas del proyecto:

- El controller inyecta use cases directamente via constructor (@Injectable + @Inject)
- Implementa un metodo registerRoutes(router: Router) para registrar endpoints
- Valida input con class-validator (plainToInstance + validate)
- El controller SOLO delega al use case -- cero logica de negocio
- Inputs: usar clases con decoradores de class-validator (@IsNotEmpty, @IsString, @IsEnum)
- Retorno: JSON response con estructura { success: true, data: ViewModel[] }
- Errores se manejan via el errorInterceptor middleware de Express
- El archivo debe estar en infrastructure/controller/
- Referencia: ver copilot-instructions.md para convenciones de controllers
```

> **Momento wow:** A partir de ahora, cuando alguien del equipo edite un archivo en `domain/`, Copilot sabra que no debe sugerir imports de Express. Si edita un use case, sabra que debe incluir logging. Si edita un controller, sabra que debe validar input con class-validator y delegar al use case.

---

### Paso 1.4: Crear Prompt Files -- Comandos del Equipo

Los prompt files son **tareas reutilizables** que se invocan como `/nombre` en el chat.

**PROMPT en Modo Agent:**

```
@workspace Crea 3 prompt files reutilizables para el equipo BCPR.
Basa los patrones en src/examples/example-use-case.ts y los archivos del core:

1. .github/prompts/new-feature.prompt.md
---
name: 'new-feature'
description: 'Genera la estructura completa de un feature nuevo'
agent: 'agent'
argument-hint: 'nombre del feature (ej: notification, transfer, loan)'
---

@workspace Crea la estructura completa para un nuevo feature llamado
"${input:featureName}" en features/${input:featureName}/
siguiendo los patrones del proyecto.

Usa como referencia:
- src/examples/example-use-case.ts (patron de Port, InjectionToken, Use Case)
- core/middlewares/converter/converter-function.ts (interface ConverterFunction)
- core/error/ (BaseError, NotFoundError, UnprocessableEntityError)
- core/logger/logger.ts (AbstractLogger)

Genera estos archivos siguiendo las instrucciones de copilot-instructions.md:

1. domain/entities/${input:featureName}.ts -- Entidad con constructor y metodos de negocio
2. domain/${input:featureName}-type.ts -- Enums de dominio (si aplica)
3. application/ports/read-${input:featureName}-port.ts -- Interface + InjectionToken
4. application/ports/write-${input:featureName}-port.ts -- Interface + InjectionToken
5. application/usecases/list-${input:featureName}s-use-case.ts -- @Injectable, port, converter, logging
6. application/usecases/create-${input:featureName}-use-case.ts
7. infrastructure/adapter/${input:featureName}-memory-adapter.ts -- Implementa ambos ports, datos en memoria
8. infrastructure/converter/${input:featureName}-view-model-converter.ts -- ConverterFunction
9. infrastructure/controller/${input:featureName}-controller.ts -- Express controller con registerRoutes
10. presentation/view-models/${input:featureName}-view-model.ts -- Plain class
11. presentation/arguments/create-${input:featureName}-arguments.ts -- class-validator
12. core/injection/providers/${input:featureName}-provider.ts -- Array de providers

Incluye 3-5 datos de ejemplo realistas en el adapter.


2. .github/prompts/new-usecase.prompt.md
---
name: 'new-usecase'
description: 'Crear un nuevo Use Case siguiendo los patrones BCPR'
agent: 'agent'
argument-hint: 'nombre del use case (ej: cancel-payment, verify-identity)'
---

@workspace Crea un nuevo Use Case en el proyecto BCPR.

Nombre: ${input:useCaseName}
Feature: ${input:featureName}

Genera:
1. El archivo del use case en
   features/${input:featureName}/application/usecases/${input:useCaseName}.ts
   - @Injectable()
   - Constructor con: AbstractLogger, Ports via @Inject(Token), Converters
   - Metodo execute() con logging inicio/fin
   - Referencia: sigue el patron de src/examples/example-use-case.ts

2. El test unitario en
   features/${input:featureName}/tests/unit/${input:useCaseName}.spec.ts
   - Mocks de todas las dependencias
   - Happy path + error cases
   - Patron Arrange-Act-Assert

3. Agrega el use case al provider del feature si existe


3. .github/prompts/review-clean-arch.prompt.md
---
name: 'review-clean-arch'
description: 'Revisar que un feature cumpla la arquitectura limpia BCPR'
agent: 'ask'
---

@workspace Revisa el feature de notificaciones (o el ultimo feature
modificado) y verifica estas reglas de arquitectura limpia:

## Dependencias entre capas
- [ ] Domain NO importa de Application, Infrastructure ni Presentation
- [ ] Use Cases inyectan Ports (interfaces), NO Adapters concretos
- [ ] Adapters implementan los Ports correspondientes
- [ ] Controllers delegan a Use Cases directamente (sin logica propia)

## Patrones obligatorios
- [ ] Todos los Use Cases tienen @Injectable() y metodo execute()
- [ ] Todos los Adapters tienen @Injectable() e implementan al menos un Port
- [ ] Cada Port tiene su InjectionToken exportado
- [ ] Los Converters implementan ConverterFunction<T, R> o ConverterBiFunction
- [ ] Los ViewModels son plain TypeScript classes
- [ ] Los Arguments usan decoradores de class-validator (@IsNotEmpty, @IsString, @IsEnum)

## DI y registro
- [ ] Providers registrados en core/injection/providers/
- [ ] Port -> Adapter mapeado con { provide: Token, useClass: Adapter }
- [ ] Controller agregado al array de providers

## Logging y errores
- [ ] Use Cases tienen logging al inicio y fin de execute()
- [ ] Errores usan la jerarquia BaseError
- [ ] No hay datos sensibles en logs

Reporta: CRITICO | IMPORTANTE | MENOR con archivo y linea.
```

**Como se usan:**

```
/new-feature notification       --> Scaffold completo del feature
/new-usecase cancel-payment     --> Use case + test unitario
/review-clean-arch              --> Audit de arquitectura
```

---

### Paso 1.5: Crear Agent Skill -- Patrones de Testing BCPR

Un Skill se carga **automaticamente** cuando Copilot detecta que aplica. Ideal para testing.

**PROMPT en Modo Agent:**

```
@workspace Crea un Agent Skill de testing para el proyecto BCPR.
Usa los patrones descritos abajo (seran la referencia del equipo).

Estructura:
.github/skills/bcpr-testing/SKILL.md

---
name: bcpr-testing
description: >
  Patrones y guia para crear tests unitarios e integracion en el proyecto.
  Se activa cuando el usuario pide crear, generar, o escribir tests.
  Incluye patrones para mockear ports injection-js, testear use cases,
  testear controllers, y convenciones del equipo.
user-invocable: true
argument-hint: 'archivo o feature a testear'
---

# Skill: Testing BCPR

## Cuando se activa

Cuando el usuario pide crear, generar, o arreglar tests para:
- Use cases (application/usecases/)
- Adapters (infrastructure/adapter/)
- Controllers (infrastructure/controller/)
- Entidades de dominio (domain/)

## Estructura de tests en el proyecto

```
features/<feature>/tests/
  unit/                  # Mockean todas las dependencias
  integration/           # Usan DI parcial o real
```

## Patron 1: Test Unitario de Use Case

Los use cases son las piezas mas importantes de testear.
Todas las dependencias se mockean.

```typescript
import 'reflect-metadata';

describe('ListNotificationsUseCase', () => {
  // Mock del Port (la interfaz, no el adapter)
  const mockReadPort = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
  };

  // Mock del Logger
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  // Mock del Converter
  const mockConverter = {
    apply: jest.fn(),
  };

  let useCase: ListNotificationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    // Instanciar manualmente con mocks (sin DI)
    useCase = new ListNotificationsUseCase(
      mockLogger as any,
      mockReadPort as any,
      mockConverter as any
    );
  });

  describe('execute', () => {
    it('debe retornar notificaciones convertidas a ViewModel', async () => {
      // Arrange
      const notificaciones = [
        { id: '1', title: 'Test', userId: 'user-001' },
      ];
      mockReadPort.findByUserId.mockResolvedValue(notificaciones);
      mockConverter.apply.mockImplementation(n => ({ ...n, isRead: false }));

      // Act
      const resultado = await useCase.execute('user-001');

      // Assert
      expect(mockReadPort.findByUserId).toHaveBeenCalledWith('user-001');
      expect(mockConverter.apply).toHaveBeenCalledTimes(1);
      expect(resultado).toHaveLength(1);
      expect(mockLogger.info).toHaveBeenCalledTimes(2); // inicio + fin
    });

    it('debe retornar array vacio si el usuario no tiene notificaciones', async () => {
      mockReadPort.findByUserId.mockResolvedValue([]);
      const resultado = await useCase.execute('user-999');
      expect(resultado).toEqual([]);
    });

    it('debe propagar errores del port', async () => {
      mockReadPort.findByUserId.mockRejectedValue(new Error('DB Error'));
      await expect(useCase.execute('user-001')).rejects.toThrow('DB Error');
      expect(mockLogger.info).toHaveBeenCalledTimes(1); // solo inicio
    });
  });
});
```

## Patron 2: Test de Entidad de Dominio

Las entidades se testean SIN mocks (son puras).

```typescript
describe('Notification', () => {
  it('debe marcar como leida', () => {
    const notif = new Notification({
      id: '1', userId: 'u1', title: 'Test',
      status: NotificationStatus.UNREAD
    });

    notif.markAsRead();

    expect(notif.status).toBe(NotificationStatus.READ);
    expect(notif.readAt).toBeDefined();
    expect(notif.isRead()).toBe(true);
  });
});
```

## Patron 3: Test de Integration (Controller)

Los tests de integracion usan supertest contra la app real.

```typescript
import 'reflect-metadata';
import request from 'supertest';
import { createApp } from '../../../../core/server/app';

describe('NotificationController (integration)', () => {
  const app = createApp();

  it('debe retornar notificaciones del usuario', async () => {
    const response = await request(app)
      .get('/api/notifications/user-001')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('debe crear una notificacion con datos validos', async () => {
    const response = await request(app)
      .post('/api/notifications')
      .send({
        userId: 'user-001',
        title: 'Test',
        message: 'Test message',
        type: 'PUSH',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
  });
});
```

## Convenciones del equipo

- Archivos: `<nombre>.spec.ts`
- describe(): Nombre de la clase
- it(): En espanol con "debe..." (`debe retornar lista de notificaciones`)
- Variables mock: prefijo `mock` (mockPort, mockLogger)
- Patron AAA: Arrange-Act-Assert
- Importar `reflect-metadata` al inicio (por injection-js)
- Cada test independiente: `beforeEach` con `jest.clearAllMocks()`
- NO mockear entidades de dominio
```

---

### Paso 1.6: Crear Custom Agents

**PROMPT en Modo Agent:**

```
@workspace Crea 2 custom agents para el equipo BCPR:

1. .github/agents/bcpr-architect.agent.md

---
name: 'BCPR Architect'
description: 'Arquitecto de software BCPR. Conoce Clean Architecture, Port-Adapter, injection-js, Express y todas las convenciones del proyecto.'
tools: ['search/codebase', 'search/usages', 'web/fetch']
model: ['Claude Sonnet 4', 'GPT-4o']
handoffs:
  - label: Implementar este diseno
    agent: agent
    prompt: Implementa los cambios arquitecturales que acabo de describir.
    send: false
---

# BCPR Architect

Eres el arquitecto de software del proyecto.

## Tu conocimiento del proyecto

### Estructura
- src/core/ -- infraestructura transversal (server, DI, middlewares, errors, logger)
- src/features/ -- un directorio por feature con capas Domain/Application/Infrastructure/Presentation
- Cada feature tiene: ports, usecases, adapters, converters, controller, view-models, arguments

### Patrones criticos
- Port-Adapter con injection-js (InjectionToken, @Injectable, @Inject)
- ConverterFunction<T, R> y ConverterBiFunction<T, R, V> para transformar entre capas
- Controllers inyectan use cases directamente y registran rutas via registerRoutes(router)
- ErrorInterceptor como middleware global de Express que enriquece errores
- class-validator para validacion de input en controllers

### Regla de dependencias
Domain -> (nada)
Application -> Domain
Infrastructure -> Application + Domain
Presentation -> (solo ViewModels/Arguments, sin logica)
Controller -> Application (inyecta use cases directamente)

## Como responder

1. Siempre busca en el codebase antes de responder (search/codebase)
2. Referencia archivos existentes como ejemplo
3. Explica el "por que" detras del patron
4. Al disenar algo nuevo: muestra estructura de archivos + como se conectan las capas + config DI
5. Ofrece handoff a implementacion cuando el diseno este aprobado

## NUNCA sugieras
- Logica de negocio en controllers
- Importar adapters directamente en use cases (solo ports)
- Saltarse ports "por simplicidad"
- Desactivar strict mode o usar any sin justificacion


2. .github/agents/bcpr-qa.agent.md

---
name: 'BCPR QA'
description: 'Ingeniero de calidad BCPR. Revisa codigo, genera tests, verifica patrones y cobertura.'
tools: ['search/codebase', 'search/usages']
model: ['Claude Sonnet 4', 'GPT-4o']
handoffs:
  - label: Corregir problemas
    agent: agent
    prompt: Corrige los problemas de calidad que acabo de identificar.
    send: false
---

# BCPR QA

Eres el ingeniero de QA del proyecto.

## Tu trabajo

1. Revisar codigo buscando: bugs, edge cases, violaciones de arquitectura
2. Generar tests que cubran escenarios criticos
3. Verificar que los tests existentes sean suficientes
4. Reportar problemas con severidad

## Al revisar, siempre verifica:
- Use cases manejan caso "no encontrado" (NotFoundError)
- Adapters manejan errores de infraestructura (try/catch)
- Controllers validan input con class-validator antes de delegar
- No hay datos sensibles en logs (tarjetas, SSN, passwords)
- Converters manejan campos null/undefined sin crashear
- Los providers estan registrados correctamente en el injector

## Al generar tests
Sigue los patrones del skill bcpr-testing (si esta disponible)

## Al reportar
Usa severidades:
- CRITICO: Puede causar errores en produccion
- IMPORTANTE: Viola patrones de arquitectura
- MENOR: Mejora de codigo o legibilidad
```

---

### Paso 1.7: Verificar el marco completo

**Estructura final de lo que creamos:**

```
.github/
├── copilot-instructions.md                          # Reglas globales
├── instructions/
│   ├── domain-layer.instructions.md                 # Auto-activa en domain/
│   ├── usecases-layer.instructions.md               # Auto-activa en usecases/
│   ├── adapters-layer.instructions.md               # Auto-activa en adapter/
│   └── controllers-layer.instructions.md            # Auto-activa en controller/
├── prompts/
│   ├── new-feature.prompt.md                        # /new-feature <nombre>
│   ├── new-usecase.prompt.md                        # /new-usecase <nombre>
│   └── review-clean-arch.prompt.md                  # /review-clean-arch
├── skills/
│   └── bcpr-testing/
│       └── SKILL.md                                 # Auto-activa al pedir tests
└── agents/
    ├── bcpr-architect.agent.md                      # Agente arquitecto
    └── bcpr-qa.agent.md                             # Agente QA
```

**Prueba rapida de cada pieza:**

| Pieza | Como probar | Que esperar |
|-------|-------------|-------------|
| Instrucciones globales | Pide a Copilot crear cualquier archivo | Debe seguir convenciones BCPR |
| Instrucciones domain | Abre un archivo en `domain/`, pide codigo | NO debe sugerir @Injectable ni Express |
| Instrucciones usecases | Abre un archivo en `usecases/`, pide codigo | DEBE incluir logging y inyectar ports |
| `/new-feature` | Escribe `/new-feature` en chat | Debe pedir nombre y generar estructura |
| `/review-clean-arch` | Escribe `/review-clean-arch` | Debe analizar dependencias entre capas |
| Skill testing | Pide "crea tests para el use case X" | Debe usar patron AAA con mocks |
| BCPR Architect | Seleccionalo y pregunta algo de arquitectura | Debe buscar en codebase y referenciar archivos |

---

### Paso 1.8: Comparar "Antes vs Despues"

Ahora repetimos **exactamente el mismo prompt** del Paso 1.0:

```
Crea un use case llamado ListNotificationsUseCase en
features/notification/application/usecases/list-notifications-use-case.ts
```

**Compara con el resultado del Paso 1.0.** Ahora Copilot deberia:
- Usar `@Injectable()` de `injection-js` (por las instrucciones globales)
- Inyectar un Port via `@Inject(IReadNotificationsPortProvider)` (por las instrucciones de usecases)
- Incluir logging con `this.logger.info('Event started: ...')` (por las instrucciones de usecases)
- Seguir la nomenclatura del proyecto (por las instrucciones globales)
- Referenciar el archivo de ejemplo `src/examples/example-use-case.ts` como patron

> **Este es el momento wow real.** El mismo prompt, resultados completamente diferentes. Eso es lo que las instrucciones hacen por el equipo, sin esfuerzo extra en cada prompt.

**Deshaz los cambios** antes de pasar al Ejercicio 2.

---

## Ejercicio 2: Construir un Feature Nuevo con el Marco (45 min)

> **Ahora usamos lo que construimos.** En lugar de escribir boilerplate, dejamos que nuestros prompts, instrucciones y agents hagan el trabajo pesado.

### Objetivos

- Usar `/new-feature` para scaffoldear la estructura completa
- Refinar cada capa usando las instrucciones automaticas
- Integrar con el core existente (DI, providers)
- Usar el agente BCPR Architect para resolver dudas de diseno

---

### Paso 2.1: Scaffold del feature con /new-feature

Este es el momento de la verdad -- probamos el prompt file que creamos.

**Escribe en Copilot Chat:**

```
/new-feature notification
```

Copilot deberia generar toda la estructura del feature de notificaciones con:
- Entidades de dominio
- Ports con InjectionTokens
- Use cases con logging
- Adapter en memoria con datos de ejemplo
- Converter
- Controller con endpoints REST (GET, POST, PATCH)
- ViewModels y Arguments
- Provider de DI

> **Momento wow:** Un solo comando genera 12+ archivos que siguen toda la arquitectura del proyecto. Las instrucciones por capa que configuramos aseguran que cada archivo siga sus reglas.

> **Si el scaffold no es perfecto**, no te preocupes. Los pasos siguientes refinan cada capa.

---

### Paso 2.2: Refinar la capa Domain

Revisa lo que genero Copilot y ajusta si falta algo.

**PROMPT (nota lo corto que es -- las instrucciones de `domain-layer.instructions.md` hacen el trabajo):**

```
@workspace Revisa los archivos en features/notification/domain/.
La entidad Notification necesita: enums para tipo (PUSH/EMAIL/SMS)
y status (UNREAD/READ/ARCHIVED), metodos markAsRead(), archive(),
isRead(), y las propiedades basicas de una notificacion.
```

> **Observa:** No necesitas especificar "no uses @Injectable" ni "no importes Express" -- las instrucciones de domain-layer ya se lo dicen a Copilot automaticamente. **Esa es la ventaja del marco.**

---

### Paso 2.3: Refinar la capa Application (Ports + Use Cases)

**PROMPT (las instrucciones de `usecases-layer.instructions.md` agregan el logging y DI automaticamente):**

```
@workspace Revisa los ports y use cases en features/notification/application/.
Necesito 2 ports (ReadNotificationsPort y WriteNotificationPort) y
3 use cases: listar por usuario, crear, y marcar como leida
(lanzar NotFoundError si no existe).
```

> **Observa:** No necesitas decir "@Injectable, @Inject, logging al inicio/fin" -- las instrucciones por capa ya lo cubren. Si Copilot los omite, pregunta: "Las instrucciones de usecases-layer dicen que el logging es obligatorio, puedes agregarlo?"

---

### Paso 2.4: Refinar la capa Infrastructure

**PROMPT:**

```
@workspace Revisa la infraestructura en features/notification/infrastructure/.
El adapter debe usar Map en memoria con 5 notificaciones realistas
de ejemplo (transferencias, estados de cuenta, codigos SMS).
El controller necesita 3 endpoints: GET por userId, POST crear, PATCH marcar leida.
```

> **Observa:** Las instrucciones de `adapters-layer.instructions.md` y `controllers-layer.instructions.md` aseguran que el adapter implemente los ports y que el controller use `registerRoutes(router)` con validacion de class-validator.

---

### Paso 2.5: Presentation (ViewModels y Arguments)

**PROMPT:**

```
@workspace Revisa los archivos de presentacion en features/notification/presentation/.
El ViewModel necesita las propiedades de la notificacion mas un campo
isRead boolean. Los Arguments del POST necesitan validacion con class-validator.
```

---

### Paso 2.6: Registrar en el Container DI y conectar rutas

> **Este paso conecta todo.** Sin esto, el feature existe pero no responde a requests.

**PROMPT en Modo Agent:**

```
@workspace Integra el feature de notificaciones con el core. Necesito 3 cambios:

1. Crea core/injection/providers/notification-provider.ts
   Con el array notificationDependencies que incluya:
   - Use cases: ListNotificationsUseCase, CreateNotificationUseCase, MarkAsReadUseCase
   - Adapter mapping:
     { provide: IReadNotificationsPortProvider, useClass: NotificationMemoryAdapter }
     { provide: IWriteNotificationPortProvider, useClass: NotificationMemoryAdapter }
   - Converter: NotificationViewModelConverter con su token
   - Controller: NotificationController

2. Modifica core/injection/injector.ts:
   - Importa notificationDependencies del nuevo provider
   - Agrega ...notificationDependencies al array de ReflectiveInjector.resolveAndCreate

3. Modifica core/server/app.ts:
   - Importa el injector y NotificationController
   - Obtiene la instancia del controller via injector.get(NotificationController)
   - Crea un Router, registra las rutas con controller.registerRoutes(router)
   - Monta el router con app.use(router) ANTES del errorInterceptor
```

> **Importante:** Los archivos `injector.ts` y `app.ts` ya tienen comentarios-guia que indican exactamente donde hacer los cambios. Busca los comentarios que empiezan con `// Los participantes...`

---

### Checkpoint: Verificar que funciona

> **No te saltes este paso.** Copilot genera codigo, pero nosotros verificamos que funcione.

**En la terminal:**

```bash
# 1. Verificar que compila sin errores
npx tsc --noEmit

# 2. Arrancar el servidor
npm run dev
```

**En otra terminal (o usa la de VS Code):**

```bash
# 3. Health check
curl http://localhost:3000/health

# 4. Listar notificaciones (debe retornar las del seed)
curl http://localhost:3000/api/notifications/user-001

# 5. Crear una notificacion
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-001","title":"Test","message":"Desde el workshop","type":"PUSH"}'

# 6. Marcar como leida
curl -X PATCH http://localhost:3000/api/notifications/notif-002/read
```

**Que esperar:**
- Paso 1: Sin errores de TypeScript
- Paso 4: JSON con array de notificaciones (`success: true`)
- Paso 5: 201 con la notificacion creada
- Paso 6: 200 con status "READ"

**Si algo falla**, usa Copilot para arreglarlo:
```
@workspace El servidor da este error: [pega el error].
Revisa el feature de notificaciones y corrigelo.
```

> **Este es el flujo real:** generar con IA -> verificar -> iterar si falla. Copilot no es perfecto, pero **iterar con el es rapido.**

---

### Paso 2.7: Consultar al Arquitecto (demo del agent)

Selecciona **"BCPR Architect"** del dropdown de agentes y preguntale:

```
Revisa el feature de notificaciones que acabamos de crear.
Sigue correctamente la arquitectura del proyecto?
Falta algo para que este listo para produccion?
```

> **Observa:** El agente busca en el codebase, compara con los patrones del core, y te da feedback concreto. Si detecta problemas, ofrece el boton "Implementar este diseno" para corregirlos.

---

### Paso 2.8: Experimentar Tab Completions (uso diario)

> **El 80% de tu interaccion diaria con Copilot no es Chat -- es Tab.** Vamos a practicarlo.

1. **Crea un archivo nuevo** en `features/notification/application/usecases/` llamado `delete-notification-use-case.ts`

2. **Escribe solo esto** (no copies, escribe letra por letra):
   ```typescript
   import { Injectable, Inject } from 'injection-js';
   ```

3. **Presiona Enter** y espera -- Copilot deberia sugerir el siguiente import (`AbstractLogger`). Presiona `Tab` para aceptar.

4. **Sigue escribiendo** el nombre de la clase:
   ```typescript
   @Injectable()
   export class DeleteNotificationUseCase {
   ```

5. **Observa** como Copilot autocompleta:
   - El constructor con las dependencias inyectadas
   - El metodo `execute()` con logging
   - Los tipos correctos de los ports

6. **Acepta con Tab** lo que este bien, **ignora con Esc** lo que no, y **edita** lo que necesite ajuste.

> **Tips de Tab completions:**
> - `Tab` = aceptar toda la sugerencia
> - `Ctrl+→` (o `Cmd+→`) = aceptar palabra por palabra
> - `Alt+]` / `Alt+[` = ver sugerencias alternativas
> - `Esc` = rechazar

> **Clave:** Las instrucciones de `usecases-layer.instructions.md` mejoran las sugerencias Tab tambien, no solo las del Chat. Por eso vale la pena mantener las instrucciones actualizadas.

---

### Paso 2.9: Desafio Bonus -- Preferencias de Notificacion

> **Opcional** para quienes terminaron rapido.

```
/new-feature notification-preference
```

O manualmente:

```
@workspace Crea un sub-feature de preferencias de notificacion
dentro de features/notification/, siguiendo los patrones del feature
principal. Campos: userId, pushEnabled, emailEnabled, smsEnabled,
quietHoursStart, quietHoursEnd. El adapter guarda en memoria.
Incluye use cases GetPreferences y UpdatePreferences.
```

### Troubleshooting Ejercicio 2

| Problema | Solucion |
|----------|----------|
| `/new-feature` no genera todo | Ejecuta de nuevo o genera por partes con los prompts individuales |
| Imports incorrectos | Usa `@workspace` para que Copilot vea las rutas reales |
| Decoradores faltantes | Las instrucciones por capa deberian prevenirlo; si no, pide "agrega @Injectable y @Inject segun el patron" |
| Controller no sigue el patron | Referencia explicitamente: "sigue el patron de notification-controller.ts" |

---

## Ejercicio 3: Tests y Validacion con el Agente QA (25 min)

> **Aqui usamos el skill de testing y el agente QA** que creamos en el Ejercicio 1.

### Objetivos

- Generar tests usando el skill bcpr-testing
- Validar la arquitectura con el agente QA
- Practicar `/tests` y `/fix`

---

### Paso 3.1: Generar tests unitarios con el skill

El skill `bcpr-testing` deberia activarse automaticamente al pedir tests.

**Abre el archivo del use case principal y selecciona todo el contenido, luego:**

**PROMPT:**

```
/tests Genera tests unitarios completos para este use case.
Cubre: happy path, usuario sin notificaciones, error del port.
Usa mocks para todas las dependencias inyectadas.
```

> **Observa:** Si el skill se cargo correctamente, los tests seguiran el patron AAA con mocks del port, logger y converter -- sin que tengas que especificarlo.

---

### Paso 3.2: Tests para la entidad de dominio

**Abre `notification.ts` (dominio) y:**

```
/tests Genera tests para esta entidad de dominio.
Cubre: markAsRead, archive, isRead, crear con defaults.
NO mockees nada -- las entidades de dominio son puras.
```

---

### Paso 3.3: Tests del adapter

```
/tests Genera tests de integracion para el NotificationController.
Usa supertest contra la app real (createApp()).
Cubre: GET lista notificaciones, GET usuario sin datos,
POST crear notificacion, POST datos invalidos, PATCH marcar como leida, PATCH 404.
```

---

### Paso 3.4: Validacion con el Agente QA

Selecciona **"BCPR QA"** del dropdown de agentes:

```
Revisa todo el feature de notificaciones:
- Hay bugs o edge cases no manejados?
- Los tests cubren los escenarios criticos?
- Se violan patrones de arquitectura?
- Hay datos sensibles expuestos en logs?
```

> **Momento wow:** El agente QA revisa sistematicamente, reporta por severidad, y si encuentra problemas, ofrece "Corregir problemas" para arreglarlos.

---

### Paso 3.5: Revision de arquitectura con el prompt

```
/review-clean-arch
```

Este prompt verifica las dependencias entre capas y que todos los patrones se cumplan.

---

### Paso 3.6: Correr los tests

```bash
npm test
```

**Que esperar:**
- Tests unitarios: use cases con mocks pasan
- Tests de entidad: logica de dominio pura pasa
- Tests de integracion: endpoints responden correctamente con supertest

**Si algun test falla**, usa Copilot:
```
@workspace Este test falla con el error: [pega el error]. Corrigelo.
```

O usa `/fix` seleccionando el codigo del test que falla.

> **Tip:** El feedback loop completo es: generar test con Copilot -> correr `npm test` -> si falla, pegar el error en Copilot -> iterar. Con practica, este ciclo toma segundos.

---

### Paso 3.7: Validacion E2E visual con Playwright CLI

> **El objetivo:** Pedirle a Copilot que genere tests E2E y verlos correr en un browser real con `--headed`.

**1. Instalar Playwright (si no esta):**

```bash
npm init playwright@latest -- --yes --quiet
```

Esto crea `playwright.config.ts` y descarga los browsers.

**2. Pedirle a Copilot los tests E2E:**

```
@workspace Genera tests E2E con Playwright para el feature de notificaciones.
Usa request context (APIRequestContext) para testear los 3 endpoints:
- GET /api/notifications/:userId (con datos y vacio)
- POST /api/notifications (valido e invalido)
- PATCH /api/notifications/:id/read (existente y 404)
El server corre en localhost:3000. Guarda en tests/e2e/notifications.spec.ts
```

**3. Correr visualmente:**

```bash
# Modo headed - ves el browser abrirse
npx playwright test --headed

# Modo UI - interfaz interactiva con step-through
npx playwright test --ui

# Modo debug - pausa en cada paso para inspeccionar
npx playwright test --debug
```

**4. Ver el reporte HTML:**

```bash
npx playwright show-report
```

> **Observa:** `--headed` abre el browser para que veas la ejecucion. `--ui` es aun mejor: te muestra cada request, response, y puedes hacer step-by-step. Para APIs sin frontend, Playwright usa `request` context internamente, pero `--ui` te visualiza todo el flujo de requests.

**5. Bonus: Grabar un test con codegen (para features con UI):**

```bash
# Si tu feature tuviera frontend, podrias grabar tests asi:
npx playwright codegen http://localhost:3000
```

Esto abre dos ventanas: el browser donde interactuas y el Inspector que genera el codigo del test en tiempo real.

> **Clave para el equipo BCPR:** Cuando un feature tenga frontend, pueden decirle a Copilot: "Genera tests E2E con Playwright para [feature]. Usa --headed para validacion visual." El skill de testing deberia incluir estos patrones.

---

### Troubleshooting Ejercicio 3

| Problema | Solucion |
|----------|----------|
| Skill no se activa | Verifica que `.github/skills/bcpr-testing/SKILL.md` exista con el nombre correcto |
| Tests no siguen el patron | Referencia explicitamente: "sigue el patron del skill bcpr-testing" |
| Agente QA no aparece | Verifica `.github/agents/bcpr-qa.agent.md` con extension correcta |
| `reflect-metadata` error en tests | Agrega `import 'reflect-metadata'` al inicio del test |

---

## Ejercicio 4: QA Completo — Caza de Bugs, Test Plan y Datos (30 min)

> **Este ejercicio enseña a usar Copilot como herramienta de QA**, no solo de generacion. Inspirado en el enfoque de [workshop-githubcopilot-qa](https://github.com/armandoblanco/workshop-githubcopilot-qa).

### Objetivos

- Diseñar un plan de pruebas funcional usando Copilot
- Encontrar bugs en codigo "generado por AI" usando el agente QA
- Generar datos de prueba realistas con edge cases
- Hacer testing exploratorio guiado por AI
- Producir un reporte de calidad

---

### Paso 4.1: Diseñar un Plan de Pruebas con Copilot (5 min)

El primer paso de QA profesional no es escribir tests — es **diseñar un plan de pruebas**. Copilot puede ayudar.

**PROMPT (Modo Ask):**

```
@workspace Actua como QA Lead. Diseña un plan de pruebas funcional
para el feature de notificaciones que acabamos de construir.

Usa como template: src/examples/qa-test-plan-template.md

Incluye:
- Casos de prueba positivos (happy path)
- Casos de prueba negativos (validacion, errores)
- Edge cases (limites, estados invalidos)
- Casos de seguridad basica (IDOR, datos sensibles en logs)
- Datos de prueba especificos para cada caso

Genera al menos 8 casos de prueba con prioridad Alta o Media.
Guarda el resultado en: docs/test-plan-notifications.md
```

> **Observa:** Copilot genera un plan estructurado, no codigo. Este plan es el **contrato de calidad** que guia todo el testing. En el harness engineering, esto seria la "Fase 2: Destilacion".

**Evalua el plan generado:**
- ¿Los casos son especificos o genericos?
- ¿Cubren los 3 endpoints en sus 7 escenarios (GET lista, GET vacio, POST valido, POST invalido tipo, POST sin campos, PATCH read, PATCH 404)?
- ¿Incluyen edge cases reales (userId vacio, notificationId inexistente, tipo invalido)?
- ¿Mencionan seguridad (datos sensibles en logs, IDOR)?

Si el plan es muy generico, refuerza:

```
Los casos CP-003 y CP-005 son muy genericos. Hazlos especificos
al proyecto BCPR: usa los InjectionTokens reales, los enums
NotificationType y NotificationStatus, y los endpoints exactos
del controller.
```

---

### Paso 4.2: Reto de Caza de Bugs — "El Codigo que se Ve Bien" (10 min)

> **La trampa de la AI:** el codigo generado por AI se ve pulido, esta bien formateado, y compila sin errores. Eso baja tu guardia. Pero puede tener bugs sutiles que solo un review critico detecta.

Tenemos un archivo con **6 bugs intencionales** que simulan errores tipicos de codigo generado por AI.

**Paso 1: Intenta encontrar bugs tu mismo (2 min)**

Abre `src/examples/qa-challenge-buggy-code.ts` y leelo rapidamente. ¿Cuantos bugs encuentras a simple vista?

> La mayoria de developers encuentran 1-2 en una lectura rapida. Son bugs que "se ven correctos" — exactamente el tipo que la AI genera.

**Paso 2: Pide ayuda a Copilot (3 min)**

```
@workspace Analiza src/examples/qa-challenge-buggy-code.ts como
un revisor de codigo senior. Busca:
- Logica incorrecta o invertida
- Validaciones faltantes
- Edge cases no manejados
- Vulnerabilidades de seguridad
- Calculos matematicos incorrectos
- Transiciones de estado invalidas

Reporta cada bug con: ubicacion, severidad, descripcion, y fix sugerido.
```

**Paso 3: Lanza al agente QA (3 min)**

Selecciona **"BCPR QA"** del dropdown:

```
Revisa src/examples/qa-challenge-buggy-code.ts como si fuera
codigo generado por AI que un developer te pide aprobar.

Aplica los criterios del skill bcpr-testing:
- ¿Las transiciones de estado son correctas?
- ¿Las validaciones son suficientes?
- ¿Hay problemas de seguridad?
- ¿Los calculos son correctos?

Reporta por severidad: Bloqueante / Alto / Medio / Bajo.
```

**Paso 4: Compara resultados (2 min)**

| Metodo | Bugs encontrados (tipico) |
|--------|---------------------------|
| Lectura manual rapida | 1-2 de 6 |
| Copilot Chat `@workspace` | 4-5 de 6 |
| Agente BCPR QA | 5-6 de 6 |
| Los tres combinados | **6 de 6** |

> **Leccion clave:** Ningun metodo solo encuentra todo. El loop es: **revisar → AI analiza → QA agent audita → humano decide**. Es el mismo principio del harness: capas de verificacion.

<details>
<summary><strong>Spoiler: Los 6 Bugs</strong> (no abras hasta intentar)</summary>

1. **resolve() sin validar CLOSED** — Un ticket cerrado puede "resolverse" de vuelta. Deberia lanzar error si status === CLOSED.
2. **close() sin validar RESOLVED** — Un ticket OPEN puede cerrarse directamente, saltandose el flujo OPEN→RESOLVED→CLOSED.
3. **isHighPriority() excluye CRITICAL** — CRITICAL es mas alto que HIGH pero el metodo retorna false para tickets criticos.
4. **execute() no valida userId** — Si userId es vacio, undefined, o null, ejecuta la query sin error. Deberia validar.
5. **Calculo de ageInDays es ageInHours** — Divide entre `1000 * 60 * 60` (ms→horas) en vez de `1000 * 60 * 60 * 24` (ms→dias).
6. **IDOR en el controller** — Toma userId del query param sin validar contra el usuario autenticado. Cualquiera puede ver tickets de otro usuario.

</details>

---

### Paso 4.3: Generar Datos de Prueba Realistas (5 min)

Los tests son tan buenos como sus datos. Copilot puede generar datasets que cubren edge cases que no pensarias.

**PROMPT:**

```
@workspace Genera un archivo de datos de prueba para el feature
de notificaciones en: src/features/notification/tests/test-data.ts

Incluye:
- 5 notificaciones validas con diferentes tipos (EMAIL, PUSH, SMS)
  y estados (UNREAD, READ, ARCHIVED)
- 3 conjuntos de datos invalidos para crear notificaciones
  (sin titulo, sin userId, tipo invalido)
- Datos con caracteres especiales: acentos (ñ, á, é), emojis,
  caracteres HTML (<script>), y SQL injection ('; DROP TABLE --)
- Un userId con formato UUID y uno con formato legacy "user-XXX"
- Fechas edge: notificacion de hoy, de hace 1 ano, fecha futura

Exporta como constantes tipadas que se puedan importar en los tests.
```

> **Por que esto importa:** Los datos genericos ("test1", "test2") no encuentran bugs. Los datos realistas con caracteres especiales, fechas limite, y formatos mixtos **si** los encuentran.

**Evalua los datos generados:**
- ¿Incluyo realmente los caracteres especiales o los "sanitizo"?
- ¿Las fechas edge son reales (Date objects) o strings?
- ¿Los datos invalidos son invalidos de formas diferentes?

---

### Paso 4.4: Testing Exploratorio Guiado por AI (5 min)

Testing exploratorio = probar el sistema buscando comportamiento inesperado, sin un script fijo.

Con el server corriendo (`npm run dev`), usa Copilot como copiloto de exploracion:

**PROMPT:**

```
@workspace El server esta corriendo en localhost:3000. Actua como
un tester exploratorio. Sugiereme 10 requests curl que podrian
exponer bugs o comportamiento inesperado en el API de notificaciones.

Piensa en:
- Que pasa con payloads enormes?
- Que pasa con Content-Type incorrecto?
- Que pasa con metodos HTTP no soportados?
- Que pasa con caracteres unicode en el userId?
- Que pasa si envio campos extra no esperados?
```

**Ejecuta los curls sugeridos y observa:**

```bash
# Ejemplo: payload con campo extra (¿lo ignora o lo rechaza?)
curl -s -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-001","title":"Test","message":"Msg","type":"PUSH","admin":true}'

# Ejemplo: Content-Type incorrecto
curl -s -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: text/plain" \
  -d '{"userId":"user-001","title":"Test","message":"Msg","type":"PUSH"}'

# Ejemplo: metodo no soportado
curl -s -X DELETE http://localhost:3000/api/notifications/notif-001

# Ejemplo: userId con caracteres especiales
curl -s http://localhost:3000/api/notifications/user-%3Cscript%3E
```

> **Insight:** Copilot no solo genera tests — puede **pensar como un atacante** y sugerir vectores de prueba que un developer no consideraria.

---

### Paso 4.5: Reporte de Calidad (5 min)

Finalmente, genera un reporte consolidado de todo el QA realizado.

**PROMPT (Agente BCPR QA):**

```
Genera un reporte de calidad del feature de notificaciones que incluya:

1. RESUMEN EJECUTIVO: estado general del feature (listo / con riesgos / bloqueado)
2. COBERTURA DE TESTS:
   - Tests unitarios: cuantos, que cubren
   - Tests de integracion: cuantos, que endpoints
   - Edge cases cubiertos vs faltantes
3. BUGS ENCONTRADOS: lista con severidad y estado (fijo / pendiente)
4. DEUDA DE QA: que falta por probar (performance, concurrencia, datos masivos)
5. RECOMENDACIONES: top 3 mejoras de calidad priorizadas

Formato: markdown estructurado, listo para agregar al PR.
Guarda en: docs/qa-report-notifications.md
```

> **Para llevar:** Este reporte es lo que adjuntas a un PR. Con el agente QA y Copilot, generarlo toma 5 minutos en vez de una hora.

---

### Troubleshooting Ejercicio 4

| Problema | Solucion |
|----------|----------|
| El plan de pruebas es muy generico | Agrega contexto: "para el proyecto BCPR con injection-js y Express" |
| Copilot no encuentra los 6 bugs | Usa prompts mas especificos: "busca bugs de seguridad" + "busca bugs de logica" por separado |
| Los datos generados no tienen caracteres especiales | Insiste: "DEBES incluir estos caracteres exactos: ñ, á, <script>, '; DROP TABLE" |
| El reporte es superficial | Agrega: "incluye lineas de codigo especificas y numeros de test" |

---

### Resumen del Ejercicio 4

| Actividad | Que aprendieron | Herramienta |
|-----------|-----------------|-------------|
| Plan de pruebas | QA empieza con diseño, no con codigo | Copilot Ask + template |
| Caza de bugs | El codigo "bonito" puede tener bugs sutiles | Copilot + Agente QA |
| Datos de prueba | Datos genericos no encuentran bugs | Copilot Agent |
| Testing exploratorio | Pensar como atacante, no como developer | Copilot + curl |
| Reporte de calidad | Documentar QA para el PR | Agente BCPR QA |

> **La leccion:** Copilot no es solo para **generar** codigo y tests. Es una herramienta de **QA completo**: diseño de pruebas, revision de codigo, generacion de datos, testing exploratorio, y reportes. El agente BCPR QA es el multiplicador — le da al equipo un "QA Lead virtual" que conoce los patrones del proyecto.

---

## Referencia Rapida

### Los 5 Niveles de Personalizacion

| Nivel | Archivo | Extension | Se activa... |
|-------|---------|-----------|-------------|
| Instrucciones globales | `.github/copilot-instructions.md` | `.md` | Siempre |
| Instrucciones por archivo | `.github/instructions/` | `*.instructions.md` | Segun `applyTo` glob |
| Prompt files | `.github/prompts/` | `*.prompt.md` | Al escribir `/nombre` |
| Skills | `.github/skills/<nombre>/` | `SKILL.md` | Automaticamente si aplica |
| Custom Agents | `.github/agents/` | `*.agent.md` | Al seleccionarlos del dropdown |

### Comandos de Scaffolding

| Comando | Que genera |
|---------|-----------|
| `/init` | `copilot-instructions.md` inicial |
| `/create-instruction` | Archivo de instrucciones |
| `/create-prompt` | Prompt file |
| `/create-skill` | Agent Skill |
| `/create-agent` | Custom Agent |

### Nuestros Prompts Custom

| Comando | Que hace |
|---------|---------|
| `/new-feature <nombre>` | Scaffold completo con 12+ archivos |
| `/new-usecase <nombre>` | Use case + test unitario |
| `/review-clean-arch` | Audit de arquitectura limpia |

### Nuestros Agents Custom

| Agent | Rol | Cuando usarlo |
|-------|-----|--------------|
| BCPR Architect | Disena, revisa arquitectura, explica decisiones | Antes de implementar algo nuevo o complejo |
| BCPR QA | Revisa codigo, genera tests, verifica patrones | Despues de implementar, antes de PR |

### Atajos de Teclado

| Atajo | Accion |
|-------|--------|
| `Ctrl+I` / `Cmd+I` | Copilot inline |
| `Ctrl+Shift+I` / `Cmd+Shift+I` | Panel de Copilot Chat |
| `Tab` | Aceptar sugerencia |
| `Esc` | Rechazar sugerencia |
| `Alt+]` / `Alt+[` | Siguiente / anterior sugerencia |

### Tips para el Equipo BCPR

| Tip | Ejemplo |
|-----|---------|
| Referenciar archivos existentes | "Sigue el patron de notification-controller.ts" |
| Usar @workspace siempre | "@workspace crea un adapter similar al de notification" |
| Especificar la capa | "En la capa application, crea un use case..." |
| Mencionar DI | "Usa @Injectable() e inyecta el port con @Inject(Token)" |
| Pedir logging | "Incluye logging al inicio y fin de execute()" |

---

## Checklist Final del Workshop

### Marco de Copilot (Ejercicio 1) -- esto se commitea al repo

- [ ] `.github/copilot-instructions.md` -- Reglas globales del proyecto
- [ ] `.github/instructions/domain-layer.instructions.md`
- [ ] `.github/instructions/usecases-layer.instructions.md`
- [ ] `.github/instructions/adapters-layer.instructions.md`
- [ ] `.github/instructions/controllers-layer.instructions.md`
- [ ] `.github/prompts/new-feature.prompt.md`
- [ ] `.github/prompts/new-usecase.prompt.md`
- [ ] `.github/prompts/review-clean-arch.prompt.md`
- [ ] `.github/skills/bcpr-testing/SKILL.md`
- [ ] `.github/agents/bcpr-architect.agent.md`
- [ ] `.github/agents/bcpr-qa.agent.md`

### Feature de Notificaciones (Ejercicio 2)

**Domain**
- [ ] `features/notification/domain/notification-type.ts`
- [ ] `features/notification/domain/entities/notification.ts`

**Application**
- [ ] `features/notification/application/ports/read-notifications-port.ts`
- [ ] `features/notification/application/ports/write-notification-port.ts`
- [ ] `features/notification/application/usecases/list-notifications-use-case.ts`
- [ ] `features/notification/application/usecases/create-notification-use-case.ts`
- [ ] `features/notification/application/usecases/mark-as-read-use-case.ts`

**Infrastructure**
- [ ] `features/notification/infrastructure/adapter/notification-memory-adapter.ts`
- [ ] `features/notification/infrastructure/converter/notification-view-model-converter.ts`
- [ ] `features/notification/infrastructure/controller/notification-controller.ts`

**Presentation**
- [ ] `features/notification/presentation/view-models/notification-view-model.ts`
- [ ] `features/notification/presentation/arguments/create-notification-arguments.ts`

**DI**
- [ ] `core/injection/providers/notification-provider.ts`

### Tests (Ejercicio 3)

- [ ] Tests unitarios del use case principal (list, mark-as-read)
- [ ] Tests de la entidad de dominio (markAsRead, archive, isRead)
- [ ] Tests de integracion del controller (supertest, endpoints CRUD)
- [ ] Revision QA completada
- [ ] Revision de arquitectura con `/review-clean-arch`
- [ ] Tests E2E con Playwright (`npx playwright test --headed` pasa)

### QA Completo (Ejercicio 4)

- [ ] Plan de pruebas funcional generado (`docs/test-plan-notifications.md`)
- [ ] Reto de caza de bugs completado (6/6 encontrados)
- [ ] Datos de prueba realistas generados (con caracteres especiales, edge cases)
- [ ] Testing exploratorio ejecutado (curls con payloads inesperados)
- [ ] Reporte de calidad generado (`docs/qa-report-notifications.md`)

---

## Bonus: Introduccion a Harness Engineering

> **Nivel avanzado.** Este concepto va mas alla de Copilot -- aplica a cualquier AI coding assistant (Claude Code, Cursor, Copilot, etc.). Si el tiempo lo permite, el instructor puede presentarlo como cierre conceptual.

### Que es Harness Engineering?

En los Ejercicios 1-3 aprendimos a **personalizar** la AI con instrucciones, prompts y agents. Pero hay un problema: la AI genera codigo facil y rapido... y eso es precisamente el riesgo. **Generar no es el cuello de botella -- validar lo es.**

**Harness Engineering** (o Spec-Driven Development con AI) es una disciplina que trata a la AI como un **craftsman junior**: talentoso pero que necesita un pipeline riguroso para garantizar calidad. En vez de confiar en que la AI "lo hara bien", construimos un **harness** (arnes) que:

1. **Fuerza especificacion ANTES de codigo** -- no se escribe ni una linea sin un contrato aprobado
2. **Usa multiples agentes especializados** -- cada uno con un rol estricto y sin solapamiento
3. **Tiene exactamente UN punto de aprobacion humana** -- y esta en el lugar de maximo leverage
4. **Valida con mutacion, no con cobertura** -- la cobertura dice "se ejecuto", la mutacion dice "los tests realmente detectan bugs"

> **Referencia:** [betta-tech/harness-sdd](https://github.com/betta-tech/harness-sdd/tree/uncle-bob-harness) -- implementacion inspirada en los principios de Robert C. Martin (Uncle Bob).

---

### El Pipeline: 5 Fases, 1 Puerta

```
 CONVERSACION       DESTILACION        PUERTA          TDD ESTRICTO       REVIEW +
 (Spec Partner)     (Gherkin Author)   HUMANA          (Craftsman)         MUTACION
                                                                          (Judge)
 ┌──────────┐      ┌──────────┐      ┌────────┐      ┌──────────┐      ┌──────────┐
 │ Debatir  │ ──>  │ Traducir │ ──>  │ Humano │ ──>  │ Rojo ->  │ ──>  │ Revisar  │
 │ el spec  │      │ a Gherkin│      │ aprueba│      │ Verde -> │      │ + Mutar  │
 │          │      │ .feature │      │ o pide │      │ Refactor │      │ tests    │
 └──────────┘      └──────────┘      │ cambios│      └──────────┘      └──────────┘
                                     └────────┘
 project-spec.md   features/*.feature   ⏸ STOP       src/ + tests/     progress/*.md
```

**Por que este orden?**

- Corregir un spec cuesta minutos. Corregir codigo cuesta horas.
- La puerta humana esta ANTES del codigo, donde el costo de cambio es minimo.
- Despues de la puerta, la AI trabaja autonomamente con TDD estricto.

---

### Los 5 Roles del Harness (como se mapean a BCPR)

| Rol en Harness | Que hace | Equivalente BCPR (lo que ya creamos) |
|---|---|---|
| **Spec Partner** | Debate el spec contigo, produce `project-spec.md` | Modo Ask + `@workspace` (Paso 1.1) |
| **Gherkin Author** | Traduce el spec a contratos ejecutables (`.feature`) | `/review-clean-arch` (verifica contratos) |
| **Craftsman (TDD)** | Escribe test -> codigo -> refactor, uno a la vez | Modo Agent + skill `bcpr-testing` |
| **Judge** | Revisa el codigo, rechaza lo que no fue pedido o no esta testeado | Agente **BCPR QA** |
| **Mutation Tester** | Inyecta defectos al codigo y verifica que los tests los detecten | `npm test` + Stryker (avanzado) |

> **Insight:** Ya tienen 3 de los 5 roles implementados. Lo que falta es **el pipeline** (el orden disciplinado) y **la puerta humana** (aprobar el spec antes de codear).

---

### Principio Clave: El Estado Vive en Disco, No en el Chat

En el workshop usamos prompts en el chat. Pero los chats se pierden, los context windows se llenan, las sesiones se cortan. El harness resuelve esto:

```
progress/
├── spec_notification.md          # Spec negociado (que, por que, alcance)
├── tdd_notification.md           # Lineage: que test genero que codigo
├── judge_notification.md         # Veredicto del review
└── mutation_notification.md      # Score de mutacion + sobrevivientes
```

**Cada fase escribe su resultado en un archivo.** Si la sesion se cae, el siguiente agente lee el archivo y continua. No hay "telefono descompuesto" entre agentes.

> **Aplicacion practica para BCPR:** En vez de confiar en que el chat recuerde el contexto, guarden las decisiones de arquitectura en archivos de progreso. El agente BCPR Architect puede escribir `progress/design_<feature>.md` antes de que el TDD Craftsman empiece a codear.

---

### Demo Rapida: Un Ciclo de Harness para Notificaciones

Si tuvieramos el harness completo, el flujo para agregar "eliminar notificacion" seria:

**Fase 1 -- Spec Partner (Modo Ask):**
```
@workspace Quiero agregar la funcionalidad de eliminar una notificacion
por ID. Debatamos: que pasa si no existe? Debe ser soft delete o hard
delete? Que responde el endpoint? Escribe el resultado en progress/spec_delete-notification.md
```

**Fase 2 -- Gherkin Author (Modo Agent):**
```
@workspace Lee progress/spec_delete-notification.md y genera el contrato
en features/delete-notification.feature usando formato Gherkin:
  Scenario: eliminar notificacion existente -> 200
  Scenario: eliminar notificacion inexistente -> 404
  Scenario: eliminar notificacion ya archivada -> 422
```

**Fase 3 -- Puerta Humana:** Tu lees el `.feature`, apruebas o pides cambios. **NINGUN codigo se escribe hasta que apruebes.**

**Fase 4 -- TDD Craftsman (Modo Agent):**
```
@workspace Lee features/delete-notification.feature. Para cada scenario,
sigue el ciclo Rojo-Verde-Refactor:
1. Escribe el test que falla (ROJO)
2. Escribe el minimo codigo para que pase (VERDE)
3. Refactoriza sin romper tests
Documenta cada ciclo en progress/tdd_delete-notification.md
```

**Fase 5 -- Judge (Agente BCPR QA):**
```
@BCPR QA Lee progress/tdd_delete-notification.md y el codigo generado.
Verifica: hay codigo sin test? Hay test sin scenario? Se violan patrones?
Escribe el veredicto en progress/judge_delete-notification.md
```

---

### Cuando Usar Cada Enfoque

| Situacion | Enfoque | Por que |
|---|---|---|
| Fix rapido, bug conocido | Copilot directo (prompt + `/fix`) | Bajo riesgo, no necesita spec |
| Feature nuevo, alcance claro | Marco BCPR (Ej. 1-3 del workshop) | Las instrucciones + agents cubren |
| Feature complejo, multiples edge cases | **Harness completo** | Necesitas spec negociado + contratos + TDD |
| Onboarding de dev nuevo | Modo Ask + Architect agent | Exploracion, no generacion |
| Refactor grande, muchos archivos | Harness con Judge estricto | El Judge rechaza cambios no pedidos |

---

### Las 3 Leyes del TDD en el Harness

Robert C. Martin (Uncle Bob) define 3 reglas que el harness impone:

1. **No escribas codigo de produccion excepto para hacer pasar un test que falla**
2. **No escribas mas de un test unitario que sea suficiente para fallar** (errores de compilacion cuentan como fallo)
3. **No escribas mas codigo de produccion del necesario para pasar el test actual**

> **Por que esto importa con AI:** La AI tiende a generar codigo "de mas" -- features no pedidos, edge cases inventados, abstracciones prematuras. Las 3 leyes la frenan: solo genera lo que un test demanda.

---

### Para Llevar: Harness Engineering en 1 Minuto

```
SIN HARNESS:
  "AI, crea el feature" → codigo → (esperamos que este bien) → bugs en produccion

CON INSTRUCCIONES (lo que hicimos hoy):
  "AI, crea el feature" → instrucciones guian → codigo mejor → tests → verificar

CON HARNESS COMPLETO:
  spec negociado → contrato aprobado → TDD estricto → review → mutacion → codigo confiable
```

Cada nivel agrega disciplina. El workshop de hoy les dio el nivel 2. El harness es el nivel 3 -- para cuando lo necesiten.

> **Recurso:** [github.com/betta-tech/harness-sdd](https://github.com/betta-tech/harness-sdd/tree/uncle-bob-harness) -- template completo con agents, docs, y workflow para implementar un harness en su proyecto.

---

## Recursos Adicionales

### Documentacion de Copilot Customization

- [Custom Instructions (VS Code Docs)](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [Prompt Files](https://code.visualstudio.com/docs/agent-customization/prompt-files)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Custom Agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)

### Documentacion del Proyecto

- [injection-js](https://github.com/mgechev/injection-js)
- [class-validator](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)
- [Express](https://expressjs.com/)

### Patrones y Arquitectura

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters (Hexagonal Architecture)](https://alistair.cockburn.us/hexagonal-architecture/)

---

## Preguntas Frecuentes

### Por que construir el marco de Copilot primero?

Porque sin instrucciones, Copilot genera codigo generico. **Con** instrucciones adaptadas a BCPR, genera codigo que sigue nuestra arquitectura desde el primer intento. El ROI de 45 minutos configurando es enorme: cada feature futuro se genera correctamente.

### Se puede usar esto con el proyecto real?

**Si.** Todo lo del Ejercicio 1 (la carpeta `.github/`) se puede commitear directamente al repositorio real. Los prompt files, skills y agents funcionan para cualquier feature futuro.

### Como migrar el adapter de memoria a DynamoDB?

1. Crear `NotificationDynamoAdapter` que use `@aws-sdk/lib-dynamodb`
2. Implementar los mismos ports: `ReadNotificationsPort` y `WriteNotificationPort`
3. Cambiar el provider: `{ provide: IReadNotificationsPortProvider, useClass: NotificationDynamoAdapter }`
4. **Los use cases no cambian.** Esa es la magia del patron Port-Adapter.

### Copilot genera codigo diferente para cada persona?

Si, y eso es intencional. Pero con las instrucciones y skills que configuramos, las diferencias se minimizan porque Copilot sigue las mismas reglas para todos.

### Que pasa si Copilot ignora las instrucciones?

- Verifica que los archivos esten en `.github/` con la extension correcta
- Revisa que `applyTo` coincida con la ruta del archivo
- Refuerza en el prompt: "Sigue las instrucciones de copilot-instructions.md"
- Abre **Chat: Configure Instructions** para verificar que se detectaron

### Como mantenemos las customizaciones al dia?

- Tratalas como codigo: PR reviews, versioning
- Cuando cambie un patron en el proyecto, actualiza las instrucciones
- Cuando alguien cree un prompt util, agreguenlo a `.github/prompts/`
- El agente BCPR Architect se puede actualizar conforme evoluciona la arquitectura

---

## Creditos

- **Workshop desarrollado para:** Equipo de desarrollo BCPR
- **Tecnologias:** GitHub Copilot, TypeScript, injection-js, Express, class-validator, Jest
- **Duracion:** 3 horas
- **Arquitectura:** Clean Architecture (Ports & Adapters)

---

**Gracias por participar! Ahora tienen un marco de Copilot personalizado para BCPR que todo el equipo puede usar desde hoy.**

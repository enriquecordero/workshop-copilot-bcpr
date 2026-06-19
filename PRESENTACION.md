# GitHub Copilot para BCPR — De Autocomplete a Operador

> **Workshop hands-on · 3 horas**
> Equipo de desarrollo BCPR

---

## La Pregunta que Vamos a Responder

**¿Copilot es un autocomplete glorificado... o una maquina de outcomes?**

La respuesta depende de una sola cosa: **el harness**.

---

## Que es un Harness

Un agente de AI sin harness **improvisa**.
Un agente de AI con harness **converge**.

```
SIN HARNESS:
  "Copilot, crea el feature" → codigo generico → no sigue nuestra arquitectura → reescribir

CON HARNESS:
  Instrucciones + Skills + Agents → Copilot habla "BCPR" → codigo correcto al primer intento
```

El harness son las **barandas del entorno**: instrucciones por capa, skills reutilizables, agents especializados, y archivos de referencia que le dicen a Copilot como es **nuestro** mundo.

**Hoy van a construir ese harness.**

---

## Los 3 Principios del Workshop

### 1. El Contexto es el Producto

El 80% de la calidad de un agente viene de **que contexto recibe**, no de que tan listo es el modelo.

Las instrucciones, skills y agents que vamos a crear son la palanca real — no los prompts individuales.

### 2. Configura Una Vez, Beneficia a Todos

Todo lo que creamos hoy (la carpeta `.github/`) se commitea al repositorio.
Cada developer del equipo se beneficia **sin esfuerzo extra**.

### 3. Genera con AI, Verifica con Herramientas

El ciclo real de trabajo:

```
Copilot genera → tsc compila → curl verifica → npm test valida
        ↑                                              |
        └──────── pegar error, Copilot corrige ←───────┘
```

La AI no genera perfecto al primer intento. **Eso es normal.** Lo que importa es el loop.

---

## Agenda

| Bloque | Que hacemos | Tiempo |
|--------|-------------|--------|
| **Demo** | Copilot SIN vs CON instrucciones | 5 min |
| **Ejercicio 1** | Montar el marco de Copilot para BCPR | 45 min |
| **Ejercicio 2** | Construir el feature de Notificaciones con el marco | 45 min |
| **Ejercicio 3** | Tests y validacion con el Agente QA | 25 min |
| **Ejercicio 4** | QA completo: test plan, caza de bugs, datos, exploratorio | 30 min |
| **Bonus** | Introduccion a Harness Engineering | 10 min |

---

## Demo: El Antes y el Despues

### ANTES (sin instrucciones)

Prompt en Copilot Chat:

> Crea un use case para listar notificaciones por usuario

Resultado tipico:
- Usa `@Injectable()` de NestJS (no usamos NestJS)
- Importa de `typeorm` (no usamos TypeORM)
- No usa nuestro `InjectionToken<T>`
- No usa nuestro `ConverterFunction<T, R>`
- No sigue nuestro patron de logging
- **Hay que reescribirlo completo**

### DESPUES (con el marco que vamos a construir)

**Mismo prompt, mismo Copilot.** Resultado:

- Usa `@Injectable()` de `injection-js` ✓
- Inyecta el port con `@Inject(IReadNotificationsPortProvider)` ✓
- Usa `ConverterFunction<Notification, NotificationViewModel>` ✓
- Logging estructurado con `AbstractLogger` ✓
- **Se puede usar tal cual**

> **¿Que cambio?** No el modelo. No el prompt. **El contexto.** Eso es lo que vamos a construir ahora.

---

## Ejercicio 1: Montar el Marco de Copilot (45 min)

### Que vamos a crear

```
.github/
├── copilot-instructions.md          → Reglas globales del proyecto
├── instructions/
│   ├── domain.instructions.md       → Instrucciones para capa domain
│   ├── application.instructions.md  → Instrucciones para capa application
│   ├── infrastructure.instructions.md → Instrucciones para capa infrastructure
│   └── presentation.instructions.md → Instrucciones para capa presentation
├── prompts/
│   ├── create-use-case.prompt.md    → Slash command /create-use-case
│   ├── create-port.prompt.md        → Slash command /create-port
│   ├── create-adapter.prompt.md     → Slash command /create-adapter
│   └── review-clean-arch.prompt.md  → Slash command /review-clean-arch
├── skills/
│   └── bcpr-testing/SKILL.md        → Skill de testing con patrones BCPR
└── agents/
    ├── bcpr-architect.agent.md      → Agente especializado en arquitectura
    └── bcpr-qa.agent.md             → Agente especializado en QA
```

### El Concepto Clave: Instrucciones por Capa

```
applyTo: "**/domain/**"     → "Usa clases inmutables, getters, sin dependencias externas"
applyTo: "**/application/**" → "Usa @Injectable, @Inject(Token), ConverterFunction"
applyTo: "**/infrastructure/**" → "Implementa los ports, usa class-validator"
```

**Copilot activa las instrucciones correctas automaticamente** segun el archivo que estas editando. No tienes que recordar nada.

### Referencia: El Archivo Ejemplo

El archivo `src/examples/example-use-case.ts` resuelve un problema critico:

- Los archivos de instrucciones **referencian** patrones del proyecto
- Pero el feature que vamos a construir **no existe todavia**
- El ejemplo le da a Copilot un patron real para seguir

```typescript
// Patron completo: Port interface + InjectionToken + @Injectable UseCase + logging
export interface ReadItemsPort {
  findByUserId(userId: string): Promise<any[]>;
}

export const IReadItemsPortProvider = new InjectionToken<ReadItemsPort>('IReadItemsPortProvider');

@Injectable()
export class ListItemsUseCase {
  constructor(
    private readonly logger: AbstractLogger,
    @Inject(IReadItemsPortProvider) private readonly readPort: ReadItemsPort,
    @Inject('IItemViewModelConverterProvider') private readonly converter: ConverterFunction<any, any>,
  ) {}

  async execute(userId: string): Promise<any[]> {
    this.logger.info('Event started: Listing items', { userId });
    const items = await this.readPort.findByUserId(userId);
    return items.map((item) => this.converter.apply(item));
  }
}
```

---

## Ejercicio 2: Construir el Feature con el Marco (45 min)

### Lo que vamos a construir

Un modulo completo de **Notificaciones** con Clean Architecture:

| Capa | Archivos | Que hace |
|------|----------|----------|
| Domain | `notification.ts`, `notification-type.ts` | Entidad + enums |
| Application | 2 ports, 3 use cases | Logica de negocio |
| Infrastructure | adapter, converter, controller | Implementacion |
| Presentation | view-model, arguments | DTOs |
| DI | `notification-provider.ts` | Cableado de dependencias |

### El Poder de Prompts Cortos

Con el marco configurado, los prompts son minimos:

```
Paso 2.1: "Crea los tipos de dominio para notificaciones (type, status)"
Paso 2.2: "Crea la entidad Notification siguiendo el patron domain"
Paso 2.3: "Crea los ports de lectura y escritura"
Paso 2.4: "Crea el use case ListNotificationsUseCase"
Paso 2.5: "Crea el adapter en memoria que implemente ambos ports"
```

**5 lineas.** No 40 lineas de dictado. Las instrucciones hacen el trabajo.

### Checkpoint: Verificar que Funciona

Despues de cablear todo (provider + injector.ts + app.ts):

```bash
npx tsc --noEmit          # ¿Compila? ✓
npm run dev               # ¿Arranca? ✓
curl localhost:3000/api/notifications/user-001   # ¿Responde? ✓
```

Si algo falla: pegar el error en Copilot Chat → corrige → repetir. **Ese es el loop.**

---

## Ejercicio 2.8: Tab Completions — Lo que Usaras el 80% del Tiempo

Copilot Chat es para features nuevos. Pero **Tab completions** es lo que usas 50 veces al dia.

### El Ejercicio

1. Abre `mark-as-read-use-case.ts`
2. Escribe solo la firma: `async execute(notificationId: string)`
3. **Espera.** Copilot sugiere el cuerpo completo con Tab
4. Observa: usa el logger, inyecta el port, lanza NotFoundError
5. `Tab` para aceptar, edita si hace falta

> Tab completions + instrucciones por capa = Copilot sabe que patron seguir **antes de que termines de escribir**.

---

## Ejercicio 3: Tests y Validacion con el Agente QA (25 min)

### Los 3 Tipos de Tests

```
Paso 3.1: "Genera tests unitarios para la entidad Notification"
         → markAsRead(), archive(), isRead(), constructor
         → Usa: describe/it, expect, toBe

Paso 3.2: "Genera tests del ListNotificationsUseCase"
         → Mock del port, mock del converter
         → Verifica: logging, delegacion, transformacion

Paso 3.3: "Genera tests de integracion del controller con supertest"
         → HTTP real contra Express
         → Verifica: status codes, JSON structure, validation errors
```

### El Agente QA en Accion

```
@BCPR QA revisa los tests del feature de notificaciones:
¿cubren los edge cases? ¿faltan escenarios?
```

El agente BCPR QA conoce los patrones de testing del proyecto (via SKILL.md) y revisa con esos criterios, no con criterios genericos.

### Resultado Final

```bash
npm test

 PASS  notification-entity.spec.ts        (4 tests)
 PASS  list-notifications-use-case.spec.ts (3 tests)
 PASS  mark-as-read-use-case.spec.ts      (2 tests)
 PASS  notification-controller.spec.ts    (8 tests)

Test Suites: 4 passed, 4 total
Tests:       17 passed, 17 total
```

---

## Ejercicio 4: QA Completo con Copilot (30 min)

### El Problema: La Trampa del Codigo Bonito

La AI genera codigo que **se ve profesional**: bien formateado, bien nombrado, compila sin errores.

Eso baja tu guardia. Pero el codigo puede tener:
- Logica invertida que "se lee bien"
- Validaciones faltantes que TypeScript no atrapa
- Calculos off-by-one camuflados
- Vulnerabilidades de seguridad sutiles (IDOR)

> **Generar codigo es facil. Validar codigo es donde esta el valor.**

### Las 5 Actividades

| Paso | Actividad | Herramienta |
|------|-----------|-------------|
| 4.1 | **Diseñar test plan** — plan de pruebas funcional antes de codear tests | Copilot Ask + template |
| 4.2 | **Cazar bugs** — 6 bugs intencionales en codigo "generado por AI" | Copilot + Agente QA |
| 4.3 | **Datos de prueba** — datasets realistas con acentos, emojis, injection | Copilot Agent |
| 4.4 | **Testing exploratorio** — curls agresivos sugeridos por Copilot | Copilot + curl |
| 4.5 | **Reporte de calidad** — documento listo para adjuntar al PR | Agente BCPR QA |

### El Reto: Caza de Bugs

Archivo con **6 bugs intencionales** que simulan errores tipicos de AI:

```
Lectura manual rapida:     1-2 de 6
Copilot Chat @workspace:   4-5 de 6
Agente BCPR QA:            5-6 de 6
Los tres combinados:       6 de 6
```

> **Leccion:** Ningun metodo solo encuentra todo. El loop completo es: **revisar → AI analiza → QA agent audita → humano decide**.

### Copilot como Tester Exploratorio

```bash
# Copilot sugiere vectores de ataque que un dev no pensaria:
curl -X POST localhost:3000/api/notifications \
  -H "Content-Type: text/plain" \
  -d '{"userId":"user-001","title":"T","message":"M","type":"PUSH"}'

curl localhost:3000/api/notifications/user-%3Cscript%3E

curl -X DELETE localhost:3000/api/notifications/notif-001
```

> Copilot no solo genera codigo — puede **pensar como un atacante**.

---

## Bonus: Harness Engineering — El Siguiente Nivel

### Los 3 Niveles de AI-Assisted Development

```
Nivel 1 — SIN HARNESS:
  "AI, crea el feature" → codigo → esperamos que este bien → bugs

Nivel 2 — CON INSTRUCCIONES (lo que hicimos hoy):
  "AI, crea el feature" → instrucciones guian → codigo mejor → tests → verificar

Nivel 3 — HARNESS COMPLETO:
  spec negociado → contrato aprobado → TDD estricto → review → mutacion → confiable
```

### El Pipeline Disciplinado

```
 CONVERSACION       DESTILACION        PUERTA          TDD ESTRICTO       REVIEW +
 (Spec Partner)     (Gherkin Author)   HUMANA          (Craftsman)         MUTACION

 ┌──────────┐      ┌──────────┐      ┌────────┐      ┌──────────┐      ┌──────────┐
 │ Debatir  │ ──>  │ Traducir │ ──>  │ Humano │ ──>  │ Rojo ->  │ ──>  │ Revisar  │
 │ el spec  │      │ a Gherkin│      │ aprueba│      │ Verde -> │      │ + Mutar  │
 │          │      │          │      │        │      │ Refactor │      │ tests    │
 └──────────┘      └──────────┘      └────────┘      └──────────┘      └──────────┘
```

**Por que importa:** Corregir un spec cuesta minutos. Corregir codigo cuesta horas.

La puerta humana esta ANTES del codigo, donde el costo de cambio es minimo.

### Ya Tienen 3 de 5 Roles

| Rol del Harness | Lo que ya creamos hoy |
|---|---|
| Spec Partner | Modo Ask + `@workspace` |
| Craftsman (TDD) | Modo Agent + skill `bcpr-testing` |
| Judge / QA | Agente **BCPR QA** + `/review-clean-arch` |

Lo que falta: **el pipeline** (el orden disciplinado) y **la puerta humana** (aprobar el spec antes de codear).

### Las 3 Leyes del TDD (Uncle Bob)

1. **No escribas codigo de produccion excepto para hacer pasar un test que falla**
2. **No escribas mas de un test que sea suficiente para fallar**
3. **No escribas mas codigo del necesario para pasar el test actual**

> **Con AI esto importa mas:** La AI tiende a generar codigo "de mas" — features no pedidos, abstracciones prematuras. Las 3 leyes la frenan.

---

## Resumen: Que se Llevan Hoy

### Deliverables Concretos

| Que | Donde | Para quien |
|-----|-------|------------|
| Instrucciones por capa | `.github/instructions/` | Todo el equipo |
| 4 slash commands | `.github/prompts/` | Todo el equipo |
| Skill de testing | `.github/skills/bcpr-testing/` | Todo el equipo |
| 2 agents especializados | `.github/agents/` | Todo el equipo |
| Archivo de referencia | `src/examples/example-use-case.ts` | Copilot + devs |
| Feature completo | `src/features/notification/` | Ejemplo vivo |
| 17 tests | `tests/` | Referencia de testing |
| Plan de pruebas | `docs/test-plan-notifications.md` | QA + equipo |
| Reto de caza de bugs | `src/examples/qa-challenge-buggy-code.ts` | Practica continua |
| Reporte de calidad | `docs/qa-report-notifications.md` | PR reviews |

**Todo se commitea al repo. Todo aplica desde el dia 1.**

### La Mentalidad que Cambia

| Antes | Despues |
|-------|---------|
| "Le pido cosas a un chatbot" | "Diseno el entorno donde un agente trabaja" |
| Prompts largos y detallados | Instrucciones por capa + prompts cortos |
| Copiar/pegar de Stack Overflow | Copilot genera siguiendo nuestros patrones |
| Cada dev configura distinto | Marco compartido via `.github/` |
| Esperar codigo perfecto | Generar → Verificar → Iterar |

---

## Cuando Usar Cada Nivel

| Situacion | Enfoque |
|-----------|---------|
| Fix rapido, bug conocido | Copilot directo (prompt + `/fix`) |
| Feature nuevo, alcance claro | **Marco BCPR** (lo que hicimos hoy) |
| Feature complejo, muchos edge cases | **Harness completo** (spec → contrato → TDD) |
| Onboarding de dev nuevo | Modo Ask + Architect agent |
| Refactor grande | Harness con Judge estricto |

---

## Para Llevar

> **El producto no es el codigo que escribe la AI.**
> **El producto es el entorno que disenas para que la AI no pueda fallar callado.**

Construyan el harness. El resto converge solo.

---

## Recursos

- **Repositorio del workshop:** `workshop-copilot-bcpr` (ramas `main` y `solution`)
- **Harness Engineering:** [betta-tech/harness-sdd](https://github.com/betta-tech/harness-sdd/tree/uncle-bob-harness)
- **Copilot Customization:** [VS Code Docs](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- **Clean Architecture:** [Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Gracias. Ahora abran VS Code y construyamos.**

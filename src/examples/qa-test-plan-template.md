# Plan de Pruebas: [Nombre del Feature]

## 1. Informacion General

| Campo | Valor |
|-------|-------|
| Feature | [nombre] |
| Autor del plan | [nombre] |
| Fecha | [fecha] |
| Version | 1.0 |
| Estado | Borrador / Aprobado / Ejecutado |

## 2. Alcance

### En alcance
- [lista de funcionalidades a probar]

### Fuera de alcance
- [lista de lo que NO se prueba en esta version]

## 3. Casos de Prueba Funcionales

### CP-001: [Nombre del caso]
| Campo | Detalle |
|-------|---------|
| Prioridad | Alta / Media / Baja |
| Precondiciones | [estado requerido antes del test] |
| Datos de entrada | [datos especificos] |
| Pasos | 1. [paso] 2. [paso] |
| Resultado esperado | [que debe pasar] |
| Tipo | Positivo / Negativo / Edge case |

### CP-002: [Nombre del caso]
| Campo | Detalle |
|-------|---------|
| Prioridad | |
| Precondiciones | |
| Datos de entrada | |
| Pasos | |
| Resultado esperado | |
| Tipo | |

## 4. Casos de Prueba de Edge Cases

- [ ] Valores vacios o null
- [ ] Strings con caracteres especiales (acentos, emojis, HTML/SQL injection)
- [ ] Valores en los limites (0, -1, MAX_INT)
- [ ] Listas vacias vs listas con un elemento vs listas grandes
- [ ] IDs inexistentes
- [ ] Operaciones duplicadas (crear dos veces lo mismo)
- [ ] Estado invalido (operar sobre un recurso en estado incorrecto)

## 5. Casos de Prueba de Seguridad

- [ ] Acceso a recursos de otro usuario (IDOR)
- [ ] Datos sensibles en logs o respuestas
- [ ] Validacion de input (injection, XSS, longitud)
- [ ] Manejo de errores sin exposicion de stack traces

## 6. Datos de Prueba

| Escenario | userId | Datos |
|-----------|--------|-------|
| Usuario con datos | user-001 | [descripcion] |
| Usuario sin datos | user-999 | Sin registros |
| Usuario invalido | "" / null | Error esperado |

## 7. Criterios de Aceptacion

- [ ] Todos los CP de prioridad Alta pasan
- [ ] Cobertura de edge cases criticos
- [ ] Sin vulnerabilidades de seguridad basicas (IDOR, injection)
- [ ] Respuestas de error consistentes con el formato del proyecto
- [ ] Logging estructurado sin datos sensibles

## 8. Reporte de Resultados

| CP | Resultado | Notas |
|----|-----------|-------|
| CP-001 | Pasa / Falla | [observaciones] |
| CP-002 | | |

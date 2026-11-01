# Matriz de sintaxis y conformidad

## Fuente de verdad

La referencia principal es `AntaresGT/lenguaje-quetzal`, rama `quetzal-0.0.3`, commit `647cfe73e035799393315835e8e025a52a9a0fd0`. Se comparó con `main`, commit `eabbf1bc625d6e22e8bb708bc24e8ce1896f8886`: no hay nuevas formas sintácticas; los cambios relacionados retiran la recuperación del modo editor de Rust, mientras que Tree-sitter conserva su propia recuperación incremental.

Se revisaron el lexer, parser, AST, pruebas, documentación formal y ejemplos. El orden de autoridad es: implementación Rust, pruebas del intérprete, ejemplos válidos y documentación.

## Características

| Característica | Implementación Tree-sitter | Evidencia |
|---|---|---|
| Identificadores Unicode | `\p{L}` y `\p{N}`, con `_` | Lexer Rust y `unicode.txt` |
| Palabras con y sin tildes | Todas las vocales agudas y graves normalizadas por Rust | `palabras_reservadas.rs` |
| Reserva global | `reserved` del DSL; miembros y claves `jsn` usan `sin_reservas` | Pruebas de identificadores y miembros |
| Enteros y decimales | `[0-9]+` y `[0-9]+\.[0-9]+` | Corpus y ejemplos |
| Textos y escapes | Cadenas normales, Unicode, multilínea y escape de cualquier carácter | Lexer Rust y `textos.txt` |
| Interpolación | Tokens inmediatos y expresiones completas | `interpolacion.txt` y ejemplos nativos |
| Comentarios | `//` y `/* ... */`, sin anidamiento | Lexer Rust y `comentarios.txt` |
| Tipos | Primitivos, `lista`, listas anidadas y tipos nombrados | `tipos.txt` |
| Variables | Tipo obligatorio, `var` opcional y valor opcional | `variables.txt` |
| Funciones | Retorno, parámetros, recursión y `asincrono` | `funciones.txt` |
| Objetos | Atributos, métodos, constructores, visibilidad y `libre` | `objetos.txt` |
| Herencia | Múltiple, `como`, `implementa` y cláusulas en cualquier orden | `herencia.txt` |
| Prototipos | Atributos y firmas, con `opcional` antes de `var` | `prototipos.txt` |
| Control | `si`, `sino si`, tres formas de bucle y `para` clásico/en/cada | Corpus correspondiente |
| Excepciones | `capturar` opcional, `finalmente` y al menos una cláusula | `excepciones.txt` |
| Módulos | Listas, alias, rutas y coma final en importación/exportación | Corpus correspondiente |
| Listas y `jsn` | Anidamiento; comas opcionales entre entradas `jsn` | `listas.txt`, `json.txt` |
| Operadores | Precedencias y asociatividad del parser Rust | `operadores.txt`, `precedencias.txt` |
| Asignación | Solo sentencia, no expresión | Parser Rust |
| Incremento/decremento | Solo sufijo y como sentencia | Parser Rust; prefijo rechazado |
| Recuperación | `ERROR` y `MISSING` localizados | 13 casos de `errores.txt` |

## Decisiones ante discrepancias

- **Punto y coma:** la EBNF lo presenta como terminador general, pero el parser Rust solo lo exige dentro del `para` clásico. No se acepta como terminador general.
- **Comentarios de bloque:** se implementan aunque la documentación formal solo muestre `//`.
- **`no`:** no es una palabra reservada ni operador en el lexer de referencia. Los operadores son `!`, `&&`, `||`, `y` y `o`.
- **Constructores:** Tree-sitter reconoce la forma `Nombre(...) { ... }` dentro de un objeto. Comprobar que coincide con el nombre del objeto es una regla contextual/semántica que no se duplica en la gramática.
- **Literales `jsn`:** son sintaxis nativa de Quetzal, no una inyección JSON.
- **Interpolación:** el DSL es suficiente; no se justifica un scanner externo.
- **Normalización:** se conservan los bytes originales. Los nodos `palabra_*` representan variantes sin modificar el texto.
- **Notaciones inexistentes:** `0x10` se analiza como `0` seguido de `x10`, tanto en Rust como en Tree-sitter. No es un literal hexadecimal, pero su rechazo semántico no corresponde al CST.
- **Recuperación:** un archivo incompleto puede conservar parámetros o sentencias dentro de `ERROR`. El objetivo es localizar el fallo y mantener estructura útil, no aceptar el archivo como válido.

## Resultado compartido

Los mismos archivos se analizan con ambos parsers:

- 36/36 ejemplos oficiales aceptados por Rust y Tree-sitter.
- 6/6 programas inválidos rechazados por Rust y Tree-sitter.
- 30/30 pruebas de sintaxis/editor del repositorio Rust pasan durante la investigación.

Comandos:

```bash
node pruebas/conformidad/verificar.js
cargo run --manifest-path pruebas/conformidad/rust/Cargo.toml
```

El segundo comando requiere una copia de la referencia en `.referencia/lenguaje-quetzal`.

# Registro de cambios

El proyecto usa [Versionado Semántico](https://semver.org/lang/es/).

## 0.1.0 — Preparado para publicación

### Añadido

- Gramática completa para la sintaxis implementada en `lenguaje-quetzal`, rama `quetzal-0.0.3` y commit `647cfe73e035799393315835e8e025a52a9a0fd0`.
- CST con nodos y campos en español para tipos, declaraciones, expresiones, funciones, objetos, prototipos, control de flujo, excepciones y módulos.
- Identificadores Unicode, normalización de palabras reservadas y reserva global con excepciones para miembros y claves `jsn`.
- Textos, escapes e interpolaciones con expresiones anidadas, sin scanner externo.
- Consultas de resaltado, ámbitos, plegado e indentación. No se declaran inyecciones porque el lenguaje no las necesita.
- Bindings C, Rust y Node.js.
- 62 pruebas de corpus, pruebas de consultas, 10 pruebas incrementales y fuzzing.
- Conformidad compartida: 36 ejemplos válidos y 6 programas inválidos con resultados coincidentes entre Rust y Tree-sitter.
- Integración comprobada con Neovim 0.12.6 y `nvim-treesitter` para parser, resaltado, plegado e indentación.
- Flujos de integración continua y empaquetado manual para la versión `v0.1.0`.

### Rendimiento

- `src/parser.c` ocupa 966 150 bytes tras representar las variantes acentuadas como tokens regex reservados, sin expansión combinatoria de literales.
- Las mediciones locales reproducibles están en `pruebas/rendimiento/resultados.json`.

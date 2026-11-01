# Contribuir a tree-sitter-quetzal

## Requisitos

Instala Node.js 20 o posterior, Rust estable, un compilador C y npm. El CLI de Tree-sitter se instala con las dependencias del proyecto y queda fijado en `0.27.1`.

```bash
npm ci
npm run generate
npm test
```

## Cambiar la gramática

1. Comprueba primero el comportamiento en el lexer, parser y pruebas de `AntaresGT/lenguaje-quetzal`. La documentación formal por sí sola no basta.
2. Añade un caso mínimo a `test/corpus/` antes de cambiar una regla, especialmente si corrige una discrepancia.
3. Modifica `grammar.js` usando nombres, campos, funciones auxiliares y comentarios en español.
4. Ejecuta `npm run generate`. Nunca edites manualmente `src/parser.c`, `src/grammar.json` ni `src/node-types.json`.
5. Ejecuta `npm test` y `npm run test:fuzz`.
6. Si cambia el CST, actualiza las consultas y `pruebas/integracion/consultas.test.js` en el mismo cambio.

No añadas `conflicts`, precedencia dinámica ni un scanner externo sin una explicación técnica y casos que demuestren su necesidad.

## Cambiar consultas

Los archivos de `queries/` son la única fuente de verdad. No mantengas copias divergentes para editores. Comprueba que todos los nodos existan y añade aserciones de capturas en `pruebas/integracion/consultas.test.js`.

## Actualizar conformidad

Los archivos de `test/ejemplos/oficiales/` no deben modificarse para hacerlos compatibles. Al actualizar la referencia:

1. Sustituye el conjunto completo por los ejemplos de la nueva revisión.
2. Actualiza el commit indicado en `test/ejemplos/README.md`.
3. Ejecuta el verificador Tree-sitter y el verificador Rust descritos en el README.
4. Clasifica toda diferencia como sintaxis, semántica o recuperación de errores y documenta la decisión en `pruebas/conformidad/matriz.md`.

## Cambios incompatibles

Un cambio de nombre de nodo o campo, una eliminación de nodos o una modificación del significado de capturas públicas debe figurar en `CHANGELOG.md` y requiere revisar la versión semántica. Documenta también la versión de Quetzal compatible.

## Antes de enviar cambios

```bash
npm run verificar:generado
npm test
npm run test:fuzz
cargo fmt --check
```

Si está disponible la integración de editor, ejecuta también `npm run test:neovim`. No incluyas artefactos de compilación, dependencias ni archivos de referencia locales en el cambio. No se publican etiquetas, paquetes ni registros comunitarios sin autorización de los mantenedores.

# tree-sitter-quetzal

Gramática incremental de [Tree-sitter](https://tree-sitter.github.io/) para **Lenguaje Quetzal**, un lenguaje de programación con sintaxis en español. Produce un árbol de sintaxis concreto (CST) reutilizable por editores, herramientas de análisis y aplicaciones C, Rust y Node.js.

Este proyecto no ejecuta código, no comprueba tipos y no sustituye al parser semántico ni al LSP del intérprete.

## Compatibilidad

- Lenguaje: `AntaresGT/lenguaje-quetzal`, rama `quetzal-0.0.3`, commit `647cfe73e035799393315835e8e025a52a9a0fd0`.
- Revisión posterior comparada: `main`, commit `eabbf1bc625d6e22e8bb708bc24e8ce1896f8886`, sin nuevas formas sintácticas.
- Tree-sitter CLI: `0.27.1`, fijado en las dependencias.
- ABI generada: 15.
- Archivos fuente: extensión `.qz`, lenguaje y filetype `quetzal`.
- Integración comprobada localmente con Neovim `0.12.6` y la rama `main` de `nvim-treesitter`.

La matriz de sintaxis, autoridad y discrepancias está en `pruebas/conformidad/matriz.md`.

## Características

- Identificadores Unicode y variantes acentuadas de palabras reservadas sin alterar el texto original.
- Tipos primitivos, listas tipadas y anidadas, y tipos definidos por el usuario.
- Variables, funciones, métodos, constructores, objetos, herencia y prototipos.
- Condicionales, bucles, excepciones, asincronía, importaciones y exportaciones.
- Expresiones con precedencias del parser Rust, llamadas y accesos encadenados.
- Listas, `jsn` nativo, textos, escapes e interpolaciones con expresiones anidadas.
- Comentarios de línea y bloque.
- Recuperación incremental con nodos `ERROR` y `MISSING` localizados.
- Consultas de resaltado, ámbitos, plegado e indentación.
- Bindings comprobados para C, Rust y Node.js.

No se añaden funciones flecha, terminadores generales, comentarios anidados ni otras formas que el intérprete no reconoce. No se necesita scanner externo.

## Estructura

```text
grammar.js                  Definición fuente de la gramática
tree-sitter.json            Identidad, alcance y rutas de consultas
src/parser.c                Parser C generado; no editar
src/grammar.json            Representación generada; no editar
src/node-types.json         Nodos y campos públicos generados
bindings/c/                 Cabecera y paquete pkg-config
bindings/rust/              Biblioteca Rust
bindings/node/              Addon Node.js
queries/                    Única fuente de consultas
test/corpus/                62 pruebas de CST y recuperación
test/ejemplos/oficiales/    36 ejemplos sin modificar del intérprete
pruebas/conformidad/        Verificadores compartidos y matriz
pruebas/integracion/        Consultas, bindings, incremental y Neovim
pruebas/rendimiento/        Generador de mediciones y resultados
```

Los archivos de `src/` se regeneran con Tree-sitter. Los bindings Go, Python y Swift no se distribuyen porque no se han implementado ni comprobado en esta versión.

## Instalación de herramientas

Requisitos: Node.js 20 o posterior, npm, Rust estable y un compilador C. Neovim solo es necesario para la integración de editor.

```bash
npm ci
```

El comando `npx tree-sitter` usa la versión local y reproducible del CLI; no hace falta una instalación global.

## Generación y compilación

```bash
npx tree-sitter generate
npx tree-sitter build
```

También existen atajos:

```bash
npm run generate
npm run build
```

En Linux se produce `libtree-sitter-quetzal.so`; en macOS, una biblioteca `.dylib`, y en Windows, una `.dll`. Para compilar la biblioteca estática, la compartida y el archivo pkg-config:

```bash
make TS='npx tree-sitter'
```

`CMakeLists.txt` está preparado con la plantilla oficial, pero CMake no estaba disponible en el entorno de desarrollo y esa vía no se declara verificada localmente.

## Pruebas

```bash
npm test
npm run test:fuzz
```

Comandos individuales:

```bash
npx tree-sitter test
npx tree-sitter parse test/ejemplos/oficiales/tipos.qz
npx tree-sitter fuzz --iterations 20 --edits 5
node --test pruebas/integracion/*.test.js
npm run test:c
```

La cobertura actual incluye:

- 62 pruebas de corpus, con entradas válidas e incompletas.
- 6 pruebas automatizadas de consultas.
- 10 ediciones incrementales comparadas con análisis completos.
- 36 ejemplos oficiales y 6 casos inválidos compartidos con Rust.
- Fuzzing sobre todo el corpus.
- Carga y análisis mediante los bindings C, Rust y Node.

### Conformidad con el intérprete

```bash
node pruebas/conformidad/verificar.js
```

Para ejecutar también el oráculo Rust, coloca la referencia en `.referencia/lenguaje-quetzal`:

```bash
git clone --branch quetzal-0.0.3 \
  https://github.com/AntaresGT/lenguaje-quetzal.git \
  .referencia/lenguaje-quetzal
cargo run --manifest-path pruebas/conformidad/rust/Cargo.toml
```

Los ejemplos no se modifican para adaptarlos a la gramática. El resultado actual es 36/36 válidos y 6/6 inválidos coincidentes.

### Neovim

La prueba aislada no modifica la configuración del usuario:

```bash
git clone --depth 1 https://github.com/nvim-treesitter/nvim-treesitter.git \
  .referencia/nvim-treesitter
npm run test:neovim
```

Comprueba parser, resaltado, capturas, plegado e indentación real.

### Rendimiento

```bash
npm run test:rendimiento
```

Las fuentes sintéticas se generan en memoria. Resultados locales, promedio de cinco ejecuciones tras dos calentamientos:

| Líneas | Análisis inicial | Reanálisis de una edición |
|---:|---:|---:|
| 100 | 0,396 ms | 0,038 ms |
| 1 000 | 3,188 ms | 0,188 ms |
| 10 000 | 31,048 ms | 1,598 ms |
| 50 000 | 156,605 ms | 9,693 ms |

Entorno: Linux x64, Node.js 24.21.0. Son mediciones, no garantías para otras plataformas. `src/parser.c` ocupa 966 150 bytes. Los valores RSS y la metodología completa están en `pruebas/rendimiento/resultados.json`.

## Integración con Neovim y NvChad

### Instalación local con `nvim-treesitter`

La rama actual de `nvim-treesitter` admite parsers locales y enlaza las queries desde el repositorio. Sustituye `/ruta/absoluta/tree-sitter-quetzal` por la ubicación real:

```lua
vim.api.nvim_create_autocmd('User', {
  pattern = 'TSUpdate',
  callback = function()
    require('nvim-treesitter.parsers').quetzal = {
      install_info = {
        path = '/ruta/absoluta/tree-sitter-quetzal',
        queries = 'queries',
      },
    }
  end,
})

vim.filetype.add({ extension = { qz = 'quetzal' } })
require('nvim-treesitter').install({ 'quetzal' }):wait(300000)

vim.api.nvim_create_autocmd('FileType', {
  pattern = 'quetzal',
  callback = function()
    vim.treesitter.start()
    vim.wo[0][0].foldexpr = 'v:lua.vim.treesitter.foldexpr()'
    vim.wo[0][0].foldmethod = 'expr'
    vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
  end,
})
```

El parser ya incluye `src/parser.c`, por lo que no hace falta regenerarlo al instalar. `queries = 'queries'` instala o enlaza esa única fuente en `queries/quetzal` dentro del runtime de Neovim; no se duplican consultas en este proyecto.

Este flujo también sirve para NvChad, sin depender de él. El LSP puede activarse por separado para diagnósticos y semántica.

### Uso directo sin el registro de `nvim-treesitter`

Compila la biblioteca y registra su ruta:

```lua
vim.filetype.add({ extension = { qz = 'quetzal' } })
vim.treesitter.language.add('quetzal', {
  path = '/ruta/absoluta/tree-sitter-quetzal/libtree-sitter-quetzal.so',
})
```

Neovim busca queries en `queries/quetzal` del `runtimepath`. Para usar directamente este repositorio sin instalarlas, `pruebas/integracion/neovim.lua` muestra cómo cargar cada archivo con `vim.treesitter.query.set` y activar resaltado y plegado. La indentación requiere `nvim-treesitter`; el núcleo de Neovim no proporciona esa función.

Inspecciona el árbol con `:InspectTree` y las capturas con `:Inspect`. Los comandos `:TSInstall` y `:TSUpdate` solo conocen Quetzal tras registrarlo como arriba o después de su inclusión comunitaria.

### Registro comunitario

Publicar este repositorio no habilita automáticamente `:TSInstall quetzal`. Para distribución general hay que proponer en `nvim-treesitter`:

1. La entrada `quetzal` en su registro de parsers, con URL y revisión.
2. Las queries mantenidas desde este repositorio o el flujo de instalación correspondiente.
3. Las pruebas de instalación y consultas exigidas por ese proyecto.

`lenguaje-quetzal.nvim` puede encapsular el registro, filetype y activación, mientras que este repositorio conserva gramática y queries. No se han enviado cambios a registros comunitarios.

## Uso desde otras herramientas

- **C:** incluye `bindings/c/tree_sitter/tree-sitter-quetzal.h` y enlaza `src/parser.c` o la biblioteca compilada. `npm run test:c` comprueba la carga.
- **Rust:** usa `tree_sitter_quetzal::LANGUAGE` con `tree_sitter::Parser`. `cargo test` compila y analiza código real.
- **Node.js:** importa `bindings/node` y usa `Parser.setLanguage`. Las pruebas de integración contienen ejemplos de parsing y queries.
- **Zed y otros editores:** requieren sus propias extensiones, paquetes o registros. El parser C es independiente del editor, pero no se declara soporte oficial para integraciones no comprobadas.

## Convención del CST

Los nodos y campos propios usan `snake_case` en español. Entre los principales:

- Programa y declaraciones: `programa`, `declaracion_variable`, `declaracion_funcion`, `declaracion_objeto`, `declaracion_prototipo`.
- Miembros: `declaracion_atributo`, `declaracion_metodo`, `declaracion_constructor`, `seccion_visibilidad`.
- Expresiones: `expresion_binaria`, `expresion_unaria`, `expresion_ternaria`, `llamada_funcion`, `acceso_miembro`, `acceso_indice`, `instanciacion_objeto`.
- Literales: `literal_lista`, `literal_jsn`, `literal_texto`, `texto_interpolado`, `interpolacion`.
- Control: `sentencia_condicional`, `bucle_mientras`, `bucle_para`, `bucle_para_coleccion`, `sentencia_intentar`.

Campos frecuentes: `nombre`, `tipo`, `tipo_retorno`, `mutabilidad`, `parametros`, `cuerpo`, `condicion`, `consecuencia`, `alternativa`, `izquierda`, `derecha`, `operador`, `objeto`, `miembro`, `clase`, `herencia`, `prototipos`, `simbolos`, `origen`.

Las palabras reservadas tienen nodos `palabra_*`, como `palabra_retornar` y `palabra_objeto`, para consultas estables y cobertura de todas las tildes. `src/node-types.json` es la referencia completa generada.

## Consultas

- `highlights.scm`: palabras clave, tipos, funciones, variables, literales, operadores y delimitadores.
- `locals.scm`: ámbitos, definiciones y referencias sintácticas, sin resolución semántica.
- `folds.scm`: bloques, objetos, prototipos y estructuras multilínea.
- `indents.scm`: capturas `@indent.begin`, `@indent.dedent` y `@indent.branch`.
- `injections.scm`: documenta que no hay inyecciones justificadas. `jsn` pertenece a Quetzal y no se inyecta como JSON.

## Desarrollo

1. Investiga el comportamiento en el parser Rust y añade un caso mínimo a `test/corpus/`.
2. Modifica `grammar.js`; no edites los archivos generados.
3. Ejecuta `npm run generate` y `npm test`.
4. Si cambia el CST, actualiza consultas y `pruebas/integracion/consultas.test.js`.
5. Ejecuta `npm run test:fuzz` y `npm run verificar:generado`.
6. Documenta cambios incompatibles de nodos, campos o capturas en `CHANGELOG.md`.

Consulta `CONTRIBUTING.md` para el proceso completo.

## Solución de problemas

- **Conflicto al generar:** revisa la secuencia indicada por el CLI y resuélvela con diseño o precedencia estática. No agregues `conflicts` indiscriminadamente.
- **Archivos generados divergentes:** ejecuta `npm run generate` y revisa el diff con `npm run verificar:generado`.
- **`ERROR` en un ejemplo válido:** reduce el caso y compáralo con el parser Rust antes de ampliar la gramática. Un `MISSING` en código incompleto puede ser una recuperación esperada.
- **Consulta inválida:** ejecuta `npx tree-sitter query queries/highlights.scm archivo.qz` y las pruebas de integración. Comprueba que los nodos existan en `src/node-types.json`.
- **Parser no encontrado en Neovim:** verifica la ruta absoluta de la biblioteca, el nombre `quetzal`, el filetype y el registro local. Publicar el repositorio no registra el parser automáticamente.
- **Sin resaltado:** comprueba que las queries estén en `queries/quetzal` del runtime o cárgalas con `query.set`, y ejecuta `vim.treesitter.start()`.
- **Sin indentación:** instala `nvim-treesitter` y usa `require'nvim-treesitter'.indentexpr()`; el núcleo de Neovim no basta.
- **Fallo de compilación Node:** ejecuta `npm run build:node` para forzar la recompilación del addon después de regenerar.
- **Diferencias de versión:** usa `npx tree-sitter --version`, que debe ser `0.27.1`, y comprueba la revisión del intérprete indicada arriba.

## Limitaciones conocidas

- No se validan tipos, permisos, mutabilidad, existencia de símbolos ni rutas de módulos.
- La forma de constructor se reconoce sintácticamente; la correspondencia de su nombre con el objeto requiere análisis posterior.
- La recuperación puede ubicar parte de una construcción incompleta dentro de `ERROR`; no se presenta como sintaxis válida.
- No hay inyecciones ni extensiones completas para Zed, VS Code u otros editores.
- La vía CMake y las plataformas Windows/macOS están preparadas para CI, pero no fueron ejecutadas en el entorno local Linux.

## Publicación

La versión preparada es `v0.1.0`. El workflow `publicacion.yml` solo se ejecuta manualmente, comprueba y empaqueta; no publica en npm, crates.io ni registros de editores. Los tags y releases requieren autorización expresa.

## Licencia

MIT. Consulta `LICENSE`.

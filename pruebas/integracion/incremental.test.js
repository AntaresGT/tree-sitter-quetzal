import assert from 'node:assert/strict';
import { test } from 'node:test';
import Parser from 'tree-sitter';
import quetzal from '../../bindings/node/index.js';

function punto(fuente, indice) {
  const anterior = Buffer.from(fuente).subarray(0, indice).toString();
  const lineas = anterior.split('\n');
  return { row: lineas.length - 1, column: Buffer.byteLength(lineas.at(-1)) };
}

function aplicar_edicion(arbol, antes, despues) {
  const buffer_antes = Buffer.from(antes);
  const buffer_despues = Buffer.from(despues);
  let inicio = 0;
  while (inicio < buffer_antes.length && inicio < buffer_despues.length
    && buffer_antes[inicio] === buffer_despues[inicio]) inicio++;

  let fin_antes = buffer_antes.length;
  let fin_despues = buffer_despues.length;
  while (fin_antes > inicio && fin_despues > inicio
    && buffer_antes[fin_antes - 1] === buffer_despues[fin_despues - 1]) {
    fin_antes--;
    fin_despues--;
  }

  arbol.edit({
    startIndex: inicio,
    oldEndIndex: fin_antes,
    newEndIndex: fin_despues,
    startPosition: punto(antes, inicio),
    oldEndPosition: punto(antes, fin_antes),
    newEndPosition: punto(despues, fin_despues),
  });
}

const casos = [
  ['añadir caracteres dentro de una función', 'vacio ejecutar() {\n  retornar\n}\n', 'vacio ejecutar() {\n  retornar 1\n}\n', false],
  ['cambiar nombres de variables', 'entero valor = 1\n', 'entero resultado = 1\n', false],
  ['agregar parámetros', 'entero sumar(entero a) { retornar a }\n', 'entero sumar(entero a, entero b) { retornar a }\n', false],
  ['modificar una expresión', 'entero valor = 1 + 2\n', 'entero valor = 1 + 2 * 3\n', false],
  ['agregar una llave', 'vacio ejecutar() {\n  retornar 1\n', 'vacio ejecutar() {\n  retornar 1\n}\n', false],
  ['eliminar una llave', 'vacio ejecutar() {\n  retornar 1\n}\n', 'vacio ejecutar() {\n  retornar 1\n', true],
  ['modificar una cadena', 'texto saludo = "Hola"\n', 'texto saludo = "Adiós"\n', false],
  ['agregar una interpolación', 'texto saludo = "Hola"\n', 'texto saludo = t"Hola {nombre}"\n', false],
  ['modificar un objeto', 'objeto Usuario {\n  texto nombre\n}\n', 'objeto Usuario {\n  texto nombre\n  entero edad\n}\n', false],
  ['añadir comentarios', 'entero valor = 1\n', '// comentario\nentero valor = 1\n', false],
];

for (const [nombre, antes, despues, espera_error] of casos) {
  test(`edición incremental: ${nombre}`, () => {
    const analizador = new Parser();
    analizador.setLanguage(quetzal);
    const arbol_anterior = analizador.parse(antes);
    aplicar_edicion(arbol_anterior, antes, despues);
    const incremental = analizador.parse(despues, arbol_anterior);
    const completo = analizador.parse(despues);

    assert.equal(incremental.rootNode.toString(), completo.rootNode.toString());
    assert.equal(incremental.rootNode.hasError, espera_error);
  });
}

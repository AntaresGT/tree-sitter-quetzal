import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import Parser from 'tree-sitter';
import quetzal from '../../bindings/node/index.js';

const raiz = new URL('../../test/ejemplos/oficiales/', import.meta.url).pathname;

function archivos_qz(directorio) {
  return readdirSync(directorio, { withFileTypes: true }).flatMap(entrada => {
    const ruta = join(directorio, entrada.name);
    return entrada.isDirectory() ? archivos_qz(ruta) : (ruta.endsWith('.qz') ? [ruta] : []);
  });
}

const analizador = new Parser();
analizador.setLanguage(quetzal);
const archivos = archivos_qz(raiz).sort();
const errores = [];

for (const archivo of archivos) {
  const fuente = readFileSync(archivo, 'utf8');
  const arbol = analizador.parse(fuente);
  if (arbol.rootNode.hasError) {
    errores.push(`${relative(raiz, archivo)}: ${arbol.rootNode.toString()}`);
  }
}

assert.equal(archivos.length, 36, 'Deben analizarse los 36 ejemplos oficiales');
assert.deepEqual(errores, [], `Ejemplos con errores sintácticos:\n${errores.join('\n')}`);
console.log(`Tree-sitter acepta los ${archivos.length} ejemplos oficiales sin errores.`);

const raiz_invalidos = new URL('./invalidos/', import.meta.url).pathname;
const invalidos = archivos_qz(raiz_invalidos).sort();
const aceptados = invalidos.filter(archivo => {
  const arbol = analizador.parse(readFileSync(archivo, 'utf8'));
  return !arbol.rootNode.hasError;
});

assert.equal(invalidos.length, 6, 'Deben comprobarse los 6 programas inválidos');
assert.deepEqual(aceptados, [], 'Tree-sitter aceptó programas inválidos');
console.log(`Tree-sitter rechaza los ${invalidos.length} programas inválidos compartidos.`);

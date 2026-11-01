import assert from 'node:assert/strict';
import { test } from 'node:test';
import Parser from 'tree-sitter';
import lenguaje from './index.js';

test('carga la gramática y analiza una declaración', () => {
  const analizador = new Parser();
  analizador.setLanguage(lenguaje);
  const arbol = analizador.parse('entero valor = 1\n');
  assert.equal(arbol.rootNode.hasError, false);
  assert.equal(arbol.rootNode.firstNamedChild.type, 'declaracion_variable');
});

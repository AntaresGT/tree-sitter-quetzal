import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import Parser from 'tree-sitter';
import quetzal from '../../bindings/node/index.js';

function ejecutar_consulta(nombre, fuente) {
  const analizador = new Parser();
  analizador.setLanguage(quetzal);
  const arbol = analizador.parse(fuente);
  const contenido = readFileSync(new URL(`../../queries/${nombre}.scm`, import.meta.url), 'utf8');
  const consulta = new Parser.Query(quetzal, contenido);
  return consulta.captures(arbol.rootNode).map(captura => ({
    nombre: captura.name,
    texto: fuente.slice(captura.node.startIndex, captura.node.endIndex),
  }));
}

function comprobar_captura(capturas, nombre, texto) {
  assert.ok(
    capturas.some(captura => captura.nombre === nombre && captura.texto === texto),
    `Falta ${nombre} sobre «${texto}». Capturas: ${JSON.stringify(capturas)}`,
  );
}

test('resaltado distingue tipos, funciones, parámetros y palabras reservadas', () => {
  const capturas = ejecutar_consulta(
    'highlights',
    'entero sumar(entero a) {\n  retornar a\n}\n',
  );
  comprobar_captura(capturas, 'type.builtin', 'entero');
  comprobar_captura(capturas, 'function', 'sumar');
  comprobar_captura(capturas, 'variable.parameter', 'a');
  comprobar_captura(capturas, 'keyword.return', 'retornar');
});

test('resaltado reconoce interpolación, llamadas y variantes acentuadas', () => {
  const capturas = ejecutar_consulta(
    'highlights',
    'asincróno vacio ejecutar() {}\ntexto saludo = t"Hola {sumar(1, 2)}"\n',
  );
  comprobar_captura(capturas, 'keyword.modifier', 'asincróno');
  comprobar_captura(capturas, 'type.builtin', 'vacio');
  comprobar_captura(capturas, 'function.call', 'sumar');
  comprobar_captura(capturas, 'punctuation.special', '{sumar(1, 2)}');
});

test('resaltado distingue objetos, miembros y comentarios', () => {
  const capturas = ejecutar_consulta(
    'highlights',
    '// prueba\nobjeto Usuario {\n  publico:\n    texto nombre\n}\n',
  );
  comprobar_captura(capturas, 'comment', '// prueba');
  comprobar_captura(capturas, 'keyword', 'objeto');
  comprobar_captura(capturas, 'type.definition', 'Usuario');
  comprobar_captura(capturas, 'keyword', 'publico');
  comprobar_captura(capturas, 'variable.member', 'nombre');
});

test('ámbitos registra definiciones y referencias', () => {
  const capturas = ejecutar_consulta(
    'locals',
    'vacio ejecutar(entero valor) {\n  entero copia = valor\n  retornar copia\n}\n',
  );
  comprobar_captura(capturas, 'local.definition', 'valor');
  comprobar_captura(capturas, 'local.definition', 'copia');
  comprobar_captura(capturas, 'local.reference', 'valor');
  comprobar_captura(capturas, 'local.reference', 'copia');
  assert.ok(capturas.some(captura => captura.nombre === 'local.scope'));
});

test('plegado e indentación usan los bloques estructurales', () => {
  const fuente = 'vacio ejecutar() {\n  retornar [1, 2]\n}\n';
  const plegados = ejecutar_consulta('folds', fuente);
  const indentaciones = ejecutar_consulta('indents', fuente);
  assert.ok(plegados.some(captura => captura.nombre === 'fold' && captura.texto.startsWith('{')));
  assert.ok(indentaciones.some(captura => captura.nombre === 'indent.begin'));
  comprobar_captura(indentaciones, 'indent.dedent', '}');
});

test('no se inventan inyecciones de otros lenguajes', () => {
  const capturas = ejecutar_consulta('injections', 'jsn datos = {clave: "valor"}\n');
  assert.deepEqual(capturas, []);
});

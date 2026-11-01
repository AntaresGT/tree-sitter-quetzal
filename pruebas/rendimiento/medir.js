import { statSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import Parser from 'tree-sitter';
import quetzal from '../../bindings/node/index.js';

function generar_fuente(lineas) {
  const partes = [];
  while (partes.length < lineas) {
    const indice = partes.length;
    partes.push(`entero funcion_${indice}(entero valor) {`);
    if (partes.length < lineas) partes.push(`  entero resultado = valor + ${indice} * 2`);
    if (partes.length < lineas) partes.push('  retornar resultado');
    if (partes.length < lineas) partes.push('}');
  }
  return partes.slice(0, lineas).join('\n') + '\n';
}

function punto(fuente, indice) {
  const lineas = fuente.slice(0, indice).split('\n');
  return { row: lineas.length - 1, column: Buffer.byteLength(lineas.at(-1)) };
}

function medir_incremental(analizador, fuente) {
  const anterior = analizador.parse(fuente);
  const inicio = fuente.indexOf('valor) {');
  const final = inicio + 'valor'.length;
  const editada = fuente.slice(0, inicio) + 'entrada' + fuente.slice(final);
  anterior.edit({
    startIndex: inicio,
    oldEndIndex: final,
    newEndIndex: inicio + 'entrada'.length,
    startPosition: punto(fuente, inicio),
    oldEndPosition: punto(fuente, final),
    newEndPosition: punto(editada, inicio + 'entrada'.length),
  });
  const comienzo = performance.now();
  const arbol = analizador.parse(editada, anterior);
  const duracion = performance.now() - comienzo;
  if (arbol.rootNode.hasError) throw new Error('La edición de rendimiento produjo errores');
  return duracion;
}

const analizador = new Parser();
analizador.setLanguage(quetzal);
const resultados = [];

for (const lineas of [100, 1000, 10000, 50000]) {
  const fuente = generar_fuente(lineas);
  for (let i = 0; i < 2; i++) analizador.parse(fuente);

  const iniciales = [];
  const incrementales = [];
  let memoria_antes = 0;
  let memoria_despues = 0;
  for (let i = 0; i < 5; i++) {
    if (global.gc) global.gc();
    memoria_antes = process.memoryUsage().rss;
    const comienzo = performance.now();
    const arbol = analizador.parse(fuente);
    iniciales.push(performance.now() - comienzo);
    memoria_despues = process.memoryUsage().rss;
    incrementales.push(medir_incremental(analizador, fuente));
    if (arbol.rootNode.hasError) throw new Error('La fuente sintética contiene errores');
  }

  const promedio = valores => valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
  resultados.push({
    lineas,
    bytes: Buffer.byteLength(fuente),
    analisis_inicial_ms: Number(promedio(iniciales).toFixed(3)),
    reanalisis_incremental_ms: Number(promedio(incrementales).toFixed(3)),
    rss_antes_mib: Number((memoria_antes / 1048576).toFixed(3)),
    rss_despues_mib: Number((memoria_despues / 1048576).toFixed(3)),
  });
}

const informe = {
  fecha: new Date().toISOString(),
  plataforma: `${process.platform} ${process.arch}`,
  node: process.version,
  metodologia: 'Promedio de 5 ejecuciones tras 2 calentamientos; fuentes sintéticas en memoria',
  bytes_parser_c: statSync('src/parser.c').size,
  resultados,
};

console.log(JSON.stringify(informe, null, 2));

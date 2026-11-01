const PRECEDENCIA = {
  ternaria: 1,
  o_logico: 2,
  y_logico: 3,
  igualdad: 4,
  comparacion: 5,
  aditiva: 6,
  multiplicativa: 7,
  unaria: 8,
  postfija: 9,
};

const VARIANTES_VOCALES = {
  a: '[aáà]',
  e: '[eéè]',
  i: '[iíì]',
  o: '[oóò]',
  u: '[uúù]',
};

const PALABRAS_RESERVADAS = [
  'entero', 'numero', 'texto', 'log', 'lista', 'jsn', 'vacio',
  'var', 'si', 'sino', 'mientras', 'para', 'hacer', 'en', 'cada',
  'romper', 'continuar', 'retornar', 'intentar', 'capturar', 'finalmente',
  'lanzar', 'excepcion', 'objeto', 'prototipo', 'hereda', 'implementa',
  'como', 'nuevo', 'esto', 'padre', 'publico', 'privado', 'libre',
  'opcional', 'asincrono', 'esperar', 'importar', 'exportar', 'desde',
  'verdadero', 'falso', 'nulo', 'y', 'o',
];

function patron_palabra(palabra) {
  const patron = Array.from(palabra, caracter => VARIANTES_VOCALES[caracter] || caracter).join('');
  return new RegExp(patron);
}

function token_palabra(palabra) {
  return token(prec(1, patron_palabra(palabra)));
}

function nodo_palabra($, palabra) {
  return alias(token_palabra(palabra), $[`palabra_${palabra}`]);
}

function separados(regla, separador) {
  return seq(regla, repeat(seq(separador, regla)));
}

function separados_con_final(regla, separador) {
  return seq(separados(regla, separador), optional(separador));
}

export default grammar({
  name: 'quetzal',

  word: $ => $.identificador,

  reserved: {
    globales: $ => PALABRAS_RESERVADAS.map(token_palabra),
    sin_reservas: $ => [],
  },

  extras: $ => [/[ \t\r\n\f]/, $.comentario],

  rules: {
    programa: $ => repeat($._elemento),

    _elemento: $ => choice(
      $.importacion,
      $.exportacion,
      $.declaracion_objeto,
      $.declaracion_prototipo,
      $.declaracion_funcion,
      $._sentencia,
    ),

    _sentencia: $ => choice(
      $.declaracion_variable,
      $.sentencia_condicional,
      $.bucle_mientras,
      $.bucle_hacer_mientras,
      $.bucle_para,
      $.bucle_para_coleccion,
      $.sentencia_intentar,
      $.sentencia_lanzar,
      $.sentencia_retorno,
      $.sentencia_romper,
      $.sentencia_continuar,
      $._sentencia_simple,
    ),

    _sentencia_simple: $ => choice(
      $.sentencia_asignacion,
      $.sentencia_incremento,
      $.sentencia_decremento,
      $.sentencia_expresion,
    ),

    bloque: $ => seq('{', repeat($._sentencia), '}'),

    _tipo: $ => prec(1, choice(
      $.tipo_primitivo,
      $.tipo_lista,
      alias($.identificador, $.tipo_definido_usuario),
    )),

    tipo_primitivo: $ => choice(
      nodo_palabra($, 'entero'),
      nodo_palabra($, 'numero'),
      nodo_palabra($, 'texto'),
      nodo_palabra($, 'log'),
      nodo_palabra($, 'jsn'),
      nodo_palabra($, 'vacio'),
    ),

    tipo_lista: $ => seq(
      nodo_palabra($, 'lista'),
      optional(field('parametros', $.parametros_tipo)),
    ),

    parametros_tipo: $ => seq('<', field('tipo', $._tipo), '>'),

    declaracion_variable: $ => seq(
      field('tipo', $._tipo),
      optional(field('mutabilidad', $.modificador_var)),
      field('nombre', $.identificador),
      optional(seq('=', field('valor', $._expresion))),
    ),

    declaracion_funcion: $ => prec(1, seq(
      optional($.modificador_asincrono),
      field('tipo_retorno', $._tipo),
      field('nombre', $.identificador),
      field('parametros', $.lista_parametros),
      field('cuerpo', $.bloque),
    )),

    lista_parametros: $ => seq(
      '(',
      optional(separados($.declaracion_parametro, ',')),
      ')',
    ),

    declaracion_parametro: $ => seq(
      field('tipo', $._tipo),
      optional(field('mutabilidad', $.modificador_var)),
      field('nombre', $.identificador),
    ),

    modificador_var: $ => nodo_palabra($, 'var'),
    modificador_libre: $ => nodo_palabra($, 'libre'),
    modificador_asincrono: $ => nodo_palabra($, 'asincrono'),
    modificador_opcional: $ => nodo_palabra($, 'opcional'),

    sentencia_asignacion: $ => seq(
      field('objetivo', $._expresion),
      field('operador', choice('=', '+=', '-=', '*=', '/=', '%=')),
      field('valor', $._expresion),
    ),

    sentencia_incremento: $ => seq(field('objetivo', $._expresion), '++'),
    sentencia_decremento: $ => seq(field('objetivo', $._expresion), '--'),
    sentencia_expresion: $ => $._expresion,

    sentencia_condicional: $ => seq(
      nodo_palabra($, 'si'),
      '(',
      field('condicion', $._expresion),
      ')',
      field('consecuencia', $.bloque),
      optional(field('alternativa', $.rama_sino)),
    ),

    rama_sino: $ => seq(
      nodo_palabra($, 'sino'),
      field('cuerpo', choice($.sentencia_condicional, $.bloque)),
    ),

    bucle_mientras: $ => seq(
      nodo_palabra($, 'mientras'),
      '(',
      field('condicion', $._expresion),
      ')',
      field('cuerpo', $.bloque),
    ),

    bucle_hacer_mientras: $ => seq(
      nodo_palabra($, 'hacer'),
      field('cuerpo', $.bloque),
      nodo_palabra($, 'mientras'),
      '(',
      field('condicion', $._expresion),
      ')',
    ),

    bucle_para: $ => seq(
      nodo_palabra($, 'para'),
      '(',
      field('inicializacion', $.declaracion_variable),
      ';',
      field('condicion', $._expresion),
      ';',
      field('paso', $._sentencia_simple),
      ')',
      field('cuerpo', $.bloque),
    ),

    bucle_para_coleccion: $ => seq(
      nodo_palabra($, 'para'),
      '(',
      field('tipo', $._tipo),
      optional(field('mutabilidad', $.modificador_var)),
      field('nombre', $.identificador),
      choice(nodo_palabra($, 'en'), nodo_palabra($, 'cada')),
      field('iterable', $._expresion),
      ')',
      field('cuerpo', $.bloque),
    ),

    sentencia_retorno: $ => prec.right(seq(
      nodo_palabra($, 'retornar'),
      optional(field('valor', $._expresion)),
    )),

    sentencia_romper: $ => nodo_palabra($, 'romper'),
    sentencia_continuar: $ => nodo_palabra($, 'continuar'),

    sentencia_intentar: $ => seq(
      nodo_palabra($, 'intentar'),
      field('cuerpo', $.bloque),
      choice(
        seq(
          field('captura', $.clausula_captura),
          optional(field('finalmente', $.clausula_finalmente)),
        ),
        field('finalmente', $.clausula_finalmente),
      ),
    ),

    clausula_captura: $ => seq(
      nodo_palabra($, 'capturar'),
      '(',
      nodo_palabra($, 'excepcion'),
      field('nombre', $.identificador),
      ')',
      field('cuerpo', $.bloque),
    ),

    clausula_finalmente: $ => seq(
      nodo_palabra($, 'finalmente'),
      field('cuerpo', $.bloque),
    ),

    sentencia_lanzar: $ => seq(
      nodo_palabra($, 'lanzar'),
      field('valor', $._expresion),
    ),

    declaracion_objeto: $ => seq(
      nodo_palabra($, 'objeto'),
      field('nombre', $.identificador),
      repeat(choice(
        field('herencia', $.lista_herencia),
        field('extension', $.lista_extension),
        field('prototipos', $.lista_prototipos),
      )),
      field('miembros', $.cuerpo_objeto),
    ),

    lista_herencia: $ => seq(
      nodo_palabra($, 'hereda'),
      field('nombres', separados($.identificador, ',')),
    ),

    lista_extension: $ => seq(
      nodo_palabra($, 'como'),
      field('nombres', separados($.identificador, ',')),
    ),

    lista_prototipos: $ => seq(
      nodo_palabra($, 'implementa'),
      field('nombres', separados($.identificador, ',')),
    ),

    cuerpo_objeto: $ => seq(
      '{',
      repeat(choice(
        $.seccion_visibilidad,
        $.declaracion_atributo,
        $.declaracion_metodo,
        $.declaracion_constructor,
      )),
      '}',
    ),

    seccion_visibilidad: $ => seq(
      choice(nodo_palabra($, 'publico'), nodo_palabra($, 'privado')),
      ':',
    ),

    declaracion_atributo: $ => seq(
      repeat(choice($.modificador_libre, $.modificador_asincrono)),
      field('tipo', $._tipo),
      optional(field('mutabilidad', $.modificador_var)),
      field('nombre', $.identificador),
      optional(seq('=', field('valor', $._expresion))),
    ),

    declaracion_metodo: $ => seq(
      repeat(choice($.modificador_libre, $.modificador_asincrono)),
      field('tipo_retorno', $._tipo),
      field('nombre', $.identificador),
      field('parametros', $.lista_parametros),
      field('cuerpo', $.bloque),
    ),

    declaracion_constructor: $ => seq(
      repeat(choice($.modificador_libre, $.modificador_asincrono)),
      field('nombre', $.identificador),
      field('parametros', $.lista_parametros),
      field('cuerpo', $.bloque),
    ),

    declaracion_prototipo: $ => seq(
      nodo_palabra($, 'prototipo'),
      field('nombre', $.identificador),
      field('miembros', $.cuerpo_prototipo),
    ),

    cuerpo_prototipo: $ => seq(
      '{',
      repeat(choice(
        $.seccion_visibilidad,
        $.declaracion_atributo_prototipo,
        $.declaracion_metodo_prototipo,
      )),
      '}',
    ),

    declaracion_atributo_prototipo: $ => seq(
      field('tipo', $._tipo),
      optional(field('opcional', $.modificador_opcional)),
      optional(field('mutabilidad', $.modificador_var)),
      field('nombre', $.identificador),
    ),

    declaracion_metodo_prototipo: $ => seq(
      field('tipo_retorno', $._tipo),
      optional(field('opcional', $.modificador_opcional)),
      optional(field('mutabilidad', $.modificador_var)),
      field('nombre', $.identificador),
      field('parametros', $.lista_parametros),
    ),

    importacion: $ => seq(
      nodo_palabra($, 'importar'),
      field('simbolos', $.lista_importaciones),
      nodo_palabra($, 'desde'),
      field('origen', $.literal_texto),
    ),

    lista_importaciones: $ => seq(
      '{',
      optional(separados_con_final($.simbolo_importado, ',')),
      '}',
    ),

    simbolo_importado: $ => seq(
      field('nombre', $.identificador),
      optional(seq(nodo_palabra($, 'como'), field('alias', $.identificador))),
    ),

    exportacion: $ => seq(
      nodo_palabra($, 'exportar'),
      field('simbolos', $.lista_exportaciones),
    ),

    lista_exportaciones: $ => seq(
      '{',
      optional(separados_con_final($.identificador, ',')),
      '}',
    ),

    _expresion: $ => choice(
      $.expresion_ternaria,
      $.expresion_binaria,
      $.expresion_unaria,
      $.expresion_esperar,
      $.llamada_funcion,
      $.acceso_miembro,
      $.acceso_indice,
      $.instanciacion_objeto,
      $.expresion_agrupada,
      $.literal_lista,
      $.literal_jsn,
      $.literal_entero,
      $.literal_numero,
      $.literal_texto,
      $.texto_interpolado,
      $.literal_booleano,
      $.literal_nulo,
      $.referencia_esto,
      $.referencia_padre,
      $.identificador,
    ),

    expresion_ternaria: $ => prec.right(PRECEDENCIA.ternaria, seq(
      field('condicion', $._expresion),
      '?',
      field('si_verdadero', $._expresion),
      ':',
      field('si_falso', $._expresion),
    )),

    expresion_binaria: $ => choice(
      ...[
        ['||', PRECEDENCIA.o_logico],
        [nodo_palabra($, 'o'), PRECEDENCIA.o_logico],
        ['&&', PRECEDENCIA.y_logico],
        [nodo_palabra($, 'y'), PRECEDENCIA.y_logico],
        ['==', PRECEDENCIA.igualdad],
        ['!=', PRECEDENCIA.igualdad],
        ['<', PRECEDENCIA.comparacion],
        ['>', PRECEDENCIA.comparacion],
        ['<=', PRECEDENCIA.comparacion],
        ['>=', PRECEDENCIA.comparacion],
        ['+', PRECEDENCIA.aditiva],
        ['-', PRECEDENCIA.aditiva],
        ['*', PRECEDENCIA.multiplicativa],
        ['/', PRECEDENCIA.multiplicativa],
        ['%', PRECEDENCIA.multiplicativa],
      ].map(([operador, precedencia]) => prec.left(precedencia, seq(
        field('izquierda', $._expresion),
        field('operador', operador),
        field('derecha', $._expresion),
      ))),
    ),

    expresion_unaria: $ => prec.right(PRECEDENCIA.unaria, seq(
      field('operador', choice('!', '-')),
      field('operando', $._expresion),
    )),

    expresion_esperar: $ => prec.right(PRECEDENCIA.unaria, seq(
      nodo_palabra($, 'esperar'),
      field('operando', $._expresion),
    )),

    llamada_funcion: $ => prec.left(PRECEDENCIA.postfija, seq(
      field('objetivo', $._expresion),
      field('argumentos', $.lista_argumentos),
    )),

    lista_argumentos: $ => seq(
      '(',
      optional(separados($._expresion, ',')),
      ')',
    ),

    acceso_miembro: $ => prec.left(PRECEDENCIA.postfija, seq(
      field('objeto', $._expresion),
      '.',
      field('miembro', $.nombre_miembro),
    )),

    acceso_indice: $ => prec.left(PRECEDENCIA.postfija, seq(
      field('objeto', $._expresion),
      '[',
      field('indice', $._expresion),
      ']',
    )),

    instanciacion_objeto: $ => seq(
      nodo_palabra($, 'nuevo'),
      field('clase', $.identificador),
      field('argumentos', $.lista_argumentos),
    ),

    expresion_agrupada: $ => seq('(', field('expresion', $._expresion), ')'),

    literal_lista: $ => seq(
      '[',
      optional(separados($._expresion, ',')),
      ']',
    ),

    literal_jsn: $ => seq('{', repeat($.entrada_jsn), '}'),

    entrada_jsn: $ => seq(
      field('clave', choice($.clave_jsn, $.literal_texto)),
      ':',
      field('valor', $._expresion),
      optional(','),
    ),

    literal_entero: $ => /[0-9]+/,
    literal_numero: $ => /[0-9]+\.[0-9]+/,

    literal_booleano: $ => choice(
      nodo_palabra($, 'verdadero'),
      nodo_palabra($, 'falso'),
    ),

    literal_nulo: $ => nodo_palabra($, 'nulo'),
    referencia_esto: $ => nodo_palabra($, 'esto'),
    referencia_padre: $ => nodo_palabra($, 'padre'),

    literal_texto: $ => seq(
      '"',
      repeat(choice($.contenido_texto, $.secuencia_escape)),
      token.immediate('"'),
    ),

    contenido_texto: $ => token.immediate(prec(1, /[^"\\]+/)),
    secuencia_escape: $ => token.immediate(/\\[\s\S]/),

    texto_interpolado: $ => seq(
      't"',
      repeat(choice(
        $.segmento_texto_interpolado,
        $.secuencia_escape_interpolada,
        $.interpolacion,
      )),
      token.immediate('"'),
    ),

    segmento_texto_interpolado: $ => token.immediate(prec(1, /[^"\\{]+/)),
    secuencia_escape_interpolada: $ => token.immediate(/\\[\s\S]/),

    interpolacion: $ => seq(
      token.immediate('{'),
      field('expresion', $._expresion),
      '}',
    ),

    _nombre_reservado: $ => choice(...PALABRAS_RESERVADAS.map(palabra => nodo_palabra($, palabra))),

    nombre_miembro: $ => reserved('sin_reservas', choice($.identificador, $._nombre_reservado)),
    clave_jsn: $ => reserved('sin_reservas', choice($.identificador, $._nombre_reservado)),
    identificador: $ => /[\p{L}_][\p{L}\p{N}_]*/,

    comentario: $ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    )),
  },
});

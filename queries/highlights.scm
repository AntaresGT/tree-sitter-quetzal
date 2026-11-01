(identificador) @variable

(comentario) @comment

(tipo_primitivo) @type.builtin
(tipo_lista) @type.builtin
(tipo_definido_usuario) @type

(declaracion_objeto nombre: (identificador) @type.definition)
(declaracion_prototipo nombre: (identificador) @type.definition)
(lista_herencia nombres: (identificador) @type)
(lista_extension nombres: (identificador) @type)
(lista_prototipos nombres: (identificador) @type)

(declaracion_funcion nombre: (identificador) @function)
(declaracion_metodo nombre: (identificador) @function.method)
(declaracion_metodo_prototipo nombre: (identificador) @function.method)
(declaracion_constructor nombre: (identificador) @constructor)
(instanciacion_objeto clase: (identificador) @constructor)

(llamada_funcion objetivo: (identificador) @function.call)
(llamada_funcion
  objetivo: (acceso_miembro miembro: (nombre_miembro) @function.method.call))

(declaracion_parametro nombre: (identificador) @variable.parameter)
(declaracion_atributo nombre: (identificador) @variable.member)
(declaracion_atributo_prototipo nombre: (identificador) @variable.member)
(acceso_miembro miembro: (nombre_miembro) @variable.member)
(entrada_jsn clave: (clave_jsn) @property)

(modificador_var) @keyword.modifier
(modificador_libre) @keyword.modifier
(modificador_asincrono) @keyword.modifier
(modificador_opcional) @keyword.modifier

[
  (palabra_mientras)
  (palabra_hacer)
  (palabra_para)
  (palabra_en)
  (palabra_cada)
  (palabra_romper)
  (palabra_continuar)
  (palabra_intentar)
  (palabra_capturar)
  (palabra_finalmente)
  (palabra_lanzar)
  (palabra_esperar)
] @keyword.control

[(palabra_si) (palabra_sino)] @keyword.control.conditional
(palabra_retornar) @keyword.return
[(palabra_importar) (palabra_exportar) (palabra_desde)] @keyword.import

[
  (palabra_objeto)
  (palabra_prototipo)
  (palabra_hereda)
  (palabra_implementa)
  (palabra_como)
  (palabra_nuevo)
  (palabra_publico)
  (palabra_privado)
] @keyword

(palabra_excepcion) @type.builtin
[(palabra_y) (palabra_o)] @operator

(referencia_esto) @variable.builtin
(referencia_padre) @variable.builtin

(literal_entero) @number
(literal_numero) @number.float
(literal_booleano) @boolean
(literal_nulo) @constant.builtin
(literal_texto) @string
(texto_interpolado) @string
(secuencia_escape) @string.escape
(secuencia_escape_interpolada) @string.escape
(interpolacion) @punctuation.special

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "+="
  "-="
  "*="
  "/="
  "%="
  "++"
  "--"
  "="
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&&"
  "||"
  "!"
  "?"
] @operator

["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," "." ":" ";"] @punctuation.delimiter

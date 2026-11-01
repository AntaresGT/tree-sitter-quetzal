//! Compatibilidad de Lenguaje Quetzal con la biblioteca [tree-sitter].
//!
//! La constante [`LANGUAGE`] registra la gramática en un [`Parser`]:
//!
//! ```
//! let codigo = "entero valor = 1\n";
//! let mut parser = tree_sitter::Parser::new();
//! let lenguaje = tree_sitter_quetzal::LANGUAGE;
//! parser
//!     .set_language(&lenguaje.into())
//!     .expect("No se pudo cargar el parser de Lenguaje Quetzal");
//! let arbol = parser.parse(codigo, None).unwrap();
//! assert!(!arbol.root_node().has_error());
//! ```
//!
//! [`Parser`]: https://docs.rs/tree-sitter/0.27.1/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_quetzal() -> *const ();
}

/// Función pública de la gramática generada por Tree-sitter.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_quetzal) };

/// Contenido de `node-types.json` para inspeccionar los nodos públicos.
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(with_highlights_query)]
/// Consulta de resaltado sintáctico.
pub const HIGHLIGHTS_QUERY: &str = include_str!("../../queries/highlights.scm");

#[cfg(with_injections_query)]
/// Consulta de inyecciones de lenguajes.
pub const INJECTIONS_QUERY: &str = include_str!("../../queries/injections.scm");

#[cfg(with_locals_query)]
/// Consulta de ámbitos y referencias locales.
pub const LOCALS_QUERY: &str = include_str!("../../queries/locals.scm");

#[cfg(test)]
mod pruebas {
    #[test]
    fn carga_la_gramatica_y_analiza_una_declaracion() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE.into())
            .expect("No se pudo cargar el parser de Lenguaje Quetzal");
        let arbol = parser.parse("entero valor = 1\n", None).unwrap();
        assert!(!arbol.root_node().has_error());
        assert_eq!(
            arbol.root_node().named_child(0).unwrap().kind(),
            "declaracion_variable"
        );
    }
}

#include <stdio.h>
#include <tree_sitter/tree-sitter-quetzal.h>

int main(void) {
    const TSLanguage *lenguaje = tree_sitter_quetzal();
    if (lenguaje == NULL) {
        fprintf(stderr, "No se pudo cargar la gramática Quetzal.\n");
        return 1;
    }
    puts("El binding C carga la gramática Quetzal correctamente.");
    return 0;
}

use std::{
    fs,
    path::{Path, PathBuf},
    process::ExitCode,
};

use nucleo::Fuente;
use sintaxis::parsear_modulo;

fn archivos_qz(directorio: &Path, archivos: &mut Vec<PathBuf>) -> std::io::Result<()> {
    for entrada in fs::read_dir(directorio)? {
        let ruta = entrada?.path();
        if ruta.is_dir() {
            archivos_qz(&ruta, archivos)?;
        } else if ruta.extension().and_then(|extension| extension.to_str()) == Some("qz") {
            archivos.push(ruta);
        }
    }
    Ok(())
}

fn main() -> ExitCode {
    let raiz = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../test/ejemplos/oficiales");
    let mut archivos = Vec::new();
    archivos_qz(&raiz, &mut archivos).expect("deben leerse los ejemplos oficiales");
    archivos.sort();
    assert_eq!(
        archivos.len(),
        36,
        "deben analizarse los 36 ejemplos oficiales"
    );

    let mut errores = Vec::new();
    for archivo in &archivos {
        let contenido = fs::read_to_string(archivo).expect("debe leerse el ejemplo");
        let nombre = archivo.strip_prefix(&raiz).unwrap().display().to_string();
        let fuente = Fuente::nueva(nombre.clone(), contenido);
        if let Err(error) = parsear_modulo(&fuente) {
            errores.push(format!("{nombre}: {error}"));
        }
    }

    if !errores.is_empty() {
        eprintln!("Ejemplos rechazados por Rust:\n{}", errores.join("\n"));
        return ExitCode::FAILURE;
    }
    println!(
        "Rust acepta los {} ejemplos oficiales sin errores.",
        archivos.len()
    );

    let raiz_invalidos = Path::new(env!("CARGO_MANIFEST_DIR")).join("../invalidos");
    let mut invalidos = Vec::new();
    archivos_qz(&raiz_invalidos, &mut invalidos).expect("deben leerse los programas inválidos");
    invalidos.sort();
    assert_eq!(
        invalidos.len(),
        6,
        "deben comprobarse los 6 programas inválidos"
    );

    let mut aceptados = Vec::new();
    for archivo in &invalidos {
        let contenido = fs::read_to_string(archivo).expect("debe leerse el programa inválido");
        let nombre = archivo
            .strip_prefix(&raiz_invalidos)
            .unwrap()
            .display()
            .to_string();
        if parsear_modulo(&Fuente::nueva(nombre.clone(), contenido)).is_ok() {
            aceptados.push(nombre);
        }
    }

    if aceptados.is_empty() {
        println!(
            "Rust rechaza los {} programas inválidos compartidos.",
            invalidos.len()
        );
        ExitCode::SUCCESS
    } else {
        eprintln!("Rust aceptó programas inválidos: {}", aceptados.join(", "));
        ExitCode::FAILURE
    }
}

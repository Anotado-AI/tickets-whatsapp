// El RFC del cliente: limpieza, forma, fecha y dígito verificador.
//
//   Persona moral:  3 letras + fecha AAMMDD + homoclave de 3 (12 caracteres)  EKU9003173C9
//   Persona física: 4 letras + fecha AAMMDD + homoclave de 3 (13 caracteres)
//   Genéricos:      XAXX010101000 (público en general) y XEXX010101000 (extranjero)
//
// El último carácter es un dígito verificador que se calcula con los otros. Sirve para atrapar
// un RFC mal copiado de una foto antes de mandarlo al proveedor de facturas.

export const RFC_PUBLICO_EN_GENERAL = "XAXX010101000";
export const RFC_EXTRANJERO = "XEXX010101000";

const VALORES = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";

/** Quita espacios, guiones y puntos, y pasa a mayúsculas: «eku-900317 3c9» → «EKU9003173C9». */
export function limpiarRfc(texto) {
  return String(texto == null ? "" : texto).toUpperCase().replace(/[\s\-.]/g, "");
}

/** Dígito verificador que le toca a un RFC (se calcula con sus primeros 11 o 12 caracteres). */
export function digitoVerificador(rfc) {
  const r = limpiarRfc(rfc);
  const base = (r.length === 12 ? " " + r : r).slice(0, 12);
  let suma = 0;
  for (let i = 0; i < 12; i++) {
    const v = VALORES.indexOf(base[i]);
    if (v < 0) return "";
    suma += v * (13 - i);
  }
  const resto = suma % 11;
  if (resto === 0) return "0";
  const d = 11 - resto;
  return d === 10 ? "A" : String(d);
}

function fechaValida(aammdd) {
  const mm = Number(aammdd.slice(2, 4));
  const dd = Number(aammdd.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1) return false;
  // El año de dos cifras puede ser de 1900 o de 2000; febrero 29 vale si alguno de los dos es bisiesto.
  const aa = Number(aammdd.slice(0, 2));
  const dias = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mm - 1];
  if (dd > dias) return false;
  if (mm === 2 && dd === 29) {
    const bisiesto = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
    return bisiesto(1900 + aa) || bisiesto(2000 + aa);
  }
  return true;
}

/**
 * Revisa un RFC. Devuelve { rfc, tipo, valido, motivo }.
 *   tipo:   "moral", "fisica", "publico" (XAXX010101000) o "extranjero" (XEXX010101000)
 *   motivo: "" si sirve; "vacio", "largo" (no tiene 12 ni 13 caracteres), "forma", "fecha" o "digito"
 */
export function revisarRfc(texto) {
  const rfc = limpiarRfc(texto);
  const salida = (tipo, motivo) => ({ rfc, tipo, valido: motivo === "", motivo });
  if (!rfc) return salida("", "vacio");
  if (rfc === RFC_PUBLICO_EN_GENERAL) return salida("publico", "");
  if (rfc === RFC_EXTRANJERO) return salida("extranjero", "");
  if (rfc.length !== 12 && rfc.length !== 13) return salida("", "largo");
  const tipo = rfc.length === 12 ? "moral" : "fisica";
  const letras = rfc.length - 9;
  const forma = new RegExp(`^[A-ZÑ&]{${letras}}\\d{6}[A-Z\\d]{2}[A\\d]$`);
  if (!forma.test(rfc)) return salida(tipo, "forma");
  if (!fechaValida(rfc.slice(letras, letras + 6))) return salida(tipo, "fecha");
  if (digitoVerificador(rfc) !== rfc.slice(-1)) return salida(tipo, "digito");
  return salida(tipo, "");
}

/** Busca en un texto el primer RFC que pase la revisión completa. */
export function buscarRfc(texto) {
  const candidatos = String(texto || "").toUpperCase().match(/[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}/g) || [];
  for (const c of candidatos) if (revisarRfc(c).valido) return c;
  return "";
}

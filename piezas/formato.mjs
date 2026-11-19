// Formatos y limpieza de texto que comparten el ticket, la liga y la app.
// Los importes se manejan en centavos y las cantidades en milésimas, siempre como enteros,
// para que la suma nunca arrastre errores de punto flotante.

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Controles, saltos de línea y caracteres invisibles que cambian la dirección del texto.
const CONTROLES = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g;
const INVISIBLES = /[\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g;

function letras(texto) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const partes = [];
    for (const s of new Intl.Segmenter("es", { granularity: "grapheme" }).segment(texto)) partes.push(s.segment);
    return partes;
  }
  return Array.from(texto);
}

function sinSurrogadosSueltos(texto) {
  let limpio = "";
  for (const ch of texto) {
    const c = ch.charCodeAt(0);
    if (ch.length === 1 && c >= 0xd800 && c <= 0xdfff) continue;
    limpio += ch;
  }
  return limpio;
}

/** Texto de un solo renglón, sin controles ni espacios de más, recortado a `limite` letras. */
export function limpiarTexto(valor, limite) {
  let t = sinSurrogadosSueltos(String(valor == null ? "" : valor));
  t = t.replace(CONTROLES, " ").replace(INVISIBLES, "").replace(/\s+/g, " ").trim();
  if (limite) {
    const l = letras(t);
    if (l.length > limite) t = l.slice(0, limite).join("").trim();
  }
  return t;
}

/**
 * Importe escrito por la persona («12», «1,234.50», «12,50», «$280») a centavos. Vacío es 0.
 * Inválido es NaN: «12..75», «-5», «12,345,67» o letras nunca se vuelven un número.
 */
export function leerImporte(texto) {
  let t = String(texto == null ? "" : texto).replace(/[\s$]/g, "");
  if (!t) return 0;
  if (/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(t)) t = t.replace(/,/g, "");
  else if (/^\d*,\d{1,2}$/.test(t)) t = t.replace(",", ".");
  if (!/^\d*\.?\d*$/.test(t) || t === "." || t.length > 12) return NaN;
  const [entero, decimales = ""] = t.split(".");
  return Number(entero || "0") * 100 + Math.round(Number((decimales + "000").slice(0, 3)) / 10);
}

/** Cantidad escrita por la persona («6», «1.5», «0,25») a milésimas. Vacía es 1; inválida es NaN. */
export function leerCantidad(texto) {
  const t = String(texto == null ? "" : texto).replace(/\s/g, "").replace(",", ".");
  if (!t) return 1000;
  if (!/^\d*\.?\d*$/.test(t) || t === "." || t.length > 9) return NaN;
  const [entero, decimales = ""] = t.split(".");
  return Number(entero || "0") * 1000 + Number((decimales + "000").slice(0, 3));
}

/** Centavos a pesos con el formato del ticket: 123450 → «$1,234.50». */
export function formatoPesos(centavos) {
  const c = Math.round(Math.abs(Number(centavos) || 0));
  const entero = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (Number(centavos) < 0 ? "-" : "") + "$" + entero + "." + String(c % 100).padStart(2, "0");
}

/** Milésimas a cantidad legible: 6000 → «6», 1500 → «1.5». */
export function formatoCantidad(milesimas) {
  return (Math.round(milesimas) / 1000).toFixed(3).replace(/\.?0+$/, "");
}

/** Fecha y hora del aparato: «20 nov 2026, 13:05». */
export function formatoFecha(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/** Folio de cuatro cifras: 42 → «0042». */
export function formatoFolio(numero) {
  return String(Math.max(0, Math.floor(Number(numero) || 0))).padStart(4, "0");
}

/** Número con decimal escrito con punto o coma («4,3») a centésimas. Inválido es NaN. */
export function leerDecimal(texto) {
  const t = String(texto == null ? "" : texto).trim().replace(",", ".");
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return NaN;
  return Math.round(Number(t) * 100);
}

/** Calificación en centésimas a texto, como la enseña Google: 450 → «4.5», 400 → «4.0», 425 → «4.25». */
export function formatoCalificacion(centesimas) {
  return (centesimas / 100).toFixed(centesimas % 10 === 0 ? 1 : 2);
}

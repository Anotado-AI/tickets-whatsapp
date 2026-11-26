// Utilidades de texto compartidas por las piezas de la factura.

/** Minúsculas, sin acentos (la ñ se queda) y con un solo espacio entre palabras. */
export function normalizar(texto) {
  return String(texto == null ? "" : texto)
    .toLowerCase()
    .replace(/ñ/g, "\u0001")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\u0001/g, "ñ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pesos con dos decimales y comas: 35200 → «$352.00». */
export function pesos(centavos) {
  const n = Math.round(centavos);
  const signo = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const enteros = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${signo}$${enteros}.${String(abs % 100).padStart(2, "0")}`;
}

/** Pesos sin centavos cuando son exactos: 29900 → «$299»; 60 → «$0.60». */
export function pesosCorto(centavos) {
  const t = pesos(centavos);
  return t.endsWith(".00") ? t.slice(0, -3) : t;
}

/** «$1,234.50» o «1234.5» → 123450 centavos; NaN si no es un importe. */
export function leerPesos(texto) {
  const t = String(texto == null ? "" : texto).replace(/[\s$,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  const [e, d = ""] = t.split(".");
  return Number(e) * 100 + Number((d + "00").slice(0, 2));
}

/** Centavos a número con dos decimales para una API: 35200 → 352. */
export function aPesos(centavos) {
  return Math.round(centavos) / 100;
}

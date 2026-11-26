// Lee el ticket que mandó la app de tickets (o uno escrito igual) y saca lo que va en la factura.
//
//   *Panadería San José*
//   Ticket 0042 · 20 nov 2026, 13:05
//
//   6 × Concha: $72.00
//   1 × Pastel de tres leches: $280.00
//   *Total: $352.00*
//
// Devuelve el negocio, el folio, la fecha, los conceptos (cantidad en milésimas e importes en
// centavos) y si la suma de los conceptos cuadra con el total. Un ticket que no cuadra no se
// factura: se le pregunta al dueño.

import { leerPesos } from "./texto.mjs";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function leerCantidad(texto) {
  const t = String(texto).replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(t)) return NaN;
  const [e, d = ""] = t.split(".");
  return Number(e) * 1000 + Number((d + "000").slice(0, 3));
}

const RENGLON = /^\s*(\d+(?:[.,]\d{1,3})?)\s*[×xX*]\s*(.+?)\s*:\s*(\$?\s*[\d,]+(?:\.\d{1,2})?)\s*$/;
const TOTAL = /^\s*\*?\s*total\s*:\s*(\$?\s*[\d,]+(?:\.\d{1,2})?)\s*\*?\s*$/i;
const ENCABEZADO = /ticket\s+(\d{1,9})\s*[·|-]?\s*(\d{1,2})\s+([a-záéíóú]{3})\w*\.?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/i;

/**
 * @param {string} texto el ticket como llegó por WhatsApp
 * @returns {{ negocio: string, folio: number|null, fecha: {anio,mes,dia,hora,minuto}|null,
 *   conceptos: Array<{ cantidad: number, descripcion: string, importe: number, unitario: number }>,
 *   total: number|null, suma: number, cuadra: boolean }}
 *   cantidad en milésimas; importe (del renglón) y unitario en centavos; unitario puede llevar
 *   decimales de centavo si la cantidad no divide exacto.
 */
export function leerTicket(texto) {
  const lineas = String(texto == null ? "" : texto).replace(/\r\n?/g, "\n").split("\n");
  let negocio = "";
  let folio = null;
  let fecha = null;
  let total = null;
  const conceptos = [];
  for (const linea of lineas) {
    const limpia = linea.trim();
    if (!limpia) continue;
    if (!negocio && /^\*[^*]+\*$/.test(limpia) && !TOTAL.test(limpia)) {
      negocio = limpia.slice(1, -1).trim();
      continue;
    }
    const enc = limpia.match(ENCABEZADO);
    if (enc && folio === null) {
      folio = Number(enc[1]);
      const mes = MESES.indexOf(enc[3].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 3)) + 1;
      if (mes > 0) fecha = { anio: Number(enc[4]), mes, dia: Number(enc[2]), hora: Number(enc[5]), minuto: Number(enc[6]) };
      continue;
    }
    const tot = limpia.match(TOTAL);
    if (tot) {
      total = leerPesos(tot[1]);
      continue;
    }
    const r = limpia.match(RENGLON);
    if (r && total === null) {
      const cantidad = leerCantidad(r[1]);
      const importe = leerPesos(r[3]);
      if (!Number.isFinite(cantidad) || cantidad <= 0 || !Number.isFinite(importe)) continue;
      conceptos.push({ cantidad, descripcion: r[2].replace(/\*/g, "").trim(), importe, unitario: (importe * 1000) / cantidad });
    }
  }
  const suma = conceptos.reduce((s, c) => s + c.importe, 0);
  return { negocio, folio, fecha, conceptos, total, suma, cuadra: total !== null && conceptos.length > 0 && suma === total };
}

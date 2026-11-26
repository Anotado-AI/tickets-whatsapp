// El ticket como texto de WhatsApp. Función pura: mismos datos, mismo mensaje.
//
//   *Panadería San José*
//   Ticket 0042 · 20 nov 2026, 13:05
//
//   6 × Concha: $72.00
//   1 × Pastel de tres leches: $280.00
//   *Total: $352.00*
//   Av. Juárez 120, Puebla
//
//   Gracias por tu compra.
//
//   ¿Necesitas factura? Mándanos tu constancia de situación fiscal o tu RFC, nombre, código postal y régimen.   (solo con factura)
//
//   🎁 Regalo para un amigo: 10% en su primera compra con el código AMIGO10.
//   No hace falta calificarnos para usarlo.
//
//   ¿Cómo te atendimos? Cuéntanos en Google Maps:
//   https://g.page/r/XXXX/review
//
// Reglas de Google que el texto respeta: se pide la opinión a todos y en el mismo tono, no se da
// nada a cambio de calificar y no se piden cinco estrellas. El regalo es para todos los clientes,
// va separado del renglón de la reseña y el ticket dice que no hace falta calificar para usarlo.

import { formatoCantidad, formatoFecha, formatoFolio, formatoPesos, leerCantidad, leerImporte, limpiarTexto } from "./formato.mjs";

export const LIMITE_DESCRIPCION = 60;
export const AVISO_REGALO = "No hace falta calificarnos para usarlo.";
export const PREGUNTA_FACTURA = "¿Necesitas factura? Mándanos tu constancia de situación fiscal o tu RFC, nombre, código postal y régimen.";

// El regalo termina con punto, porque abajo sigue otra oración.
export function conPunto(texto) {
  return /[.!?…)»"']$/.test(texto) ? texto : `${texto}.`;
}

/** Importe de un renglón en centavos: cantidad (milésimas) por precio unitario (centavos). */
export function importeRenglon({ cantidad, unitario }) {
  return Math.round((cantidad * unitario) / 1000);
}

/**
 * Deja solo los conceptos que van en el ticket: cantidad mayor a cero y con descripción o importe.
 * Cantidad que no viene cuenta como 1; descripción vacía se escribe «Consumo».
 * Una cantidad o un precio que no es un número (NaN) o es negativo detiene el ticket con un error:
 * nunca se escribe como $0.00.
 */
export function conceptosDelTicket(conceptos) {
  const lista = [];
  (conceptos || []).forEach((c, i) => {
    const cantidad = c.cantidad === undefined ? 1000 : c.cantidad;
    const unitario = c.unitario === undefined ? 0 : c.unitario;
    if (!Number.isFinite(cantidad) || cantidad < 0 || !Number.isFinite(unitario) || unitario < 0) {
      throw new RangeError(`El concepto ${i + 1} tiene una cantidad o un precio que no es válido`);
    }
    const descripcion = limpiarTexto(c.descripcion, LIMITE_DESCRIPCION);
    if (cantidad === 0 || (!descripcion && unitario === 0)) return;
    lista.push({ cantidad, unitario, descripcion: descripcion || "Consumo" });
  });
  return lista;
}

/**
 * Revisa los renglones tal como los escribió la persona, en texto: { cantidad, descripcion, precio }.
 * Un renglón en blanco se ignora. Si hay errores, el ticket no se debe mandar.
 * @returns {{ conceptos: Array, errores: Array<{ renglon: number, campo: "cantidad" | "precio", motivo: "falta" | "formato" | "cero" }> }}
 *   conceptos en milésimas y centavos, listos para armarMensaje; renglon empieza en 0.
 */
export function revisarConceptos(renglones) {
  const conceptos = [];
  const errores = [];
  (renglones || []).forEach((r, i) => {
    const cant = String(r.cantidad == null ? "" : r.cantidad).trim();
    const descripcion = limpiarTexto(r.descripcion, LIMITE_DESCRIPCION);
    const precio = String(r.precio == null ? "" : r.precio).trim();
    if (!cant && !descripcion && !precio) return;
    const antes = errores.length;
    const cantidad = leerCantidad(cant);
    if (Number.isNaN(cantidad)) errores.push({ renglon: i, campo: "cantidad", motivo: "formato" });
    else if (cantidad === 0) errores.push({ renglon: i, campo: "cantidad", motivo: "cero" });
    const sinPrecio = !precio.replace(/[\s$]/g, "");
    const unitario = sinPrecio ? NaN : leerImporte(precio);
    if (sinPrecio) errores.push({ renglon: i, campo: "precio", motivo: "falta" });
    else if (Number.isNaN(unitario)) errores.push({ renglon: i, campo: "precio", motivo: "formato" });
    if (errores.length === antes) conceptos.push({ cantidad, descripcion, unitario });
  });
  return { conceptos, errores };
}

/** Total del ticket en centavos. */
export function totalTicket(conceptos) {
  return conceptosDelTicket(conceptos).reduce((suma, c) => suma + importeRenglon(c), 0);
}

/** Renglón de un concepto: «6 × Concha: $72.00». */
export function renglonConcepto(c) {
  return `${formatoCantidad(c.cantidad)} × ${c.descripcion}: ${formatoPesos(importeRenglon(c))}`;
}

/**
 * Arma el mensaje del ticket.
 * @param {object} datos
 * @param {string} datos.negocio  nombre del negocio
 * @param {number} datos.folio    número de folio (se escribe con cuatro cifras)
 * @param {Date}   datos.fecha    fecha y hora de la venta
 * @param {Array}  datos.conceptos [{ cantidad: milésimas, descripcion, unitario: centavos }]
 * @param {string} [datos.pie]    dirección, RFC u horario; va bajo el total
 * @param {string} [datos.regalo] regalo para un amigo; va solo si existe
 * @param {string} [datos.resena] liga para calificar en Google
 * @param {boolean} [datos.factura] pregunta si necesita factura; va después del gracias
 */
export function armarMensaje({ negocio, folio, fecha, conceptos, pie, regalo, resena, factura }) {
  const nombre = limpiarTexto(negocio, 40).replace(/\*/g, "");
  const lista = conceptosDelTicket(conceptos);
  const total = lista.reduce((suma, c) => suma + importeRenglon(c), 0);
  const lineas = [];
  if (nombre) lineas.push(`*${nombre}*`);
  lineas.push(`Ticket ${formatoFolio(folio)} · ${formatoFecha(fecha)}`, "");
  for (const c of lista) lineas.push(renglonConcepto(c));
  lineas.push(`*Total: ${formatoPesos(total)}*`);
  const textoPie = limpiarTexto(pie, 120);
  if (textoPie) lineas.push(textoPie);
  lineas.push("", "Gracias por tu compra.");
  if (factura === true) lineas.push("", PREGUNTA_FACTURA);
  const textoRegalo = limpiarTexto(regalo, 120);
  if (textoRegalo) lineas.push("", `🎁 Regalo para un amigo: ${conPunto(textoRegalo)}`, AVISO_REGALO);
  const liga = String(resena || "").trim();
  if (liga) lineas.push("", "¿Cómo te atendimos? Cuéntanos en Google Maps:", liga);
  return lineas.join("\n");
}

// Desglosa los impuestos de precios que ya los traen, como los del ticket.
//
// En el mostrador el precio ya trae el IVA (y el IEPS, si aplica). La factura los separa:
//   $116.00 con IVA de 16%  →  base $100.00 + IVA $16.00
//   $72.00 con IVA de 0%    →  base $72.00 + IVA $0.00
// Con IEPS, el IVA se calcula sobre la base más el IEPS:
//   precio = base × (1 + IEPS) × (1 + IVA)
//
// Todo va en centavos enteros y cada renglón cuadra exacto: base + IEPS + IVA = importe.
// El proveedor de facturas calcula los decimales finales del comprobante; esta cuenta sirve para
// enseñarle al dueño el desglose y revisar que el total de la factura sea el del ticket.

/**
 * @param {number} importe centavos, con impuestos incluidos
 * @param {{ iva?: number, ieps?: number, exento?: boolean }} impuestos tasas en decimal: 0.16, 0.08, 0
 * @returns {{ base: number, ieps: number, iva: number }}
 */
export function desglosar(importe, { iva = 0, ieps = 0, exento = false } = {}) {
  if (!Number.isFinite(importe) || importe < 0) throw new RangeError("El importe no es válido");
  for (const t of [iva, ieps]) if (!Number.isFinite(t) || t < 0 || t >= 1) throw new RangeError("La tasa no es válida");
  const tasaIva = exento ? 0 : iva;
  const factor = (1 + ieps) * (1 + tasaIva);
  const base = Math.round(importe / factor);
  if (ieps > 0 && tasaIva > 0) {
    const montoIeps = Math.round(base * ieps);
    return { base, ieps: montoIeps, iva: importe - base - montoIeps };
  }
  if (ieps > 0) return { base, ieps: importe - base, iva: 0 };
  return { base, ieps: 0, iva: importe - base };
}

/**
 * Desglosa varios conceptos. `impuestosDe(concepto)` dice las tasas de cada uno.
 * @returns {{ renglones: Array, subtotal: number, ieps: number, iva: number, total: number }}
 */
export function desglosarConceptos(conceptos, impuestosDe) {
  const renglones = (conceptos || []).map((c) => ({ ...c, ...desglosar(c.importe, impuestosDe(c)) }));
  const suma = (campo) => renglones.reduce((s, r) => s + r[campo], 0);
  const subtotal = suma("base");
  const ieps = suma("ieps");
  const iva = suma("iva");
  return { renglones, subtotal, ieps, iva, total: subtotal + ieps + iva };
}

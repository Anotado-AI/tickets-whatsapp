// Arma el pedido para crear la factura en la API de Facturapi (POST https://www.facturapi.io/v2/invoices).
//
// Junta lo que sale de la constancia (el cliente), lo que sale del ticket (los conceptos) y lo que
// el dueño decidió una vez (sus productos con su clave del SAT, su unidad y su IVA). Revisa todo
// antes de mandarlo, para que el proveedor no lo rechace por un dato que se puede ver aquí.
//
//   cliente:   { rfc, nombre, codigoPostal, regimen, correo? }
//   conceptos: [{ cantidad (milésimas), descripcion, importe (centavos, con impuestos) }]
//   productos: [{ descripcion, clave, unidad, nombreUnidad?, iva, ieps?, exento?, otrosNombres? }]
//
// Devuelve { pedido, errores }. Si hay errores, el pedido es null: no se manda nada.

import { RFC_EXTRANJERO, RFC_PUBLICO_EN_GENERAL, revisarRfc } from "./rfc.mjs";
import { FORMAS_PAGO, METODOS_PAGO, REGIMENES, USOS } from "./catalogos.mjs";
import { normalizar } from "./texto.mjs";

export const FORMA_POR_DEFINIR = "99";

/** El producto del catálogo del negocio que corresponde a un concepto del ticket, o null. */
export function productoDe(descripcion, productos) {
  const buscado = normalizar(descripcion);
  for (const p of productos || []) {
    const nombres = [p.descripcion, ...(p.otrosNombres || [])].map(normalizar);
    if (nombres.includes(buscado)) return p;
  }
  return null;
}

/** ¿Ese uso de la factura se permite con ese régimen del cliente? (catálogo c_UsoCFDI) */
export function usoPermitido(uso, regimen) {
  const u = USOS.find((x) => x.clave === uso);
  return !!u && u.regimenes.includes(regimen);
}

/** Usos que puede escoger un cliente con ese régimen, en el orden del catálogo. */
export function usosPara(regimen) {
  return USOS.filter((u) => u.regimenes.includes(regimen));
}

function impuestosApi(p) {
  const lista = [];
  if (p.ieps) lista.push({ type: "IEPS", rate: p.ieps });
  if (p.exento) lista.push({ type: "IVA", factor: "Exento" });
  else lista.push({ type: "IVA", rate: p.iva || 0 });
  return lista;
}

// Precio unitario con impuestos, en pesos, con hasta seis decimales (lo que admite la factura).
function precioUnitario(c) {
  return Math.round((c.importe / 100 / (c.cantidad / 1000)) * 1e6) / 1e6;
}

/**
 * @param {object} datos
 * @param {object} datos.cliente
 * @param {Array}  datos.conceptos
 * @param {Array}  datos.productos
 * @param {string} datos.formaPago   «01» efectivo, «04» tarjeta de crédito, «28» de débito, «03» transferencia…
 * @param {string} [datos.metodoPago] «PUE» si ya pagó (por defecto) o «PPD» si paga después
 * @param {string} datos.uso         uso de la factura que pidió el cliente, por ejemplo «G03»
 * @param {number} [datos.folio]
 * @param {string} [datos.serie]
 */
export function armarPedido({ cliente, conceptos, productos, formaPago, metodoPago = "PUE", uso, folio, serie }) {
  const errores = [];
  const c = cliente || {};
  const rfc = revisarRfc(c.rfc);
  const generico = rfc.tipo === "publico" || rfc.tipo === "extranjero";
  if (!rfc.valido) errores.push(`El RFC del cliente no sirve (${rfc.motivo || "vacío"}).`);
  const nombre = String(c.nombre || "").replace(/\s+/g, " ").trim();
  if (!nombre) errores.push("Falta el nombre o razón social del cliente, tal como viene en su constancia.");
  const cp = String(c.codigoPostal || "").trim();
  if (!generico && !/^\d{5}$/.test(cp)) errores.push("Falta el código postal del cliente (cinco cifras, el de su constancia).");
  const regimen = generico ? "616" : String(c.regimen || "").trim();
  const datosRegimen = REGIMENES.find((r) => r.clave === regimen);
  if (!datosRegimen) errores.push("Falta el régimen fiscal del cliente o no está en el catálogo del SAT.");
  else if (rfc.valido && !generico) {
    if (rfc.tipo === "moral" && !datosRegimen.moral) errores.push(`El régimen ${regimen} no es de persona moral y el RFC sí.`);
    if (rfc.tipo === "fisica" && !datosRegimen.fisica) errores.push(`El régimen ${regimen} no es de persona física y el RFC sí.`);
  }
  const usoFinal = generico ? "S01" : String(uso || "").trim();
  if (!USOS.some((u) => u.clave === usoFinal)) errores.push("Falta el uso de la factura que pidió el cliente.");
  else if (datosRegimen && !usoPermitido(usoFinal, regimen)) {
    const opciones = usosPara(regimen).map((u) => u.clave).join(", ");
    errores.push(`El uso ${usoFinal} no se permite con el régimen ${regimen}. Con ese régimen van: ${opciones}.`);
  }
  if (!METODOS_PAGO.some((m) => m.clave === metodoPago)) errores.push("El método de pago es PUE (ya pagó) o PPD (paga después).");
  const forma = String(formaPago || "").trim();
  if (!FORMAS_PAGO.some((f) => f.clave === forma)) errores.push("Falta la forma de pago: efectivo, tarjeta, transferencia…");
  else if (metodoPago === "PPD" && forma !== FORMA_POR_DEFINIR) errores.push("Si paga después (PPD), la forma de pago es 99, por definir.");
  else if (metodoPago === "PUE" && forma === FORMA_POR_DEFINIR) errores.push("Si ya pagó (PUE), la forma de pago no puede ser 99: di cómo pagó.");

  const items = [];
  if (!conceptos || !conceptos.length) errores.push("El ticket no trae conceptos.");
  for (const concepto of conceptos || []) {
    const p = productoDe(concepto.descripcion, productos);
    if (!p) {
      errores.push(`«${concepto.descripcion}» no está en tus productos: falta su clave del SAT, su unidad y su IVA.`);
      continue;
    }
    if (!/^\d{8}$/.test(String(p.clave || ""))) errores.push(`La clave del SAT de «${p.descripcion}» debe tener ocho cifras.`);
    if (!concepto.cantidad || concepto.cantidad <= 0 || !(concepto.importe > 0)) {
      errores.push(`«${concepto.descripcion}» no tiene cantidad o importe.`);
      continue;
    }
    const product = {
      description: concepto.descripcion,
      product_key: String(p.clave),
      unit_key: p.unidad || "H87",
      price: precioUnitario(concepto),
      tax_included: true,
      taxes: impuestosApi(p),
    };
    if (p.nombreUnidad) product.unit_name = String(p.nombreUnidad).slice(0, 20);
    items.push({ quantity: concepto.cantidad / 1000, product });
  }

  if (errores.length) return { pedido: null, errores };
  const customer = { legal_name: nombre, tax_id: rfc.rfc, tax_system: regimen };
  if (cp) customer.address = { zip: cp };
  if (c.correo) customer.email = String(c.correo).trim();
  const pedido = { customer, items, use: usoFinal, payment_form: forma, payment_method: metodoPago };
  if (Number.isInteger(folio) && folio > 0) pedido.folio_number = folio;
  if (serie) pedido.series = String(serie).slice(0, 25);
  return { pedido, errores: [] };
}

export { RFC_PUBLICO_EN_GENERAL, RFC_EXTRANJERO };

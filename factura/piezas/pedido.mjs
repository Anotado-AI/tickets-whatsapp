// Arma el pedido para crear la factura en la API de Facturapi (POST https://www.facturapi.io/v2/invoices).
//
// Junta lo que sale de la constancia (el cliente), lo que sale del ticket (los conceptos) y lo que
// el dueño decidió una vez (sus productos con su clave del SAT, su unidad y su IVA). Revisa todo
// antes de mandarlo, para que el proveedor no lo rechace por un dato que se puede ver aquí.
//
//   cliente:   { rfc, nombre, codigoPostal, regimen, correo? }
//   conceptos: [{ cantidad (milésimas), descripcion, importe (centavos, con impuestos) }]
//   productos: [{ descripcion, clave, unidad, nombreUnidad?, iva, ieps?, exento?, otrosNombres? }]
//   emisor:    { rfc, regimen, codigoPostal? }, los datos fiscales del negocio que factura
//
// Devuelve { pedido, errores, retencionIsr }. Si hay errores, el pedido es null: no se manda nada.
// retencionIsr va en centavos: la que le hace al dueño un cliente persona moral si el dueño es
// persona física en RESICO (Ley del ISR, art. 113-J); 0 en los demás casos.
//
// armarGlobal() arma la factura global de los tickets que nadie pidió facturar.

import { RFC_EXTRANJERO, RFC_PUBLICO_EN_GENERAL, revisarRfc } from "./rfc.mjs";
import { FORMAS_PAGO, METODOS_PAGO, REGIMENES, USOS } from "./catalogos.mjs";
import { normalizar } from "./texto.mjs";
import { desglosar } from "./iva.mjs";

export const FORMA_POR_DEFINIR = "99";
export const REGIMEN_RESICO = "626";
export const TASA_RETENCION_RESICO = 0.0125;
export const NOMBRE_PUBLICO_EN_GENERAL = "PUBLICO EN GENERAL";

/** ¿El cliente le retiene ISR de RESICO al dueño? Solo si el dueño es persona física en 626 y el cliente, persona moral. */
export function retieneIsrResico(emisor, rfcCliente) {
  if (!emisor || String(emisor.regimen || "").trim() !== REGIMEN_RESICO) return false;
  const deEmisor = revisarRfc(emisor.rfc);
  const deCliente = revisarRfc(rfcCliente);
  return deEmisor.rfc.length === 13 && deEmisor.tipo === "fisica" && deCliente.valido && deCliente.tipo === "moral";
}

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
 * @param {object} [datos.emisor]    { rfc, regimen } del negocio; con 626 decide la retención de ISR
 */
export function armarPedido({ cliente, conceptos, productos, formaPago, metodoPago = "PUE", uso, folio, serie, emisor }) {
  const errores = [];
  const c = cliente || {};
  const rfc = revisarRfc(c.rfc);
  const generico = rfc.tipo === "publico" || rfc.tipo === "extranjero";
  if (emisor && String(emisor.regimen || "").trim() === REGIMEN_RESICO && ![12, 13].includes(revisarRfc(emisor.rfc).rfc.length)) {
    errores.push("Estás en RESICO (626): para saber si este cliente te retiene ISR, falta tu RFC.");
  }
  if (generico && normalizar(c.nombre || "") === normalizar(NOMBRE_PUBLICO_EN_GENERAL)) {
    errores.push("La factura a PUBLICO EN GENERAL es la global: ármala con armarGlobal, con el periodo y los tickets.");
  }
  const retiene = retieneIsrResico(emisor, c.rfc);
  let baseRetencion = 0;
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
    if (retiene) {
      // La retención va sobre el importe sin IVA: se manda el precio sin impuestos, con la base del desglose.
      const { base } = desglosar(concepto.importe, { iva: p.iva || 0, ieps: p.ieps || 0, exento: !!p.exento });
      baseRetencion += base;
      product.price = precioUnitario({ importe: base, cantidad: concepto.cantidad });
      product.tax_included = false;
      product.taxes = [...product.taxes, { type: "ISR", rate: TASA_RETENCION_RESICO, withholding: true }];
    }
    if (p.nombreUnidad) product.unit_name = String(p.nombreUnidad).slice(0, 20);
    items.push({ quantity: concepto.cantidad / 1000, product });
  }

  if (errores.length) return { pedido: null, errores, retencionIsr: 0 };
  const customer = { legal_name: nombre, tax_id: rfc.rfc, tax_system: regimen };
  if (cp) customer.address = { zip: cp };
  if (c.correo) customer.email = String(c.correo).trim();
  const pedido = { customer, items, use: usoFinal, payment_form: forma, payment_method: metodoPago };
  if (Number.isInteger(folio) && folio > 0) pedido.folio_number = folio;
  if (serie) pedido.series = String(serie).slice(0, 25);
  return { pedido, errores: [], retencionIsr: Math.round(baseRetencion * TASA_RETENCION_RESICO) };
}

// Periodicidad de la factura global: catálogo c_Periodicidad del SAT y el nombre que usa Facturapi.
export const PERIODICIDADES = [
  { clave: "01", api: "day", nombres: ["diaria", "dia", "día"] },
  { clave: "02", api: "week", nombres: ["semanal", "semana"] },
  { clave: "03", api: "fortnight", nombres: ["quincenal", "quincena"] },
  { clave: "04", api: "month", nombres: ["mensual", "mes"] },
  { clave: "05", api: "two_months", nombres: ["bimestral", "bimestre"] },
];

/** La periodicidad por su clave del SAT, su nombre en español o el de Facturapi; null si no es ninguna. */
export function periodicidadDe(texto) {
  const t = normalizar(String(texto || ""));
  return PERIODICIDADES.find((p) => p.clave === t || p.api === t || p.nombres.map(normalizar).includes(t)) || null;
}

/**
 * La factura global de los tickets que nadie pidió facturar (receptor PUBLICO EN GENERAL, con el
 * objeto `global` que exige Facturapi). Cada ticket es un concepto «Venta» con clave 01010101,
 * unidad ACT y el folio del ticket; si un ticket mezcla tasas, va un concepto por tasa con el mismo
 * folio. Si el dueño es persona física en RESICO, va un concepto por tasa con el total del periodo.
 *
 * @param {object} datos
 * @param {Array}  datos.tickets      [{ folio, conceptos }], como los da leerTicket
 * @param {Array}  datos.productos
 * @param {object} datos.periodo      { periodicidad, mes, anio }: mes «01» a «12» (bimestral: «13» a «18»)
 * @param {string} datos.formaPago    la forma de pago del ticket de mayor importe de los que van en la global (si hay empate, una de las empatadas)
 * @param {object} [datos.emisor]     { rfc, regimen, codigoPostal? }
 * @param {number} [datos.folio]
 * @param {string} [datos.serie]
 * @returns {{ pedido: object|null, errores: string[], total: number }}
 */
export function armarGlobal({ tickets, productos, periodo, formaPago, emisor, folio, serie }) {
  const errores = [];
  const p = periodo || {};
  const periodicidad = periodicidadDe(p.periodicidad);
  if (!periodicidad) errores.push("Falta la periodicidad de la global: diaria, semanal, quincenal, mensual o bimestral.");
  const mes = String(p.mes ?? "").trim().padStart(2, "0");
  const numeroMes = Number(mes);
  if (periodicidad && periodicidad.clave === "05") {
    if (!(numeroMes >= 13 && numeroMes <= 18)) errores.push("En la global bimestral el mes va de 13 (enero y febrero) a 18 (noviembre y diciembre).");
  } else if (!(numeroMes >= 1 && numeroMes <= 12)) errores.push("Falta el mes de la global, de 01 a 12.");
  const anio = Number(p.anio);
  if (!Number.isInteger(anio) || anio < 2022 || anio > 2100) errores.push("Falta el año de la global, con cuatro cifras.");
  const forma = String(formaPago || "").trim();
  if (!FORMAS_PAGO.some((f) => f.clave === forma) || forma === FORMA_POR_DEFINIR) errores.push("Falta la forma de pago de la global (la del ticket de mayor importe de los que van en la global); no puede ser 99.");
  if (!tickets || !tickets.length) errores.push("No hay tickets para la global.");

  const resicoFisica = !!emisor && String(emisor.regimen || "").trim() === REGIMEN_RESICO && revisarRfc(emisor.rfc).rfc.length === 13;
  const grupos = new Map(); // folio (o «periodo» en RESICO) + tasas → importe
  const folios = new Set();
  let total = 0;
  for (const t of tickets || []) {
    const f = t && Number.isInteger(t.folio) && t.folio > 0 ? t.folio : null;
    if (!resicoFisica) {
      if (!f) { errores.push("Un ticket no trae folio: en la global cada venta va con el número de su ticket."); continue; }
      if (folios.has(f)) { errores.push(`El ticket ${f} viene dos veces.`); continue; }
      folios.add(f);
    }
    if (!t.conceptos || !t.conceptos.length) { errores.push(`El ticket ${f ?? "sin folio"} no trae conceptos.`); continue; }
    for (const concepto of t.conceptos) {
      const prod = productoDe(concepto.descripcion, productos);
      if (!prod) { errores.push(`«${concepto.descripcion}» (ticket ${f ?? "sin folio"}) no está en tus productos: falta su IVA.`); continue; }
      if (!(concepto.importe > 0)) { errores.push(`«${concepto.descripcion}» (ticket ${f ?? "sin folio"}) no tiene importe.`); continue; }
      const impuestos = impuestosApi(prod);
      const llave = `${resicoFisica ? "periodo" : f}|${JSON.stringify(impuestos)}`;
      const g = grupos.get(llave) || { folio: resicoFisica ? null : f, impuestos, importe: 0 };
      g.importe += concepto.importe;
      grupos.set(llave, g);
      total += concepto.importe;
    }
  }
  if (errores.length) return { pedido: null, errores, total: 0 };

  const items = [...grupos.values()].map((g) => {
    const product = { description: "Venta", product_key: "01010101", unit_key: "ACT", price: g.importe / 100, tax_included: true, taxes: g.impuestos };
    if (g.folio) product.sku = String(g.folio);
    return { quantity: 1, product };
  });
  const customer = { legal_name: NOMBRE_PUBLICO_EN_GENERAL, tax_id: RFC_PUBLICO_EN_GENERAL, tax_system: "616" };
  const cp = String((emisor && emisor.codigoPostal) || "").trim();
  if (/^\d{5}$/.test(cp)) customer.address = { zip: cp };
  const pedido = {
    customer,
    items,
    use: "S01",
    payment_form: forma,
    payment_method: "PUE",
    global: { periodicity: periodicidad.api, months: mes, year: anio },
  };
  if (Number.isInteger(folio) && folio > 0) pedido.folio_number = folio;
  if (serie) pedido.series = String(serie).slice(0, 25);
  return { pedido, errores: [], total };
}

export { RFC_PUBLICO_EN_GENERAL, RFC_EXTRANJERO };

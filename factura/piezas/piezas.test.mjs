import { test } from "node:test";
import assert from "node:assert/strict";
import { buscarRfc, digitoVerificador, limpiarRfc, revisarRfc } from "./rfc.mjs";
import { leerConstancia, leerRegimenes, quitarRegimenCapital } from "./constancia.mjs";
import { leerTicket } from "./ticket.mjs";
import { desglosar, desglosarConceptos } from "./iva.mjs";
import { armarGlobal, armarPedido, periodicidadDe, productoDe, retieneIsrResico, usoPermitido, usosPara } from "./pedido.mjs";
import { REGIMENES, USOS } from "./catalogos.mjs";
import { leerPesos, normalizar, pesos } from "./texto.mjs";

// Texto con la forma de una constancia de persona moral (datos de prueba, no de un contribuyente real).
const CONSTANCIA_MORAL = `CÉDULA DE IDENTIFICACIÓN FISCAL
EKU9003173C9
Registro Federal de Contribuyentes
ESCUELA KEMPER URGATE
Nombre, denominación o razón social
CONSTANCIA DE SITUACIÓN FISCAL
Datos de Identificación del Contribuyente:
RFC: EKU9003173C9
Denominación/Razón Social: ESCUELA KEMPER URGATE
Régimen Capital: SOCIEDAD ANONIMA DE CAPITAL VARIABLE
Nombre Comercial:
Fecha inicio de operaciones: 17 DE MARZO DE 1990
Estatus en el padrón: ACTIVO
Datos del domicilio registrado
Código Postal:26015 Tipo de Vialidad: CALLE
Nombre de Vialidad: PRINCIPAL Número Exterior: 10
Actividades Económicas:
Orden Actividad Económica Porcentaje Fecha Inicio Fecha Fin
1 Escuelas de educación primaria del sector privado 100 17/03/1990
Regímenes:
Régimen Fecha Inicio Fecha Fin
Régimen General de Ley Personas Morales 17/03/1990
Obligaciones:
Descripción de la Obligación Descripción Vencimiento Fecha Inicio Fecha Fin
Declaración anual de ISR del ejercicio Personas morales. 01/01/2015`;

// Persona física con un régimen que ya terminó y otro vigente.
const CONSTANCIA_FISICA = `RFC: CACX7605101P8
CURP: CACX760510MGTSHC04
Nombre (s): XOCHILT Primer Apellido: CASAS
Segundo Apellido: CHAVEZ
Estatus en el padrón: ACTIVO
Código Postal:36257 Tipo de Vialidad: CALLE Nombre de Vialidad: JUAREZ
Regímenes:
Régimen Fecha Inicio Fecha Fin
Régimen de Incorporación Fiscal 01/01/2014 31/12/2021
Régimen Simplificado de Confianza 01/01/2022
Obligaciones:`;

test("RFC: dígito verificador de RFC públicos y de prueba", () => {
  for (const r of ["SAT970701NN3", "IMS421231I45", "BBA830831LJ2", "EKU9003173C9", "URE180429TM6", "CACX7605101P8"]) {
    assert.equal(digitoVerificador(r), r.slice(-1), r);
    assert.equal(revisarRfc(r).valido, true, r);
  }
});

test("RFC: limpieza, tipos y motivos", () => {
  assert.equal(limpiarRfc(" eku-900317 3c9 "), "EKU9003173C9");
  assert.equal(revisarRfc("EKU9003173C9").tipo, "moral");
  assert.equal(revisarRfc("CACX7605101P8").tipo, "fisica");
  assert.deepEqual(revisarRfc("XAXX010101000"), { rfc: "XAXX010101000", tipo: "publico", valido: true, motivo: "" });
  assert.equal(revisarRfc("XEXX010101000").tipo, "extranjero");
  assert.equal(revisarRfc("").motivo, "vacio");
  assert.equal(revisarRfc("EKU900317").motivo, "largo");
  assert.equal(revisarRfc("EK19003173C9").motivo, "forma");
  assert.equal(revisarRfc("EKU9013173C9").motivo, "fecha", "mes 13");
  assert.equal(revisarRfc("EKU9003173C8").motivo, "digito", "un dígito mal copiado");
  assert.equal(revisarRfc("EKU9OO3173C9").motivo, "forma", "letra O en lugar de cero");
});

test("RFC: lo encuentra en un texto aunque haya otros parecidos", () => {
  assert.equal(buscarRfc("folio EKU9003173C8 y RFC EKU9003173C9"), "EKU9003173C9");
  assert.equal(buscarRfc("sin rfc aquí"), "");
});

test("constancia de persona moral: RFC, razón social sin régimen de capital, CP y régimen", () => {
  const c = leerConstancia(CONSTANCIA_MORAL);
  assert.equal(c.rfc, "EKU9003173C9");
  assert.equal(c.tipo, "moral");
  assert.equal(c.nombre, "ESCUELA KEMPER URGATE");
  assert.equal(c.codigoPostal, "26015");
  assert.deepEqual(c.regimenes.map((r) => r.clave), ["601"]);
  assert.equal(c.estatus, "ACTIVO");
  assert.deepEqual(c.faltan, []);
  assert.deepEqual(c.avisos, []);
});

test("constancia de persona física: nombre y apellidos aunque vengan en el mismo renglón; sin el régimen que ya terminó", () => {
  const c = leerConstancia(CONSTANCIA_FISICA);
  assert.equal(c.rfc, "CACX7605101P8");
  assert.equal(c.tipo, "fisica");
  assert.equal(c.nombre, "XOCHILT CASAS CHAVEZ");
  assert.equal(c.codigoPostal, "36257");
  assert.deepEqual(c.regimenes.map((r) => r.clave), ["626"]);
});

test("constancia con la razón social escrita con S.A. de C.V.: se quita y se avisa", () => {
  const c = leerConstancia("RFC: EKU9003173C9\nDenominación/Razón Social: ESCUELA KEMPER URGATE, S.A. DE C.V.\nCódigo Postal: 26015\nRégimen fiscal: 601 General de Ley Personas Morales");
  assert.equal(c.nombre, "ESCUELA KEMPER URGATE");
  assert.equal(c.avisos.length, 1);
  assert.deepEqual(c.regimenes.map((r) => r.clave), ["601"]);
  for (const [con, sin] of [["ACME SA DE CV", "ACME"], ["ACME S.A.P.I. DE C.V.", "ACME"], ["ACME S. DE R.L. DE C.V.", "ACME"], ["ACME, A.C.", "ACME"], ["CASA SAN JOSE", "CASA SAN JOSE"]]) {
    assert.equal(quitarRegimenCapital(con), sin, con);
  }
});

test("constancia con dos regímenes vigentes: los dos, y aviso para preguntar", () => {
  const c = leerConstancia(CONSTANCIA_FISICA.replace("01/01/2014 31/12/2021", "01/01/2014") + "");
  assert.deepEqual(c.regimenes.map((r) => r.clave), ["621", "626"]);
  assert.ok(c.avisos.some((a) => a.includes("más de un régimen")));
});

test("constancia incompleta o con RFC mal leído", () => {
  const c = leerConstancia("RFC: EKU9003173C8\nDenominación/Razón Social: ESCUELA KEMPER URGATE");
  assert.ok(c.avisos.some((a) => a.includes("no pasa la revisión")));
  assert.deepEqual(c.faltan, ["codigoPostal", "regimen"]);
  assert.deepEqual(leerConstancia("").faltan, ["rfc", "nombre", "codigoPostal", "regimen"]);
  const suspendido = leerConstancia(CONSTANCIA_MORAL.replace("ACTIVO", "SUSPENDIDO"));
  assert.ok(suspendido.avisos.some((a) => a.includes("SUSPENDIDO")));
});

test("regímenes: con clave escrita o por su nombre, sin confundir actividades", () => {
  assert.deepEqual(leerRegimenes("Régimen fiscal: 612 Personas Físicas con Actividades Empresariales y Profesionales").map((r) => r.clave), ["612"]);
  assert.deepEqual(leerRegimenes("Regímenes:\nRégimen de Sueldos y Salarios e Ingresos Asimilados a Salarios 01/02/2010\nObligaciones:\nArrendamiento de algo").map((r) => r.clave), ["605"]);
  for (const r of REGIMENES) assert.equal(leerRegimenes(`Regímenes:\nRégimen ${r.nombre} 01/01/2022\nObligaciones:`)[0]?.clave, r.clave, r.nombre);
});

const TICKET = `*Panadería San José*
Ticket 0042 · 20 nov 2026, 13:05

6 × Concha: $72.00
1 × Pastel de tres leches: $280.00
*Total: $352.00*
Av. Juárez 120, Puebla

Gracias por tu compra.

¿Necesitas factura? Mándanos tu constancia de situación fiscal o tu RFC, nombre, código postal y régimen.

¿Cómo te atendimos? Cuéntanos en Google Maps:
https://anotado.ai/tickets/ejemplo/`;

test("ticket: negocio, folio, fecha, conceptos y total que cuadra", () => {
  const t = leerTicket(TICKET);
  assert.equal(t.negocio, "Panadería San José");
  assert.equal(t.folio, 42);
  assert.deepEqual(t.fecha, { anio: 2026, mes: 11, dia: 20, hora: 13, minuto: 5 });
  assert.deepEqual(t.conceptos, [
    { cantidad: 6000, descripcion: "Concha", importe: 7200, unitario: 1200 },
    { cantidad: 1000, descripcion: "Pastel de tres leches", importe: 28000, unitario: 28000 },
  ]);
  assert.equal(t.total, 35200);
  assert.equal(t.cuadra, true);
});

test("ticket: decimales, miles, «x» en lugar de «×» y un ticket que no cuadra", () => {
  const t = leerTicket("Ticket 7 · 3 ene 2026, 9:07\n1.5 × Queso Oaxaca (kg): $284.85\n2 x Café: $1,090.00\nTotal: $1,374.85");
  assert.deepEqual(t.conceptos.map((c) => [c.cantidad, c.descripcion, c.importe]), [[1500, "Queso Oaxaca (kg)", 28485], [2000, "Café", 109000]]);
  assert.equal(t.cuadra, true);
  assert.equal(leerTicket("1 × Pan: $10.00\nTotal: $11.00").cuadra, false);
  assert.equal(leerTicket("hola").cuadra, false);
});

test("pesos: escritura y lectura", () => {
  assert.equal(pesos(35200), "$352.00");
  assert.equal(pesos(123456789), "$1,234,567.89");
  assert.equal(leerPesos("$1,234.5"), 123450);
  assert.ok(Number.isNaN(leerPesos("12..5")));
  assert.equal(normalizar("  Pastel  de TRES Leches "), "pastel de tres leches");
  assert.equal(normalizar("Panadería Señor"), "panaderia señor");
});

test("IVA: desglose de precios que ya lo traen, exacto al centavo", () => {
  assert.deepEqual(desglosar(11600, { iva: 0.16 }), { base: 10000, ieps: 0, iva: 1600 });
  assert.deepEqual(desglosar(7200, { iva: 0 }), { base: 7200, ieps: 0, iva: 0 });
  assert.deepEqual(desglosar(7200, { iva: 0.16, exento: true }), { base: 7200, ieps: 0, iva: 0 });
  assert.deepEqual(desglosar(10800, { ieps: 0.08 }), { base: 10000, ieps: 800, iva: 0 });
  assert.deepEqual(desglosar(12528, { ieps: 0.08, iva: 0.16 }), { base: 10000, ieps: 800, iva: 1728 });
  for (let importe = 1; importe < 5000; importe += 7) {
    for (const t of [{ iva: 0.16 }, { iva: 0.08 }, { iva: 0 }, { ieps: 0.08 }, { ieps: 0.08, iva: 0.16 }]) {
      const d = desglosar(importe, t);
      assert.equal(d.base + d.ieps + d.iva, importe, `${importe} ${JSON.stringify(t)}`);
    }
  }
  assert.throws(() => desglosar(-1, { iva: 0.16 }), RangeError);
  assert.throws(() => desglosar(100, { iva: 16 }), RangeError);
});

test("IVA: varios conceptos con tasas distintas suman el total del ticket", () => {
  const conceptos = [{ descripcion: "Concha", importe: 7200 }, { descripcion: "Café americano", importe: 9000 }];
  const d = desglosarConceptos(conceptos, (c) => (c.descripcion === "Café americano" ? { iva: 0.16 } : { iva: 0 }));
  assert.equal(d.total, 16200);
  assert.equal(d.iva, 9000 - Math.round(9000 / 1.16));
  assert.equal(d.subtotal + d.iva, 16200);
});

const PRODUCTOS = [
  { descripcion: "Concha", clave: "50181901", unidad: "H87", nombreUnidad: "Pieza", iva: 0 },
  { descripcion: "Pastel de tres leches", clave: "50182001", unidad: "H87", nombreUnidad: "Pieza", iva: 0, otrosNombres: ["Pastel 3 leches"] },
  { descripcion: "Café americano", clave: "50201708", unidad: "H87", iva: 0.16 },
];
const CLIENTE = { rfc: "EKU9003173C9", nombre: "ESCUELA KEMPER URGATE", codigoPostal: "26015", regimen: "601" };

test("usos: el catálogo del SAT decide qué uso va con qué régimen", () => {
  assert.equal(usoPermitido("G03", "601"), true);
  assert.equal(usoPermitido("G03", "605"), false, "un asalariado no deduce gastos en general");
  assert.equal(usoPermitido("S01", "605"), true);
  assert.equal(usoPermitido("G03", "626"), true);
  assert.ok(usosPara("616").every((u) => ["G02", "S01", "CP01"].includes(u.clave)));
  assert.equal(USOS.length, 24);
});

test("pedido para Facturapi con los datos de la constancia y del ticket", () => {
  const t = leerTicket(TICKET);
  const { pedido, errores } = armarPedido({ cliente: CLIENTE, conceptos: t.conceptos, productos: PRODUCTOS, formaPago: "01", uso: "G03", folio: t.folio });
  assert.deepEqual(errores, []);
  assert.deepEqual(pedido, {
    customer: { legal_name: "ESCUELA KEMPER URGATE", tax_id: "EKU9003173C9", tax_system: "601", address: { zip: "26015" } },
    items: [
      { quantity: 6, product: { description: "Concha", product_key: "50181901", unit_key: "H87", price: 12, tax_included: true, taxes: [{ type: "IVA", rate: 0 }], unit_name: "Pieza" } },
      { quantity: 1, product: { description: "Pastel de tres leches", product_key: "50182001", unit_key: "H87", price: 280, tax_included: true, taxes: [{ type: "IVA", rate: 0 }], unit_name: "Pieza" } },
    ],
    use: "G03",
    payment_form: "01",
    payment_method: "PUE",
    folio_number: 42,
  });
});

test("pedido: productos por otro nombre, precio con decimales y IEPS", () => {
  assert.equal(productoDe("pastel 3 LECHES", PRODUCTOS).clave, "50182001");
  assert.equal(productoDe("Dona", PRODUCTOS), null);
  const { pedido } = armarPedido({
    cliente: CLIENTE,
    conceptos: [{ cantidad: 3000, descripcion: "Café americano", importe: 10000 }, { cantidad: 1000, descripcion: "Galleta", importe: 2160 }],
    productos: [...PRODUCTOS, { descripcion: "Galleta", clave: "50181905", unidad: "H87", iva: 0, ieps: 0.08 }],
    formaPago: "28",
    uso: "G03",
  });
  assert.equal(pedido.items[0].product.price, 33.333333);
  assert.deepEqual(pedido.items[1].product.taxes, [{ type: "IEPS", rate: 0.08 }, { type: "IVA", rate: 0 }]);
  assert.ok(!("folio_number" in pedido));
});

test("pedido: errores que frenan el envío, dichos para el dueño", () => {
  const base = { cliente: CLIENTE, conceptos: [{ cantidad: 1000, descripcion: "Concha", importe: 1200 }], productos: PRODUCTOS, formaPago: "01", uso: "G03" };
  const casos = [
    [{ cliente: { ...CLIENTE, rfc: "EKU9003173C8" } }, "RFC"],
    [{ cliente: { ...CLIENTE, nombre: " " } }, "nombre"],
    [{ cliente: { ...CLIENTE, codigoPostal: "2601" } }, "código postal"],
    [{ cliente: { ...CLIENTE, regimen: "999" } }, "régimen"],
    [{ cliente: { ...CLIENTE, regimen: "605" } }, "no es de persona moral"],
    [{ cliente: { ...CLIENTE, rfc: "CACX7605101P8", regimen: "605" } }, "no se permite"],
    [{ uso: "" }, "uso"],
    [{ formaPago: "" }, "forma de pago"],
    [{ metodoPago: "PPD" }, "99"],
    [{ formaPago: "99" }, "no puede ser 99"],
    [{ conceptos: [{ cantidad: 1000, descripcion: "Dona", importe: 1500 }] }, "no está en tus productos"],
    [{ conceptos: [] }, "no trae conceptos"],
  ];
  for (const [cambio, texto] of casos) {
    const { pedido, errores } = armarPedido({ ...base, ...cambio });
    assert.equal(pedido, null, texto);
    assert.ok(errores.some((e) => e.includes(texto)), `${texto}: ${errores.join(" | ")}`);
  }
});

test("pedido: público en general va con régimen 616 y uso S01, sin código postal", () => {
  const { pedido, errores } = armarPedido({
    cliente: { rfc: "XAXX010101000", nombre: "MARIA LOPEZ" },
    conceptos: [{ cantidad: 1000, descripcion: "Concha", importe: 1200 }],
    productos: PRODUCTOS,
    formaPago: "01",
    uso: "G03",
  });
  assert.deepEqual(errores, []);
  assert.equal(pedido.customer.tax_system, "616");
  assert.equal(pedido.use, "S01");
  assert.ok(!("address" in pedido.customer));
});

// Retención de ISR en RESICO (Ley del ISR, art. 113-J): persona física en 626 que le vende a una persona moral.
const DUENO_RESICO = { rfc: "CACX7605101P8", regimen: "626" };
const REFRESCO = { descripcion: "Refresco", clave: "50202306", unidad: "H87", iva: 0.16 };

test("retención: el dueño en RESICO le vende a una empresa y le retienen $4.40 de ISR sobre $352", () => {
  const t = leerTicket(TICKET);
  const { pedido, errores, retencionIsr } = armarPedido({ cliente: CLIENTE, conceptos: t.conceptos, productos: PRODUCTOS, formaPago: "01", uso: "G03", folio: t.folio, emisor: DUENO_RESICO });
  assert.deepEqual(errores, []);
  assert.equal(retencionIsr, 440);
  assert.equal(35200 - retencionIsr, 34760, "total a recibir $347.60");
  for (const item of pedido.items) {
    assert.equal(item.product.tax_included, false, "precio sin impuestos para que la retención salga sobre la base sin IVA");
    assert.deepEqual(item.product.taxes, [{ type: "IVA", rate: 0 }, { type: "ISR", rate: 0.0125, withholding: true }]);
  }
  assert.deepEqual(pedido.items.map((i) => i.product.price), [12, 280]);
});

test("retención: con IVA de 16% la base es el precio sin IVA", () => {
  const { pedido, retencionIsr } = armarPedido({
    cliente: CLIENTE,
    conceptos: [{ cantidad: 6000, descripcion: "Concha", importe: 7200 }, { cantidad: 1000, descripcion: "Refresco", importe: 2500 }],
    productos: [...PRODUCTOS, REFRESCO],
    formaPago: "01",
    uso: "G03",
    emisor: DUENO_RESICO,
  });
  assert.equal(pedido.items[1].product.price, 21.55, "$25.00 con IVA → $21.55 sin IVA");
  assert.equal(retencionIsr, Math.round((7200 + 2155) * 0.0125));
});

test("retención: sin RESICO, a persona física o en RESICO de persona moral no hay retención", () => {
  const t = leerTicket(TICKET);
  const base = { cliente: CLIENTE, conceptos: t.conceptos, productos: PRODUCTOS, formaPago: "01", uso: "G03" };
  const con612 = armarPedido({ ...base, emisor: { rfc: "CACX7605101P8", regimen: "612" } });
  assert.equal(con612.retencionIsr, 0);
  assert.ok(con612.pedido.items.every((i) => i.product.tax_included && i.product.taxes.length === 1));
  assert.equal(armarPedido({ ...base, emisor: { rfc: "XIA190128J61", regimen: "626" } }).retencionIsr, 0, "RESICO de persona moral");
  assert.equal(armarPedido({ ...base, emisor: { rfc: "XIA190128J61", regimen: "601" } }).retencionIsr, 0);
  const aFisica = armarPedido({ ...base, cliente: { rfc: "CACX7605101P8", nombre: "XOCHILT CASAS CHAVEZ", codigoPostal: "36257", regimen: "612" }, emisor: { rfc: "FUNK671228PH6", regimen: "626" } });
  assert.deepEqual(aFisica.errores, []);
  assert.equal(aFisica.retencionIsr, 0, "a persona física no se retiene");
  assert.equal(armarPedido(base).retencionIsr, 0, "sin datos del emisor");
  assert.equal(retieneIsrResico(DUENO_RESICO, "XAXX010101000"), false);
  const sinRfc = armarPedido({ ...base, emisor: { regimen: "626" } });
  assert.equal(sinRfc.pedido, null);
  assert.ok(sinRfc.errores.some((e) => e.includes("falta tu RFC")));
});

// Factura global: receptor PUBLICO EN GENERAL con el objeto `global` que exige Facturapi.
const TICKETS_DEL_MES = [
  { folio: 42, conceptos: [{ cantidad: 6000, descripcion: "Concha", importe: 7200 }, { cantidad: 1000, descripcion: "Pastel de tres leches", importe: 28000 }] },
  { folio: 43, conceptos: [{ cantidad: 2000, descripcion: "Concha", importe: 2400 }, { cantidad: 1000, descripcion: "Refresco", importe: 2500 }] },
];

test("global: un concepto «Venta» por ticket y por tasa, con su folio y el objeto global", () => {
  const { pedido, errores, total } = armarGlobal({ tickets: TICKETS_DEL_MES, productos: [...PRODUCTOS, REFRESCO], periodo: { periodicidad: "mensual", mes: "11", anio: 2026 }, formaPago: "01", emisor: { rfc: "XIA190128J61", regimen: "601", codigoPostal: "06010" } });
  assert.deepEqual(errores, []);
  assert.equal(total, 40100);
  assert.deepEqual(pedido.customer, { legal_name: "PUBLICO EN GENERAL", tax_id: "XAXX010101000", tax_system: "616", address: { zip: "06010" } });
  assert.equal(pedido.use, "S01");
  assert.deepEqual(pedido.global, { periodicity: "month", months: "11", year: 2026 });
  const venta = (sku, price, rate) => ({ quantity: 1, product: { description: "Venta", product_key: "01010101", unit_key: "ACT", price, tax_included: true, taxes: [{ type: "IVA", rate }], sku } });
  assert.deepEqual(pedido.items, [venta("42", 352, 0), venta("43", 24, 0), venta("43", 25, 0.16)]);
});

test("global: en RESICO de persona física va el total del periodo por tasa", () => {
  const { pedido } = armarGlobal({ tickets: TICKETS_DEL_MES, productos: [...PRODUCTOS, REFRESCO], periodo: { periodicidad: "04", mes: 11, anio: 2026 }, formaPago: "01", emisor: DUENO_RESICO });
  assert.deepEqual(pedido.items.map((i) => [i.product.price, i.product.taxes[0].rate, "sku" in i.product]), [[376, 0, false], [25, 0.16, false]]);
  assert.ok(!("address" in pedido.customer), "sin código postal del emisor, Facturapi pone el del lugar de expedición");
});

test("global: errores que frenan el envío", () => {
  assert.equal(periodicidadDe("Quincenal").api, "fortnight");
  assert.equal(periodicidadDe("two_months").clave, "05");
  assert.equal(periodicidadDe("anual"), null);
  const base = { tickets: TICKETS_DEL_MES, productos: [...PRODUCTOS, REFRESCO], periodo: { periodicidad: "mensual", mes: "11", anio: 2026 }, formaPago: "01" };
  const casos = [
    [{ periodo: { mes: "11", anio: 2026 } }, "periodicidad"],
    [{ periodo: { periodicidad: "mensual", mes: "13", anio: 2026 } }, "de 01 a 12"],
    [{ periodo: { periodicidad: "bimestral", mes: "11", anio: 2026 } }, "13 (enero y febrero)"],
    [{ periodo: { periodicidad: "mensual", mes: "11", anio: 26 } }, "año"],
    [{ formaPago: "99" }, "no puede ser 99"],
    [{ tickets: [] }, "No hay tickets"],
    [{ tickets: [{ conceptos: TICKETS_DEL_MES[0].conceptos }] }, "no trae folio"],
    [{ tickets: [TICKETS_DEL_MES[0], TICKETS_DEL_MES[0]] }, "dos veces"],
    [{ productos: PRODUCTOS }, "«Refresco» (ticket 43) no está en tus productos"],
  ];
  for (const [cambio, texto] of casos) {
    const { pedido, errores } = armarGlobal({ ...base, ...cambio });
    assert.equal(pedido, null, texto);
    assert.ok(errores.some((e) => e.includes(texto)), `${texto}: ${errores.join(" | ")}`);
  }
  const directo = armarPedido({ cliente: { rfc: "XAXX010101000", nombre: "Público en general" }, conceptos: [{ cantidad: 1000, descripcion: "Concha", importe: 1200 }], productos: PRODUCTOS, formaPago: "01", uso: "S01" });
  assert.ok(directo.errores.some((e) => e.includes("armarGlobal")), "la global no se arma como factura de un cliente");
});


#!/usr/bin/env node
// Factura un ticket con la constancia del cliente, por la API de Facturapi, con tu propia llave.
//
//   FACTURAPI_KEY=sk_test_… node facturar.mjs --ticket ticket.txt --constancia constancia.txt \
//     --productos productos.json --forma 01 --uso G03
//
// Opciones:
//   --ticket       el ticket como llegó por WhatsApp, en texto
//   --constancia   la constancia del cliente en texto (.txt) o en PDF con texto (.pdf, usa pdftotext)
//   --productos    tus productos con su clave del SAT, unidad e IVA (ver ejemplo/productos.json)
//   --forma        forma de pago: 01 efectivo, 03 transferencia, 04 tarjeta de crédito, 28 de débito
//   --uso          uso de la factura que pidió el cliente: G03 gastos en general, G01 mercancías, S01…
//   --regimen      régimen del cliente, si su constancia trae más de uno
//   --correo       correo del cliente, si quiere que el proveedor también se la mande
//   --salida       carpeta para el PDF y el XML (por defecto, la actual)
//   --revisar      solo enseña el pedido, no factura
//
// Tus datos fiscales (RFC y régimen) los lee de Facturapi con tu llave. Si eres persona física en
// RESICO (626) y el cliente es persona moral, la factura lleva la retención de ISR de 1.25% sobre el
// importe sin IVA (Ley del ISR, art. 113-J) y el script te dice cuánto vas a recibir. Con --revisar y
// sin llave, pásalos con --rfc-emisor y --regimen-emisor.
//
// Factura global de los tickets que nadie pidió facturar:
//
//   FACTURAPI_KEY=sk_test_… node facturar.mjs --global --tickets tickets/ --productos productos.json \
//     --periodicidad mensual --mes 11 --anio 2026 --forma 01
//
//   --tickets       una carpeta con un .txt por ticket, o los archivos separados por comas
//   --periodicidad  diaria, semanal, quincenal, mensual o bimestral
//   --mes           01 a 12 (bimestral: 13 enero y febrero … 18 noviembre y diciembre)
//   --anio          el año, con cuatro cifras
//   --forma         la forma de pago del ticket de mayor importe de los que van en la global (si hay empate, una de las empatadas)
//
// Con una llave sk_test_ la factura es de prueba: no va al SAT. Con sk_live_ es real.
// La llave va en la variable FACTURAPI_KEY; este script nunca la escribe en pantalla.

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { leerTicket } from "../piezas/ticket.mjs";
import { leerConstancia } from "../piezas/constancia.mjs";
import { armarGlobal, armarPedido, periodicidadDe, TASA_RETENCION_RESICO } from "../piezas/pedido.mjs";
import { pesos } from "../piezas/texto.mjs";

const API = "https://www.facturapi.io/v2";

function opciones(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const clave = a.slice(2);
    if (clave === "revisar" || clave === "global") o[clave] = true;
    else o[clave] = argv[++i];
  }
  return o;
}

function textoDePdf(ruta) {
  return new Promise((ok, mal) => {
    execFile("pdftotext", ["-layout", ruta, "-"], { maxBuffer: 8 * 1024 * 1024 }, (error, salida) => {
      if (error) mal(new Error("No pude leer el PDF. Instala pdftotext (poppler) o pásame la constancia en texto."));
      else ok(salida);
    });
  });
}

async function api(ruta, llave, { metodo = "GET", cuerpo, formato = "json" } = {}) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { Authorization: `Bearer ${llave}`, "Accept-Language": "es", ...(cuerpo ? { "Content-Type": "application/json" } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!r.ok) {
    let detalle = "";
    try {
      const e = await r.json();
      detalle = [e.message, ...(e.errors || []).map((x) => x.message || JSON.stringify(x))].filter(Boolean).join(" · ");
    } catch { detalle = await r.text().catch(() => ""); }
    throw new Error(`Facturapi respondió ${r.status}: ${detalle}`);
  }
  return formato === "json" ? r.json() : Buffer.from(await r.arrayBuffer());
}

// Tus datos fiscales: de Facturapi si hay llave; si no, de --rfc-emisor y --regimen-emisor.
async function datosEmisor(o, llave) {
  if (llave) {
    const org = await api("/organizations/me", llave);
    const legal = org.legal || {};
    return { rfc: legal.tax_id || "", regimen: legal.tax_system || "", codigoPostal: (legal.address && legal.address.zip) || "", nombre: legal.legal_name || "" };
  }
  if (o["rfc-emisor"] || o["regimen-emisor"]) return { rfc: o["rfc-emisor"] || "", regimen: o["regimen-emisor"] || "" };
  return null;
}

function leerLlave(o) {
  const llave = (process.env.FACTURAPI_KEY || "").trim();
  if (llave && !/^sk_(test|live)_/.test(llave)) throw new Error("La llave de FACTURAPI_KEY debe empezar con sk_test_ o sk_live_.");
  if (!llave && !o.revisar) throw new Error("Pon tu llave de Facturapi en la variable FACTURAPI_KEY (empieza con sk_test_ o sk_live_).");
  return llave;
}

async function timbrarYGuardar(pedido, llave, carpeta, nombre, correo) {
  const factura = await api("/invoices", llave, { metodo: "POST", cuerpo: pedido });
  await mkdir(carpeta, { recursive: true });
  const pdf = await api(`/invoices/${factura.id}/pdf`, llave, { formato: "binario" });
  const xml = await api(`/invoices/${factura.id}/xml`, llave, { formato: "binario" });
  const base = `${nombre}_${factura.series || ""}${factura.folio_number || ""}`;
  await writeFile(path.join(carpeta, base + ".pdf"), pdf);
  await writeFile(path.join(carpeta, base + ".xml"), xml);
  if (correo) await api(`/invoices/${factura.id}/email`, llave, { metodo: "POST", cuerpo: { email: correo } });
  console.log(`Factura ${factura.livemode ? "real" : "de prueba"} lista. Folio fiscal: ${factura.uuid} · total ${pesos(Math.round(factura.total * 100))}`);
  console.log(`Archivos: ${path.join(carpeta, base)}.pdf y .xml${correo ? ` · también se mandó a ${correo}` : ""}`);
}

async function rutasDeTickets(lista) {
  const rutas = [];
  for (const r of String(lista).split(",").map((x) => x.trim()).filter(Boolean)) {
    if ((await stat(r)).isDirectory()) rutas.push(...(await readdir(r)).filter((a) => a.endsWith(".txt")).sort().map((a) => path.join(r, a)));
    else rutas.push(r);
  }
  return rutas;
}

async function global(o) {
  for (const falta of ["tickets", "productos", "periodicidad", "mes", "anio", "forma"]) {
    if (!o[falta]) throw new Error(`Falta --${falta}. Corre el script sin datos para ver la ayuda al principio del archivo.`);
  }
  const tickets = [];
  for (const ruta of await rutasDeTickets(o.tickets)) {
    const t = leerTicket(await readFile(ruta, "utf8"));
    if (!t.cuadra) throw new Error(`El ticket de ${ruta} no cuadra: los conceptos suman ${pesos(t.suma)} y el total dice ${t.total === null ? "nada" : pesos(t.total)}.`);
    tickets.push(t);
  }
  const llave = leerLlave(o);
  const emisor = await datosEmisor(o, llave);
  const productos = JSON.parse(await readFile(o.productos, "utf8"));
  const { pedido, errores, total } = armarGlobal({ tickets, productos, periodo: { periodicidad: o.periodicidad, mes: o.mes, anio: Number(o.anio) }, formaPago: o.forma, emisor });
  if (errores.length) throw new Error("No se puede armar la global todavía:\n- " + errores.join("\n- "));
  console.log(`Factura global a PUBLICO EN GENERAL · ${tickets.length} tickets · periodo ${periodicidadDe(pedido.global.periodicity).nombres[0]} ${pedido.global.months}/${pedido.global.year} · total ${pesos(total)}`);
  if (o.revisar) {
    console.log(JSON.stringify(pedido, null, 2));
    return;
  }
  await timbrarYGuardar(pedido, llave, o.salida || ".", "factura_global", null);
}

async function main() {
  const o = opciones(process.argv.slice(2));
  if (o.global) return global(o);
  for (const falta of ["ticket", "constancia", "productos", "forma", "uso"]) {
    if (!o[falta]) throw new Error(`Falta --${falta}. Corre el script sin datos para ver la ayuda al principio del archivo.`);
  }
  const ticket = leerTicket(await readFile(o.ticket, "utf8"));
  if (!ticket.cuadra) throw new Error(`El ticket no cuadra: los conceptos suman ${pesos(ticket.suma)} y el total dice ${ticket.total === null ? "nada" : pesos(ticket.total)}.`);
  const textoConstancia = o.constancia.toLowerCase().endsWith(".pdf") ? await textoDePdf(o.constancia) : await readFile(o.constancia, "utf8");
  const constancia = leerConstancia(textoConstancia);
  for (const aviso of constancia.avisos) console.log("Aviso:", aviso);
  if (constancia.faltan.length) throw new Error(`A la constancia le falta: ${constancia.faltan.join(", ")}. Pide una foto o el PDF completo.`);
  let regimen = o.regimen || "";
  if (!regimen) {
    if (constancia.regimenes.length > 1) throw new Error(`La constancia trae varios regímenes (${constancia.regimenes.map((r) => r.clave).join(", ")}): di cuál con --regimen.`);
    regimen = constancia.regimenes[0].clave;
  }
  const productos = JSON.parse(await readFile(o.productos, "utf8"));
  const llave = leerLlave(o);
  const emisor = await datosEmisor(o, llave);
  const { pedido, errores, retencionIsr } = armarPedido({
    cliente: { rfc: constancia.rfc, nombre: constancia.nombre, codigoPostal: constancia.codigoPostal, regimen, correo: o.correo },
    conceptos: ticket.conceptos,
    productos,
    formaPago: o.forma,
    uso: o.uso,
    folio: ticket.folio || undefined,
    emisor,
  });
  if (errores.length) throw new Error("No se puede facturar todavía:\n- " + errores.join("\n- "));
  pedido.idempotency_key = `ticket-${ticket.folio}-${constancia.rfc}-${ticket.total}`.slice(0, 100);

  console.log(`Cliente: ${constancia.nombre} · RFC ${constancia.rfc} · CP ${constancia.codigoPostal} · régimen ${regimen}`);
  console.log(`Ticket ${ticket.folio}: ${ticket.conceptos.length} conceptos, total ${pesos(ticket.total)}`);
  if (retencionIsr) console.log(`Retención de ISR ${TASA_RETENCION_RESICO * 100}% ${pesos(retencionIsr)} · Total a recibir ${pesos(ticket.total - retencionIsr)} (eres RESICO y el cliente es persona moral)`);
  if (!emisor) console.log("Aviso: sin tu llave no sé tu régimen. Si eres persona física en RESICO (626) y el cliente es empresa, agrega --rfc-emisor y --regimen-emisor 626 para ver la retención de ISR.");
  if (o.revisar) {
    console.log(JSON.stringify(pedido, null, 2));
    return;
  }
  await timbrarYGuardar(pedido, llave, o.salida || ".", `factura_${constancia.rfc}`, o.correo);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

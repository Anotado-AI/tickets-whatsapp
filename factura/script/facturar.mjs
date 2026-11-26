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
// Con una llave sk_test_ la factura es de prueba: no va al SAT. Con sk_live_ es real.
// La llave va en la variable FACTURAPI_KEY; este script nunca la escribe en pantalla.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { leerTicket } from "../piezas/ticket.mjs";
import { leerConstancia } from "../piezas/constancia.mjs";
import { armarPedido } from "../piezas/pedido.mjs";
import { pesos } from "../piezas/texto.mjs";

const API = "https://www.facturapi.io/v2";

function opciones(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const clave = a.slice(2);
    if (clave === "revisar") o.revisar = true;
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

async function main() {
  const o = opciones(process.argv.slice(2));
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
  const { pedido, errores } = armarPedido({
    cliente: { rfc: constancia.rfc, nombre: constancia.nombre, codigoPostal: constancia.codigoPostal, regimen, correo: o.correo },
    conceptos: ticket.conceptos,
    productos,
    formaPago: o.forma,
    uso: o.uso,
    folio: ticket.folio || undefined,
  });
  if (errores.length) throw new Error("No se puede facturar todavía:\n- " + errores.join("\n- "));
  pedido.idempotency_key = `ticket-${ticket.folio}-${constancia.rfc}-${ticket.total}`.slice(0, 100);

  console.log(`Cliente: ${constancia.nombre} · RFC ${constancia.rfc} · CP ${constancia.codigoPostal} · régimen ${regimen}`);
  console.log(`Ticket ${ticket.folio}: ${ticket.conceptos.length} conceptos, total ${pesos(ticket.total)}`);
  if (o.revisar) {
    console.log(JSON.stringify(pedido, null, 2));
    return;
  }
  const llave = (process.env.FACTURAPI_KEY || "").trim();
  if (!/^sk_(test|live)_/.test(llave)) throw new Error("Pon tu llave de Facturapi en la variable FACTURAPI_KEY (empieza con sk_test_ o sk_live_).");

  const factura = await api("/invoices", llave, { metodo: "POST", cuerpo: pedido });
  const carpeta = o.salida || ".";
  await mkdir(carpeta, { recursive: true });
  const nombre = `factura_${factura.series || ""}${factura.folio_number || ticket.folio}_${constancia.rfc}`;
  const pdf = await api(`/invoices/${factura.id}/pdf`, llave, { formato: "binario" });
  const xml = await api(`/invoices/${factura.id}/xml`, llave, { formato: "binario" });
  await writeFile(path.join(carpeta, nombre + ".pdf"), pdf);
  await writeFile(path.join(carpeta, nombre + ".xml"), xml);
  if (o.correo) await api(`/invoices/${factura.id}/email`, llave, { metodo: "POST", cuerpo: { email: o.correo } });

  console.log(`Factura ${factura.livemode ? "real" : "de prueba"} lista. Folio fiscal: ${factura.uuid} · total ${pesos(Math.round(factura.total * 100))}`);
  console.log(`Archivos: ${path.join(carpeta, nombre)}.pdf y .xml${o.correo ? ` · también se mandó a ${o.correo}` : ""}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

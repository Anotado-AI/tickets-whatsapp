import { test } from "node:test";
import assert from "node:assert/strict";
import { armarMensaje, PREGUNTA_FACTURA } from "./mensaje.mjs";
import { armarLiga, EJEMPLO, leerConfiguracion, leerFactura } from "./configuracion.mjs";

const FECHA = new Date(2026, 10, 20, 13, 5);
const PANADERIA = [
  { cantidad: 6000, descripcion: "Concha", unitario: 1200 },
  { cantidad: 1000, descripcion: "Pastel de tres leches", unitario: 28000 },
];
const BASE = "https://anotado.ai/tickets/app/";
const DATOS = {
  negocio: "Panadería San José",
  folio: 42,
  fecha: FECHA,
  conceptos: PANADERIA,
  pie: "Av. Juárez 120, Puebla",
  regalo: "10% en su primera compra con el código AMIGO10",
  resena: "https://g.page/r/XXXX/review",
};

test("con factura, la pregunta va después del gracias y antes del regalo y de la reseña", () => {
  const esperado = [
    "*Panadería San José*",
    "Ticket 0042 · 20 nov 2026, 13:05",
    "",
    "6 × Concha: $72.00",
    "1 × Pastel de tres leches: $280.00",
    "*Total: $352.00*",
    "Av. Juárez 120, Puebla",
    "",
    "Gracias por tu compra.",
    "",
    "¿Necesitas factura? Mándanos tu constancia de situación fiscal o tu RFC, nombre, código postal y régimen.",
    "",
    "🎁 Regalo para un amigo: 10% en su primera compra con el código AMIGO10.",
    "No hace falta calificarnos para usarlo.",
    "",
    "¿Cómo te atendimos? Cuéntanos en Google Maps:",
    "https://g.page/r/XXXX/review",
  ].join("\n");
  assert.equal(armarMensaje({ ...DATOS, factura: true }), esperado);
});

test("con factura y sin regalo ni reseña, sin renglones vacíos de más", () => {
  const m = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: PANADERIA, factura: true });
  assert.ok(m.endsWith("Gracias por tu compra.\n\n" + PREGUNTA_FACTURA));
  assert.ok(!m.includes("\n\n\n"));
  const r = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: PANADERIA, factura: true, resena: "https://g.page/r/a/review" });
  assert.ok(r.includes(PREGUNTA_FACTURA + "\n\n¿Cómo te atendimos? Cuéntanos en Google Maps:\nhttps://g.page/r/a/review"));
});

test("sin factura, el mensaje queda idéntico al de siempre", () => {
  const antes = armarMensaje(DATOS);
  for (const f of [undefined, false, null, 0, "", "0", "1", "true", 1]) {
    assert.equal(armarMensaje({ ...DATOS, factura: f }), antes, `factura=${JSON.stringify(f)} no cambia el mensaje`);
  }
  assert.ok(!antes.includes("factura"));
});

test("f=1 en la liga enciende la pregunta; cualquier otro valor la deja apagada", () => {
  assert.equal(leerFactura("1"), true);
  assert.equal(leerFactura(" 1 "), true);
  for (const v of [null, undefined, "", "0", "true", "si", "11", "1;", "<b>1</b>", "javascript:1"]) assert.equal(leerFactura(v), false, String(v));
  assert.equal(leerConfiguracion("?n=Caf%C3%A9&f=1").f, true);
  for (const q of ["?n=Caf%C3%A9", "?n=Caf%C3%A9&f=0", "?n=Caf%C3%A9&f=", "?n=Caf%C3%A9&f=2", "?n=Caf%C3%A9&F=1"]) {
    assert.ok(!("f" in leerConfiguracion(q)), q);
  }
});

test("la liga lleva f=1 solo si se pide, después del pie y antes de la lada", () => {
  const sin = armarLiga(BASE, EJEMPLO);
  const con = armarLiga(BASE, { ...EJEMPLO, f: true });
  assert.equal(con, sin + "&f=1");
  assert.equal(armarLiga(BASE, { ...EJEMPLO, f: false }), sin);
  assert.equal(armarLiga(BASE, { n: "Café", f: true, l: "34" }), BASE + "?n=Caf%C3%A9&f=1&l=34");
  assert.deepEqual(leerConfiguracion(new URL(con).search), { ...EJEMPLO, l: "52", f: true });
  assert.equal(armarLiga(BASE, leerConfiguracion(new URL(con).search)), con, "va y regresa igual");
});

test("la función de la guía también pregunta por la factura igual que piezas/mensaje.mjs", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const ruta = ["../guia.md", "../guia/guia.md"].map((r) => new URL(r, import.meta.url)).find((u) => existsSync(u));
  const guia = readFileSync(ruta, "utf8");
  const bloque = guia.split("### El mensaje del ticket")[1].match(/```js\n([\s\S]*?)```/)[1];
  const deLaGuia = new Function(bloque + "\nreturn armarMensaje;")();
  for (const factura of [true, false, undefined]) {
    const datos = { ...DATOS, factura };
    assert.equal(deLaGuia(datos), armarMensaje(datos), `factura=${factura}`);
  }
  assert.ok(guia.includes("| `f` |"), "la tabla de la guía trae el dato f");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { armarMensaje, conceptosDelTicket, conPunto, revisarConceptos, totalTicket } from "./mensaje.mjs";
import { formatoFecha, formatoPesos, leerCantidad, leerImporte } from "./formato.mjs";

const FECHA = new Date(2026, 10, 20, 13, 5);
const PANADERIA = [
  { cantidad: 6000, descripcion: "Concha", unitario: 1200 },
  { cantidad: 1000, descripcion: "Pastel de tres leches", unitario: 28000 },
];

test("el ejemplo completo sale idéntico al de la guía", () => {
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
    "🎁 Regalo para un amigo: 10% en su primera compra con el código AMIGO10.",
    "No hace falta calificarnos para usarlo.",
    "",
    "¿Cómo te atendimos? Cuéntanos en Google Maps:",
    "https://g.page/r/XXXX/review",
  ].join("\n");
  const mensaje = armarMensaje({
    negocio: "Panadería San José",
    folio: 42,
    fecha: FECHA,
    conceptos: PANADERIA,
    pie: "Av. Juárez 120, Puebla",
    regalo: "10% en su primera compra con el código AMIGO10",
    resena: "https://g.page/r/XXXX/review",
  });
  assert.equal(mensaje, esperado);
});

test("sin regalo no queda el renglón ni un renglón vacío de más", () => {
  const mensaje = armarMensaje({ negocio: "Café Luna", folio: 7, fecha: FECHA, conceptos: PANADERIA, resena: "https://g.page/r/abc/review" });
  assert.ok(!mensaje.includes("🎁"));
  assert.ok(!mensaje.includes("No hace falta calificarnos"));
  assert.ok(!mensaje.includes("\n\n\n"));
  assert.ok(mensaje.endsWith("*Total: $352.00*\n\nGracias por tu compra.\n\n¿Cómo te atendimos? Cuéntanos en Google Maps:\nhttps://g.page/r/abc/review"));
});

test("el regalo va antes del renglón de reseña y separado de él", () => {
  const mensaje = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: PANADERIA, regalo: "un café", resena: "https://g.page/r/a/review" });
  const regalo = mensaje.indexOf("🎁 Regalo para un amigo: un café");
  const resena = mensaje.indexOf("¿Cómo te atendimos?");
  assert.ok(regalo > 0 && resena > regalo);
  assert.equal(mensaje.slice(regalo).split("\n")[1], "No hace falta calificarnos para usarlo.", "bajo el regalo, que no hace falta calificar");
  assert.equal(mensaje.slice(regalo).split("\n")[2], "", "un renglón vacío entre regalo y reseña");
});

test("el pie va justo bajo el total", () => {
  const mensaje = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: PANADERIA, pie: "RFC XAXX010101000" });
  assert.ok(mensaje.includes("*Total: $352.00*\nRFC XAXX010101000\n\nGracias por tu compra."));
});

test("sin pie, el total va seguido del renglón vacío", () => {
  const mensaje = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: PANADERIA });
  assert.ok(mensaje.includes("*Total: $352.00*\n\nGracias por tu compra."));
  assert.ok(mensaje.endsWith("Gracias por tu compra."), "sin liga de reseña no hay renglón de reseña");
});

test("varios conceptos suman bien y cada uno lleva su importe", () => {
  const conceptos = [
    { cantidad: 2000, descripcion: "Café americano", unitario: 4500 },
    { cantidad: 3000, descripcion: "Pan de elote", unitario: 3833 },
    { cantidad: 1000, descripcion: "Jugo", unitario: 5550 },
    { cantidad: 12000, descripcion: "Bolillo", unitario: 350 },
  ];
  const mensaje = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos });
  assert.ok(mensaje.includes("2 × Café americano: $90.00"));
  assert.ok(mensaje.includes("3 × Pan de elote: $114.99"));
  assert.ok(mensaje.includes("1 × Jugo: $55.50"));
  assert.ok(mensaje.includes("12 × Bolillo: $42.00"));
  assert.equal(totalTicket(conceptos), 9000 + 11499 + 5550 + 4200);
  assert.ok(mensaje.includes("*Total: $302.49*"));
});

test("descripción vacía se escribe «Consumo»", () => {
  const mensaje = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: [{ cantidad: 1000, descripcion: "  ", unitario: 25000 }] });
  assert.ok(mensaje.includes("1 × Consumo: $250.00"));
});

test("decimales en cantidad e importe", () => {
  const conceptos = [
    { cantidad: leerCantidad("1.5"), descripcion: "Queso Oaxaca (kg)", unitario: leerImporte("189.90") },
    { cantidad: leerCantidad("0,25"), descripcion: "Jamón (kg)", unitario: leerImporte("$1,234.50") },
    { cantidad: leerCantidad(""), descripcion: "Bolsa", unitario: leerImporte("0.5") },
  ];
  const mensaje = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos });
  assert.ok(mensaje.includes("1.5 × Queso Oaxaca (kg): $284.85"));
  assert.ok(mensaje.includes("0.25 × Jamón (kg): $308.63"));
  assert.ok(mensaje.includes("1 × Bolsa: $0.50"));
  assert.ok(mensaje.includes("*Total: $593.98*"));
});

test("renglones vacíos o con cantidad cero no entran", () => {
  const lista = conceptosDelTicket([
    { cantidad: 1000, descripcion: "", unitario: 0 },
    { cantidad: 0, descripcion: "Nada", unitario: 1000 },
    { cantidad: 1000, descripcion: "Cortesía", unitario: 0 },
  ]);
  assert.deepEqual(lista.map((c) => c.descripcion), ["Cortesía"]);
});

test("el nombre no rompe las negritas ni trae saltos de línea", () => {
  const mensaje = armarMensaje({ negocio: "Tacos *El*\nGüero", folio: 1, fecha: FECHA, conceptos: PANADERIA });
  assert.ok(mensaje.startsWith("*Tacos El Güero*\nTicket 0001 · "));
});

test("formatos de pesos, folio y fecha", () => {
  assert.equal(formatoPesos(123450), "$1,234.50");
  assert.equal(formatoPesos(0), "$0.00");
  assert.equal(formatoPesos(100000005), "$1,000,000.05");
  assert.equal(formatoFecha(new Date(2026, 0, 3, 9, 7)), "3 ene 2026, 09:07");
  assert.equal(formatoFecha(FECHA), "20 nov 2026, 13:05");
  assert.equal(armarMensaje({ negocio: "X", folio: 12345, fecha: FECHA, conceptos: [] }).split("\n")[1], "Ticket 12345 · 20 nov 2026, 13:05");
});

test("importes y cantidades escritos de muchas formas", () => {
  assert.equal(leerImporte("12"), 1200);
  assert.equal(leerImporte("$ 1,234.50"), 123450);
  assert.equal(leerImporte("12,50"), 1250);
  assert.equal(leerImporte("1,234"), 123400);
  assert.equal(leerImporte("12.345"), 1235);
  assert.equal(leerImporte(""), 0);
  assert.equal(leerImporte("12,5"), 1250);
  for (const malo of ["doce", "12..75", "-5", "12,345,67", "1.2.3", "12.75.", "1e3"]) assert.ok(Number.isNaN(leerImporte(malo)), malo);
  assert.equal(leerCantidad("6"), 6000);
  assert.equal(leerCantidad("1,5"), 1500);
  assert.ok(Number.isNaN(leerCantidad("-1")));
});

test("renglones escritos: un precio o una cantidad que no es número no se vuelve $0.00", () => {
  const { conceptos, errores } = revisarConceptos([
    { cantidad: "2", descripcion: "Martillo", precio: "149.50" },
    { cantidad: "3", descripcion: "Tornillos 1/4 & taquetes", precio: "12..75" },
  ]);
  assert.deepEqual(errores, [{ renglon: 1, campo: "precio", motivo: "formato" }]);
  assert.equal(conceptos.length, 1, "el renglón con error no entra a la cuenta");
  const bien = revisarConceptos([
    { cantidad: "2", descripcion: "Martillo", precio: "149.50" },
    { cantidad: "3", descripcion: "Tornillos 1/4 & taquetes", precio: "12.75" },
  ]);
  assert.deepEqual(bien.errores, []);
  assert.equal(totalTicket(bien.conceptos), 33725);
});

test("renglones escritos: falta de precio, negativos, cantidad cero y renglones en blanco", () => {
  const { conceptos, errores } = revisarConceptos([
    { cantidad: "", descripcion: "", precio: "" },
    { cantidad: "", descripcion: "Concha", precio: "" },
    { cantidad: "1", descripcion: "Bolillo", precio: "-5" },
    { cantidad: "-2", descripcion: "Dona", precio: "10" },
    { cantidad: "0", descripcion: "Pan", precio: "10" },
    { cantidad: "1,5", descripcion: "Queso", precio: "$ 189.90" },
    { cantidad: "", descripcion: "Cortesía", precio: "0" },
    { cantidad: "", descripcion: "", precio: "45" },
    { cantidad: "2", descripcion: "Té", precio: " $ " },
  ]);
  assert.deepEqual(errores, [
    { renglon: 1, campo: "precio", motivo: "falta" },
    { renglon: 2, campo: "precio", motivo: "formato" },
    { renglon: 3, campo: "cantidad", motivo: "formato" },
    { renglon: 4, campo: "cantidad", motivo: "cero" },
    { renglon: 8, campo: "precio", motivo: "falta" },
  ]);
  assert.deepEqual(conceptos, [
    { cantidad: 1500, descripcion: "Queso", unitario: 18990 },
    { cantidad: 1000, descripcion: "Cortesía", unitario: 0 },
    { cantidad: 1000, descripcion: "", unitario: 4500 },
  ]);
});

test("armarMensaje se detiene ante una cantidad o un precio inválido", () => {
  for (const malo of [{ cantidad: 1000, unitario: NaN }, { cantidad: NaN, unitario: 100 }, { cantidad: 1000, unitario: -500 }, { cantidad: -1000, unitario: 500 }]) {
    assert.throws(() => armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: [{ descripcion: "Pan", ...malo }] }), RangeError, JSON.stringify(malo));
  }
});

test("la función de la guía arma el mismo mensaje que piezas/mensaje.mjs", () => {
  const ruta = ["../guia.md", "../guia/guia.md"].map((r) => new URL(r, import.meta.url)).find((u) => existsSync(u));
  assert.ok(ruta, "no encontré guia.md");
  const guia = readFileSync(ruta, "utf8");
  const bloque = guia.split("### El mensaje del ticket")[1].match(/```js\n([\s\S]*?)```/)[1];
  const deLaGuia = new Function(bloque + "\nreturn armarMensaje;")();
  const casos = [
    { negocio: "Panadería San José", folio: 42, fecha: FECHA, conceptos: PANADERIA, pie: "Av. Juárez 120, Puebla", regalo: "10% en su primera compra con el código AMIGO10", resena: "https://g.page/r/XXXX/review" },
    { negocio: "Cremería Lupita", folio: 7, fecha: new Date(2026, 0, 3, 9, 7), conceptos: [{ cantidad: 1500, descripcion: "Queso Oaxaca (kg)", unitario: 18990 }, { cantidad: 250, descripcion: "", unitario: 123450 }], regalo: "¡Un café de cortesía!" },
  ];
  for (const datos of casos) assert.equal(deLaGuia(datos), armarMensaje(datos));
});

test("el regalo termina con punto, salvo que ya traiga cierre", () => {
  assert.equal(conPunto("10% en su primera compra"), "10% en su primera compra.");
  for (const igual of ["Un café.", "¡Un café!", "¿Ya conoces el pan de muerto?", "Pan dulce…", "2x1 (martes)", "«Concha gratis»", "\"Concha gratis\"", "Concha \x27gratis\x27"]) assert.equal(conPunto(igual), igual, igual);
  const mensaje = armarMensaje({ negocio: "X", folio: 1, fecha: FECHA, conceptos: PANADERIA, regalo: "¡2x1 en conchas!" });
  assert.ok(mensaje.includes("🎁 Regalo para un amigo: ¡2x1 en conchas!\nNo hace falta calificarnos para usarlo."));
});

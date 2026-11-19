import { test } from "node:test";
import assert from "node:assert/strict";
import { armarLiga, EJEMPLO, esLigaDeGoogle, leerConfiguracion, ligaResenaRecibidaInvalida, limpiarLigaResena, revisarLigaResena } from "./configuracion.mjs";

const BASE = "https://anotado.ai/tickets/app/";

test("la liga del ejemplo va y regresa igual", () => {
  const liga = armarLiga(BASE, EJEMPLO);
  assert.equal(
    liga,
    "https://anotado.ai/tickets/app/?n=Panader%C3%ADa%20San%20Jos%C3%A9&r=https%3A%2F%2Fanotado.ai%2Ftickets%2Fejemplo%2F&g=10%25%20en%20su%20primera%20compra%20con%20el%20c%C3%B3digo%20AMIGO10&p=Av.%20Ju%C3%A1rez%20120%2C%20Puebla"
  );
  assert.deepEqual(leerConfiguracion(new URL(liga).search), { ...EJEMPLO, l: "52" });
});

test("sin nombre no hay configuración", () => {
  assert.equal(leerConfiguracion(""), null);
  assert.equal(leerConfiguracion("?r=https://g.page/r/a/review"), null);
  assert.equal(leerConfiguracion("?n=%20%20%0A"), null);
});

test("otros datos se ignoran y la lada se limpia", () => {
  const c = leerConfiguracion("?n=Caf%C3%A9&x=1&premio=2x1&l=%2B34");
  assert.deepEqual(c, { n: "Café", r: "", g: "", p: "", l: "34" });
  assert.equal(leerConfiguracion("?n=a&l=12345").l, "52");
  assert.ok(armarLiga(BASE, c).endsWith("&l=34"));
});

test("liga de reseñas: solo https y sin trucos", () => {
  assert.equal(limpiarLigaResena("https://g.page/r/CXyz/review"), "https://g.page/r/CXyz/review");
  for (const mala of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "http://g.page/r/a/review",
    "data:text/html,<script>alert(1)</script>",
    "https://usuario:clave@g.page/r",
    "https://g.page/r/a review",
    'https://g.page/"><img src=x onerror=alert(1)>',
    "//g.page/r/a",
    "https://localhost/a",
    "https://" + "a".repeat(600) + ".com",
  ]) {
    assert.equal(limpiarLigaResena(mala), "", mala);
  }
});

test("¿es de Google? g.page, google.com, maps.google.com, maps.app.goo.gl y goo.gl", () => {
  for (const buena of [
    "https://g.page/r/CXyz/review",
    "https://www.google.com/maps/place/x",
    "https://search.google.com/local/writereview?placeid=abc",
    "https://maps.google.com/?cid=123",
    "https://maps.app.goo.gl/AbCd123",
    "https://goo.gl/maps/abc",
  ]) {
    assert.ok(esLigaDeGoogle(buena), buena);
  }
  for (const otra of ["https://anotado.ai/tickets/ejemplo/", "https://google.com.evil.mx/x", "https://notgoogle.com/x", "nada"]) {
    assert.ok(!esLigaDeGoogle(otra), otra);
  }
});

test("parámetros hostiles no pasan como HTML ni rompen límites", () => {
  const largo = "x".repeat(5000);
  const casos = {
    html: "<script>alert(1)</script><img src=x onerror=alert(1)>",
    comillas: "\"'`Tacos \"El Güero\"",
    emojis: "🌮🌮 Tacos 👩\u200D👩\u200D👧\u200D👦 Familia 🇲🇽",
    saltos: "Línea uno\r\nLínea dos\u2028tres",
    bidi: "Tienda\u202Eabc\u202C",
    nulos: "a\u0000b",
    largo,
  };
  for (const [nombre, valor] of Object.entries(casos)) {
    const q = new URLSearchParams({ n: valor, g: valor, p: valor, r: valor }).toString();
    const c = leerConfiguracion("?" + q);
    assert.ok(c, nombre);
    for (const campo of ["n", "g", "p"]) {
      assert.ok(!/[\n\r\u2028\u0000\u202E]/.test(c[campo]), `${nombre} ${campo} sin controles`);
    }
    assert.ok(Array.from(c.n).length <= 40 + 10, `${nombre}: nombre recortado`);
    assert.ok(c.g.length <= 240 && c.p.length <= 240, `${nombre}: regalo y pie recortados`);
    assert.equal(c.r, "", `${nombre}: la liga de reseñas no es https y se descarta`);
  }
  assert.equal(leerConfiguracion("?n=" + largo).n, "x".repeat(40));
  assert.equal(leerConfiguracion("?n=a&r=javascript:alert(1)").r, "");
  const rota = leerConfiguracion("?n=%E0%A4%A&g=%ZZ");
  assert.equal(rota.n, "�%A", "un porcentaje mal escrito no rompe la lectura");
  assert.equal(rota.g, "%ZZ");
});

test("liga de reseñas: hasta 500 caracteres, y la app sabe cuándo llegó una que no sirve", () => {
  const larga = "https://www.google.com/maps/place/" + "a".repeat(470);
  assert.equal(larga.length, 504);
  assert.deepEqual(revisarLigaResena(larga), { liga: "", motivo: "larga" });
  const justa = "https://www.google.com/maps/place/" + "a".repeat(466);
  assert.equal(justa.length, 500);
  assert.equal(revisarLigaResena(justa).liga, justa);
  assert.deepEqual(revisarLigaResena("http://g.page/r/a/review"), { liga: "", motivo: "formato" });
  assert.deepEqual(revisarLigaResena("  "), { liga: "", motivo: "vacia" });
  assert.equal(ligaResenaRecibidaInvalida("?n=Tacos&r=" + encodeURIComponent(larga)), true);
  assert.equal(ligaResenaRecibidaInvalida("?n=Tacos&r=javascript%3Aalert(1)"), true);
  assert.equal(ligaResenaRecibidaInvalida("?n=Tacos&r=https%3A%2F%2Fg.page%2Fr%2Fa%2Freview"), false);
  assert.equal(ligaResenaRecibidaInvalida("?n=Tacos"), false);
});

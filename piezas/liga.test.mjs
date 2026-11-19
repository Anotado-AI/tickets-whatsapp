import { test } from "node:test";
import assert from "node:assert/strict";
import { codificar, ligaWhatsApp, normalizarNumero, quitarLada, revisarNumero } from "./liga.mjs";

function textoDe(liga) {
  const u = new URL(liga);
  assert.equal(u.protocol, "https:");
  assert.equal(u.hostname, "wa.me");
  return { ruta: u.pathname, texto: u.searchParams.get("text"), crudo: liga.split("?text=")[1] };
}

test("acentos, ñ, ¿ y emojis van en porcentaje y regresan intactos", () => {
  const mensaje = "Panadería Ñandú ¿Cómo te atendimos? 🎁👩\u200D🍳";
  const { texto, crudo } = textoDe(ligaWhatsApp(mensaje, "525512345678"));
  assert.equal(texto, mensaje);
  assert.equal(decodeURIComponent(crudo), mensaje);
  assert.match(crudo, /^[A-Za-z0-9%._~-]+$/, "solo caracteres seguros en la liga");
  assert.ok(crudo.includes("%F0%9F%8E%81"), "el emoji de regalo en UTF-8");
});

test("*, &, #, +, ? y = no cortan ni cambian el mensaje", () => {
  const mensaje = "*Total: $352.00* & 10% #AMIGO10 + ?a=b";
  const { texto, crudo } = textoDe(ligaWhatsApp(mensaje, "525512345678"));
  assert.equal(texto, mensaje);
  assert.ok(!/[*&#+?= ]/.test(crudo));
  assert.ok(crudo.startsWith("%2ATotal"));
});

test("los saltos de línea van como %0A", () => {
  const mensaje = "uno\ndos\n\ntres";
  const { texto, crudo } = textoDe(ligaWhatsApp(mensaje));
  assert.equal(texto, mensaje);
  assert.equal(crudo, "uno%0Ados%0A%0Atres");
});

test("número con espacios, guiones, +52, 521, 044 y 0052", () => {
  for (const escrito of ["55 1234 5678", "55-1234-5678", "+52 55 1234 5678", "+52 1 55 1234 5678", "521 5512345678", "044 55 1234 5678", "0052 55 1234 5678", "(55) 1234.5678"]) {
    assert.equal(normalizarNumero(escrito), "525512345678", escrito);
  }
  assert.equal(ligaWhatsApp("hola", normalizarNumero("+52 55-1234-5678")), "https://wa.me/525512345678?text=hola");
});

test("sin número válido la liga deja elegir el contacto", () => {
  for (const escrito of ["", "55 1234", "55 1234 56789", "abc", undefined]) {
    assert.equal(normalizarNumero(escrito), "", String(escrito));
  }
  assert.equal(ligaWhatsApp("hola", ""), "https://wa.me/?text=hola");
  assert.equal(ligaWhatsApp("hola"), "https://wa.me/?text=hola");
});

test("revisarNumero dice cuántos dígitos faltan o sobran", () => {
  assert.deepEqual(revisarNumero("55 12"), { numero: "", digitos: "5512", faltan: 6, sobran: 0 });
  assert.equal(revisarNumero("55 1234 567890").sobran, 2);
  assert.equal(revisarNumero("55 1234 5678").numero, "525512345678");
});

test("otra lada: España con y sin +34", () => {
  assert.equal(normalizarNumero("612 345 678", "34"), "34612345678");
  assert.equal(normalizarNumero("+34 612 345 678", "34"), "34612345678");
  assert.equal(normalizarNumero("12", "34"), "");
});

test("codificar es reversible con decodeURIComponent", () => {
  const raro = "a b'c(d)e!f*g~h_i.j-k\"<script>&#%";
  assert.equal(decodeURIComponent(codificar(raro)), raro);
});

test("al pegar el número con lada, la lada se quita para no verla dos veces", () => {
  assert.equal(quitarLada("+52 442 123 4567"), "442 123 4567");
  assert.equal(quitarLada("+52 (442) 123-4567"), "(442) 123-4567");
  assert.equal(quitarLada("52 1 55 1234 5678"), "55 1234 5678");
  assert.equal(quitarLada("525512345678"), "5512345678");
  assert.equal(quitarLada("0052 55 1234 5678"), "55 1234 5678");
  assert.equal(quitarLada("+34 612 345 678", "34"), "612 345 678");
  for (const igual of ["55 1234 5678", "+52 55 12", "5512", "", "52 55 1234 567"]) assert.equal(quitarLada(igual), igual, igual);
  assert.equal(normalizarNumero(quitarLada("+52 442 123 4567")), "524421234567");
});

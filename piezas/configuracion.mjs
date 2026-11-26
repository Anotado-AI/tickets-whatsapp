// La configuración del negocio viaja en la liga de la app. No hay cuentas ni servidor.
//
//   n  nombre del negocio (obligatorio, hasta 40 letras)
//   r  liga para calificar en Google (solo https://)
//   g  regalo para un amigo (opcional, hasta 120)
//   p  pie del ticket: dirección, RFC u horario (opcional, hasta 120)
//   f  1 para preguntar en el ticket si el cliente necesita factura (opcional)
//   l  lada del país (opcional, 52 por defecto)
//
// Cualquier otro dato de la liga se ignora. Todo se limpia antes de usarse y la app lo pinta
// siempre como texto, nunca como HTML.

import { limpiarTexto } from "./formato.mjs";
import { codificar, limpiarLada } from "./liga.mjs";

export const LIMITES = { n: 40, g: 120, p: 120, r: 500 };

export const EJEMPLO = {
  n: "Panadería San José",
  r: "https://anotado.ai/tickets/ejemplo/",
  g: "10% en su primera compra con el código AMIGO10",
  p: "Av. Juárez 120, Puebla",
};

const DOMINIOS_GOOGLE = ["g.page", "google.com", "goo.gl"];

/**
 * Revisa la liga de reseñas. Devuelve { liga, motivo }: la liga limpia, o vacío y por qué no sirve.
 *   motivo: "" (sirve), "vacia", "larga" (más de 500 caracteres) o "formato" (no es https, lleva
 *   espacios o comillas, o trae usuario y contraseña).
 */
export function revisarLigaResena(valor) {
  const t = String(valor == null ? "" : valor).trim();
  if (!t) return { liga: "", motivo: "vacia" };
  if (t.length > LIMITES.r) return { liga: "", motivo: "larga" };
  if (/[\s<>"'`\\]/.test(t)) return { liga: "", motivo: "formato" };
  let u;
  try {
    u = new URL(t);
  } catch (e) {
    return { liga: "", motivo: "formato" };
  }
  if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) return { liga: "", motivo: "formato" };
  return { liga: u.href, motivo: "" };
}

/** Liga de reseñas válida (https, con dominio, sin usuario ni espacios, hasta 500 caracteres) o vacío. */
export function limpiarLigaResena(valor) {
  return revisarLigaResena(valor).liga;
}

/** ¿La liga de la app trae una liga de reseñas que no sirve? La app abre Ajustes con un aviso. */
export function ligaResenaRecibidaInvalida(busqueda) {
  let q;
  try {
    q = new URLSearchParams(busqueda || "");
  } catch (e) {
    return false;
  }
  const motivo = revisarLigaResena(q.get("r")).motivo;
  return motivo !== "" && motivo !== "vacia";
}

/** ¿La liga es de Google? (g.page, google.com, maps.google.com, maps.app.goo.gl, goo.gl…) */
export function esLigaDeGoogle(liga) {
  let host;
  try {
    host = new URL(liga).hostname.toLowerCase();
  } catch (e) {
    return false;
  }
  return DOMINIOS_GOOGLE.some((d) => host === d || host.endsWith("." + d));
}

/** ¿La liga pide preguntar por la factura? Solo con f=1. */
export function leerFactura(valor) {
  return String(valor == null ? "" : valor).trim() === "1";
}

/**
 * Configuración limpia a partir de la parte `?…` de la liga, o null si falta el nombre.
 * `f: true` va solo cuando la liga trae f=1; sin él, la configuración queda como antes.
 */
export function leerConfiguracion(busqueda) {
  let q;
  try {
    q = new URLSearchParams(busqueda || "");
  } catch (e) {
    return null;
  }
  const n = limpiarTexto(q.get("n"), LIMITES.n);
  if (!n) return null;
  const config = {
    n,
    r: limpiarLigaResena(q.get("r")),
    g: limpiarTexto(q.get("g"), LIMITES.g),
    p: limpiarTexto(q.get("p"), LIMITES.p),
    l: limpiarLada(q.get("l")),
  };
  if (leerFactura(q.get("f"))) config.f = true;
  return config;
}

/** Liga de la app con la configuración: base + ?n=…&r=…&g=…&p=…&f=1 (f solo si se pide, l solo si no es 52). */
export function armarLiga(base, config) {
  const partes = [];
  const n = limpiarTexto(config.n, LIMITES.n);
  const r = limpiarLigaResena(config.r);
  const g = limpiarTexto(config.g, LIMITES.g);
  const p = limpiarTexto(config.p, LIMITES.p);
  const l = limpiarLada(config.l);
  if (n) partes.push("n=" + codificar(n));
  if (r) partes.push("r=" + codificar(r));
  if (g) partes.push("g=" + codificar(g));
  if (p) partes.push("p=" + codificar(p));
  if (config.f === true || config.f === "1") partes.push("f=1");
  if (l !== "52") partes.push("l=" + l);
  return base + (partes.length ? "?" + partes.join("&") : "");
}

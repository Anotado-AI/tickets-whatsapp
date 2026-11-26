// Lee los datos de la factura en el texto de una constancia de situación fiscal.
//
// La factura 4.0 pide cuatro datos del cliente que deben coincidir con los del SAT: RFC, nombre o
// razón social, código postal de su domicilio fiscal y régimen fiscal. Los cuatro vienen en su
// constancia. Esta pieza los saca del texto (el que da un PDF con texto o el que lee una IA de una
// foto) para que nadie los teclee.
//
//   Persona moral:  «Denominación/Razón Social: ESCUELA KEMPER URGATE» (sin «S.A. de C.V.»)
//   Persona física: «Nombre (s): …», «Primer Apellido: …» y «Segundo Apellido: …», en ese orden
//   Código postal:  «Código Postal: 26015»
//   Régimen:        la tabla «Regímenes», sin los que ya tienen fecha de fin

import { buscarRfc, limpiarRfc, revisarRfc } from "./rfc.mjs";
import { REGIMENES } from "./catalogos.mjs";
import { normalizar } from "./texto.mjs";

// Fragmentos que distinguen cada régimen en el texto de la constancia, sin acentos y en minúsculas.
const PISTAS = [
  ["601", /general de ley,? personas morales/],
  ["603", /personas morales con fines no lucrativos/],
  ["605", /sueldos y salarios/],
  ["606", /\barrendamiento\b/],
  ["607", /enajenacion o adquisicion de bienes/],
  ["608", /demas ingresos/],
  ["610", /residentes en el extranjero sin establecimiento/],
  ["611", /ingresos por dividendos/],
  ["612", /personas fisicas con actividades empresariales y profesionales/],
  ["614", /ingresos por intereses/],
  ["615", /obtencion de premios/],
  ["616", /sin obligaciones fiscales/],
  ["620", /sociedades cooperativas de produccion/],
  ["621", /incorporacion fiscal/],
  ["622", /actividades agricolas,? ganaderas,? silvicolas y pesqueras/],
  ["623", /opcional para grupos de sociedades/],
  ["624", /\bcoordinados\b/],
  ["625", /plataformas tecnologicas/],
  ["626", /simplificado de confianza/],
];

// Etiquetas de la constancia: el valor de una termina donde empieza otra en el mismo renglón.
const OTRA_ETIQUETA = /\s(?:RFC|CURP|Nombre\s*\(\s*s\s*\)|Primer\s+Apellido|Segundo\s+Apellido|Denominaci[oó]n|R[eé]gimen\s+Capital|Nombre\s+Comercial|Fecha\s+(?:de\s+)?inicio\s+de\s+operaciones|Estatus\s+en\s+el\s+padr[oó]n|Fecha\s+de\s+[uú]ltimo\s+cambio|C[oó]digo\s+Postal|Tipo\s+de\s+Vialidad|Nombre\s+de\s+Vialidad|N[uú]mero\s+(?:Exterior|Interior)|Nombre\s+de\s+la\s+(?:Colonia|Localidad|Entidad)|Nombre\s+del\s+Municipio|Entre\s+Calle|Y\s+Calle|Correo\s+Electr[oó]nico|Tel\.?\s+(?:Fijo|M[oó]vil)|R[eé]gimen\s+fiscal)\s*:/i;

// Sufijos de régimen de capital que la factura 4.0 no lleva en el nombre.
const SUFIJOS = /[\s,]+(S\.?\s?A\.?\s?P\.?\s?I\.?(\s+DE\s+C\.?\s?V\.?)?|S\.?\s?A\.?\s?B\.?(\s+DE\s+C\.?\s?V\.?)?|S\.?\s?A\.?(\s+DE\s+C\.?\s?V\.?)?|S\.?\s?DE\s+R\.?\s?L\.?(\s+DE\s+C\.?\s?V\.?)?|S\.?\s?C\.?|A\.?\s?C\.?|S\.?\s?A\.?\s?S\.?(\s+DE\s+C\.?\s?V\.?)?|SOCIEDAD AN[OÓ]NIMA( DE CAPITAL VARIABLE)?|SOCIEDAD CIVIL|ASOCIACI[OÓ]N CIVIL)\.?$/i;

/** Valor de una etiqueta «Etiqueta: valor» en el renglón; corta donde empieza otra etiqueta. */
function valorDe(lineas, patron) {
  for (const linea of lineas) {
    const m = linea.match(patron);
    if (!m) continue;
    const resto = " " + linea.slice(m.index + m[0].length);
    const corte = resto.search(OTRA_ETIQUETA);
    return (corte >= 0 ? resto.slice(0, corte) : resto).replace(/\s+/g, " ").trim();
  }
  return "";
}

/** Quita «S.A. de C.V.» y parecidos del final de un nombre de persona moral. */
export function quitarRegimenCapital(nombre) {
  let n = String(nombre || "").trim();
  let antes;
  do {
    antes = n;
    n = n.replace(SUFIJOS, "").trim();
  } while (n !== antes);
  return n;
}

/** Regímenes vigentes que aparecen en el texto, en el orden en que aparecen. */
export function leerRegimenes(texto) {
  const lineas = String(texto || "").replace(/\r\n?/g, "\n").split("\n");
  let inicio = lineas.findIndex((l) => /^\s*reg[ií]menes\s*:?\s*$/i.test(l) || /^\s*reg[ií]menes\s*:/i.test(l));
  let fin = inicio < 0 ? -1 : lineas.findIndex((l, i) => i > inicio && /^\s*obligaciones\s*:?/i.test(l));
  const zona = inicio < 0 ? lineas : lineas.slice(inicio + 1, fin < 0 ? undefined : fin);
  const vistos = [];
  for (const linea of zona) {
    const norm = normalizar(linea);
    // Con clave escrita: «Régimen fiscal: 601 General de Ley Personas Morales» o «601 - …»
    const conClave = norm.match(/(?:^|regimen(?: fiscal)?:?\s*)(6\d\d)\b/);
    let clave = conClave && REGIMENES.some((r) => r.clave === conClave[1]) ? conClave[1] : "";
    if (!clave) {
      const pista = PISTAS.find(([, p]) => p.test(norm));
      if (pista) clave = pista[0];
    }
    if (!clave) continue;
    // En la tabla, un régimen que ya terminó trae dos fechas: la de inicio y la de fin.
    const fechas = norm.match(/\b\d{2}\/\d{2}\/\d{4}\b/g) || [];
    if (fechas.length >= 2) continue;
    if (!vistos.includes(clave)) vistos.push(clave);
  }
  return vistos.map((clave) => REGIMENES.find((r) => r.clave === clave));
}

/**
 * @param {string} texto el texto de la constancia
 * @returns {{ rfc: string, tipo: string, nombre: string, codigoPostal: string,
 *   regimenes: Array<{ clave: string, nombre: string }>, estatus: string, faltan: string[], avisos: string[] }}
 */
export function leerConstancia(texto) {
  const crudo = String(texto == null ? "" : texto).replace(/\r\n?/g, "\n");
  const lineas = crudo.split("\n");
  const avisos = [];

  let rfc = limpiarRfc(valorDe(lineas, /\bRFC\s*:/i).split(/\s/)[0]);
  if (!revisarRfc(rfc).valido) {
    const hallado = buscarRfc(crudo);
    if (rfc && hallado && hallado !== rfc) avisos.push(`El RFC «${rfc}» no pasa la revisión; usé ${hallado}, que aparece en la constancia`);
    rfc = hallado || rfc;
  }
  const revision = revisarRfc(rfc);
  if (rfc && !revision.valido) avisos.push(`El RFC ${rfc} no pasa la revisión (${revision.motivo}). Pídele al cliente una foto más clara de su constancia`);

  let nombre = "";
  const razon = valorDe(lineas, /denominaci[oó]n\s*(?:\/|o)\s*raz[oó]n\s+social\s*:/i) || valorDe(lineas, /^\s*raz[oó]n\s+social\s*:/i);
  if (razon) {
    const sin = quitarRegimenCapital(razon);
    if (sin !== razon) avisos.push(`Quité «${razon.slice(sin.length).trim()}» del nombre: la factura 4.0 lo lleva sin el régimen de capital`);
    nombre = sin;
  } else {
    const partes = [
      valorDe(lineas, /nombre\s*\(\s*s\s*\)\s*:/i),
      valorDe(lineas, /primer\s+apellido\s*:/i),
      valorDe(lineas, /segundo\s+apellido\s*:/i),
    ].filter(Boolean);
    nombre = partes.join(" ");
    if (!nombre) nombre = valorDe(lineas, /^\s*nombre\s*:/i);
  }
  nombre = nombre.replace(/\s+/g, " ").trim().toUpperCase();

  const cp = (crudo.match(/c[oó]digo\s+postal\s*:?\s*(\d{5})\b/i) || [])[1] || "";
  const regimenes = leerRegimenes(crudo);
  const estatus = valorDe(lineas, /estatus\s+en\s+el\s+padr[oó]n\s*:/i).split(/\s/)[0].toUpperCase();
  if (estatus && estatus !== "ACTIVO") avisos.push(`La constancia dice que el estatus es ${estatus}`);
  if (regimenes.length > 1) avisos.push("La constancia trae más de un régimen: pregúntale al cliente con cuál quiere su factura");

  const faltan = [];
  if (!rfc) faltan.push("rfc");
  if (!nombre) faltan.push("nombre");
  if (!cp) faltan.push("codigoPostal");
  if (!regimenes.length) faltan.push("regimen");
  return { rfc, tipo: revision.tipo, nombre, codigoPostal: cp, regimenes, estatus, faltan, avisos };
}

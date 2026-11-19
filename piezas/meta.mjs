// Cuántas reseñas nuevas faltan, más o menos, para llegar a la meta de calificación.
//
//   n = ceil(N × (meta − actual) / (promedio − meta))
//
// N es el número de reseñas de hoy y promedio, la calificación que el dueño espera de sus reseñas
// nuevas. Es una estimación: Google no da ese promedio y la calificación que enseña va redondeada.
// La cuenta se hace en centésimas y con enteros, para que 80 × 0.3 / 0.3 dé 80 y no 81.

import { formatoCalificacion, leerDecimal } from "./formato.mjs";

const valida = (c) => Number.isInteger(c) && c >= 100 && c <= 500;

/**
 * @param {object} datos  calificaciones en centésimas (4.3 → 430) y reseñas como entero
 * @returns {{ estado: "faltan" | "llegaste" | "no-llegas" | "imposible" | "datos", n?: number }}
 *   «imposible»: meta de 5.0 con reseñas abajo de 5; el promedio exacto ya no llega a 5.0.
 */
export function resenasFaltantes({ actual, resenas, meta, promedio }) {
  if (!valida(meta) || !valida(promedio) || !Number.isInteger(resenas) || resenas < 0) return { estado: "datos" };
  if (resenas === 0) return promedio >= meta ? { estado: "faltan", n: 1 } : { estado: "no-llegas" };
  if (!valida(actual)) return { estado: "datos" };
  if (actual >= meta) return { estado: "llegaste" };
  if (meta === 500) return { estado: "imposible" };
  if (promedio <= meta) return { estado: "no-llegas" };
  const numerador = resenas * (meta - actual);
  const denominador = promedio - meta;
  return { estado: "faltan", n: Math.ceil(numerador / denominador) };
}

/** Lo mismo, a partir de lo que escribió la persona («4.3», «64», «4,5», «4.8»). */
export function resenasFaltantesDeTexto({ actual, resenas, meta, promedio }) {
  const r = String(resenas == null ? "" : resenas).replace(/[\s,]/g, "");
  return resenasFaltantes({
    actual: leerDecimal(actual),
    resenas: /^\d{1,7}$/.test(r) ? Number(r) : NaN,
    meta: leerDecimal(meta),
    promedio: leerDecimal(promedio),
  });
}

/**
 * El resultado en partes, para pintarlo grande:
 *   { antes: "Te faltan unas", cifra: "43 reseñas", despues: "para llegar a 4.5 si tus reseñas nuevas promedian 4.8" }
 * Si no hay cifra, solo trae `frase`. Siempre trae `frase`, la oración completa.
 */
export function partesMeta(resultado, meta, promedio) {
  const m = formatoCalificacion(meta);
  switch (resultado.estado) {
    case "faltan": {
      const uno = resultado.n === 1;
      const antes = uno ? "Te falta" : "Te faltan unas";
      const cifra = uno ? "1 reseña" : `${resultado.n.toLocaleString("en-US")} reseñas`;
      const despues = `para llegar a ${m} si tus reseñas nuevas promedian ${formatoCalificacion(promedio)}`;
      return { antes, cifra, despues, frase: `${antes} ${cifra} ${despues}` };
    }
    case "llegaste":
      return { frase: "Ya estás en tu meta" };
    case "imposible":
      return { frase: "Con reseñas abajo de 5, el promedio ya no llega a 5.0. Prueba con 4.9" };
    case "no-llegas":
      return { frase: `Para llegar a ${m}, tus reseñas nuevas tienen que promediar más de ${m}` };
    default:
      return { frase: "Escribe calificaciones de 1 a 5 y tus reseñas" };
  }
}

/** El resultado en una frase. */
export function fraseMeta(resultado, meta, promedio) {
  return partesMeta(resultado, meta, promedio).frase;
}

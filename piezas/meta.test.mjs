import { test } from "node:test";
import assert from "node:assert/strict";
import { fraseMeta, partesMeta, resenasFaltantes, resenasFaltantesDeTexto } from "./meta.mjs";

test("80 reseñas a 4.2 con meta 4.5: 48 con promedio 5, 80 con 4.8, 120 con 4.7", () => {
  assert.deepEqual(resenasFaltantes({ actual: 420, resenas: 80, meta: 450, promedio: 500 }), { estado: "faltan", n: 48 });
  assert.deepEqual(resenasFaltantes({ actual: 420, resenas: 80, meta: 450, promedio: 480 }), { estado: "faltan", n: 80 });
  assert.deepEqual(resenasFaltantes({ actual: 420, resenas: 80, meta: 450, promedio: 470 }), { estado: "faltan", n: 120 });
});

test("64 reseñas a 4.3, meta 4.5 y promedio 4.8: unas 43, dicho como estimación", () => {
  const r = resenasFaltantesDeTexto({ actual: "4.3", resenas: "64", meta: "4.5", promedio: "4.8" });
  assert.deepEqual(r, { estado: "faltan", n: 43 });
  assert.equal(fraseMeta(r, 450, 480), "Te faltan unas 43 reseñas para llegar a 4.5 si tus reseñas nuevas promedian 4.8");
  assert.deepEqual(partesMeta(r, 450, 480), {
    antes: "Te faltan unas",
    cifra: "43 reseñas",
    despues: "para llegar a 4.5 si tus reseñas nuevas promedian 4.8",
    frase: "Te faltan unas 43 reseñas para llegar a 4.5 si tus reseñas nuevas promedian 4.8",
  });
});

test("caso 1, faltan: redondea hacia arriba y acepta coma decimal", () => {
  assert.deepEqual(resenasFaltantesDeTexto({ actual: "4,1", resenas: "10", meta: "4,2", promedio: "4,8" }), { estado: "faltan", n: 2 });
  assert.equal(fraseMeta({ estado: "faltan", n: 1 }, 450, 480), "Te falta 1 reseña para llegar a 4.5 si tus reseñas nuevas promedian 4.8");
  assert.equal(fraseMeta({ estado: "faltan", n: 1200 }, 400, 425), "Te faltan unas 1,200 reseñas para llegar a 4.0 si tus reseñas nuevas promedian 4.25");
});

test("caso 2, el promedio de las nuevas no supera la meta", () => {
  for (const promedio of [450, 440]) {
    const r = resenasFaltantes({ actual: 420, resenas: 80, meta: 450, promedio });
    assert.deepEqual(r, { estado: "no-llegas" });
    assert.equal(fraseMeta(r, 450), "Para llegar a 4.5, tus reseñas nuevas tienen que promediar más de 4.5");
  }
});

test("meta de 5.0 con reseñas abajo de 5: no se llega y se sugiere 4.9", () => {
  for (const promedio of ["5", "4.9", "5.0"]) {
    const r = resenasFaltantesDeTexto({ actual: "4.8", resenas: "120", meta: "5.0", promedio });
    assert.deepEqual(r, { estado: "imposible" });
    assert.equal(fraseMeta(r, 500, 500), "Con reseñas abajo de 5, el promedio ya no llega a 5.0. Prueba con 4.9");
  }
  assert.deepEqual(resenasFaltantesDeTexto({ actual: "5", resenas: "12", meta: "5", promedio: "5" }), { estado: "llegaste" });
  assert.deepEqual(resenasFaltantesDeTexto({ actual: "", resenas: "0", meta: "5", promedio: "5" }), { estado: "faltan", n: 1 });
  assert.deepEqual(resenasFaltantesDeTexto({ actual: "4.8", resenas: "120", meta: "4.9", promedio: "5" }), { estado: "faltan", n: 120 });
});

test("caso 3, ya llegó a la meta", () => {
  for (const actual of [450, 470]) {
    const r = resenasFaltantes({ actual, resenas: 80, meta: 450, promedio: 480 });
    assert.deepEqual(r, { estado: "llegaste" });
    assert.equal(fraseMeta(r, 450), "Ya estás en tu meta");
  }
});

test("caso 4, sin reseñas todavía: basta una a la altura de la meta", () => {
  assert.deepEqual(resenasFaltantes({ actual: NaN, resenas: 0, meta: 450, promedio: 480 }), { estado: "faltan", n: 1 });
  assert.deepEqual(resenasFaltantes({ actual: 300, resenas: 0, meta: 450, promedio: 440 }), { estado: "no-llegas" });
});

test("datos fuera de rango o incompletos", () => {
  for (const datos of [
    { actual: "6", resenas: "10", meta: "4.5", promedio: "4.8" },
    { actual: "4.3", resenas: "-3", meta: "4.5", promedio: "4.8" },
    { actual: "4.3", resenas: "diez", meta: "4.5", promedio: "4.8" },
    { actual: "", resenas: "10", meta: "4.5", promedio: "4.8" },
    { actual: "4.3", resenas: "10", meta: "0.5", promedio: "4.8" },
  ]) {
    assert.deepEqual(resenasFaltantesDeTexto(datos), { estado: "datos" }, JSON.stringify(datos));
  }
});

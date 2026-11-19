// La liga de WhatsApp que abre el chat con el ticket ya escrito.
//   https://wa.me/525512345678?text=<mensaje>   abre el chat con ese número
//   https://wa.me/?text=<mensaje>               deja elegir el contacto
// La persona todavía tiene que tocar Enviar en WhatsApp: abrir la liga no manda nada.

/** Codifica un texto para la liga. Acentos, emojis y saltos de línea van en porcentaje, y también ! ' ( ) *. */
export function codificar(texto) {
  return encodeURIComponent(String(texto)).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function soloDigitos(texto) {
  return String(texto == null ? "" : texto).replace(/\D/g, "");
}

/** Lada del país: de una a tres cifras. Por defecto, México (52). */
export function limpiarLada(lada) {
  const d = soloDigitos(lada);
  return d.length >= 1 && d.length <= 3 ? d : "52";
}

/**
 * Revisa el número que escribió o pegó la persona («55 1234 5678», «+52 55-1234-5678», «044 55…»).
 * Devuelve { numero, digitos, faltan, sobran }: `numero` va con lada y listo para la liga, o vacío.
 */
export function revisarNumero(texto, lada = "52") {
  const l = limpiarLada(lada);
  let d = soloDigitos(texto);
  if (l === "52") {
    if (d.length === 15 && d.startsWith("00521")) d = d.slice(5);
    else if (d.length === 14 && d.startsWith("0052")) d = d.slice(4);
    else if (d.length === 13 && (d.startsWith("521") || d.startsWith("044") || d.startsWith("045"))) d = d.slice(3);
    else if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
    return {
      numero: d.length === 10 ? "52" + d : "",
      digitos: d,
      faltan: d.length < 10 ? 10 - d.length : 0,
      sobran: d.length > 10 ? d.length - 10 : 0,
    };
  }
  if (d.startsWith("00" + l)) d = d.slice(2 + l.length);
  else if (d.startsWith(l) && d.length - l.length >= 8) d = d.slice(l.length);
  const valido = d.length >= 7 && d.length <= 12;
  return { numero: valido ? l + d : "", digitos: d, faltan: d.length < 7 ? 7 - d.length : 0, sobran: d.length > 12 ? d.length - 12 : 0 };
}

/**
 * Quita la lada que la persona pegó junto con el número («+52 442 123 4567» → «442 123 4567»),
 * para que no se vea dos veces junto a la lada fija del campo. Solo la quita cuando lo que queda es
 * un número completo; si no, devuelve el texto como venía.
 */
export function quitarLada(texto, lada = "52") {
  const original = String(texto == null ? "" : texto);
  const todos = soloDigitos(original);
  const { numero, digitos } = revisarNumero(original, lada);
  if (!numero || digitos === todos) return original;
  let sobran = todos.length - digitos.length;
  let i = 0;
  while (sobran > 0 && i < original.length) {
    if (/\d/.test(original[i])) sobran--;
    i++;
  }
  return original.slice(i).replace(/^[\s.\-)]+/, "");
}

/** Número listo para la liga (lada y diez cifras en México) o vacío si no es válido. */
export function normalizarNumero(texto, lada = "52") {
  return revisarNumero(texto, lada).numero;
}

/** Liga `wa.me` con el mensaje. Sin número válido, WhatsApp deja elegir el contacto. */
export function ligaWhatsApp(mensaje, numero = "") {
  const n = soloDigitos(numero);
  return `https://wa.me/${n}?text=${codificar(mensaje)}`;
}

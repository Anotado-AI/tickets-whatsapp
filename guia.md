# Tickets por WhatsApp con tu liga para calificarte en Google Maps

Guía para la IA que arma la app con el dueño del negocio

Esta guía explica cómo armar la app de tickets de un negocio. La app es una página web que el negocio abre en el celular donde tiene su WhatsApp. Ahí arma el ticket de cada venta y lo manda por WhatsApp al cliente, con la liga para calificar al negocio en Google Maps. No hay cuentas, servidor ni archivos por negocio: el nombre del negocio y su liga van escritos en la dirección de la app.

La app no guarda los teléfonos de los clientes ni manda nada después del ticket. El ticket sale del WhatsApp del celular que abre la app, y la persona toca Enviar en WhatsApp.

## Qué hace la app

- **Ticket.** El negocio escribe la cantidad, el concepto y el precio de cada producto. La app suma el total, pone el folio y la fecha, y arma el mensaje. El botón «Mandar por WhatsApp» abre el chat del cliente con el ticket escrito. Sin número, WhatsApp deja elegir el contacto. También hay un botón «Copiar ticket». Si un precio o una cantidad no es un número, la app marca el campo, dice cuál corregir y no deja mandar el ticket. Después de mandarlo, el aviso trae «Volver a abrir» por si hace falta abrir otra vez el mismo ticket.
- **QR.** Un código QR grande con la liga para calificar, para el cliente que no da su número.
- **Mi meta.** El dueño escribe su calificación, sus reseñas, la calificación que quiere y el promedio que espera de sus reseñas nuevas. La app le estima cuántas reseñas le faltan.
- **Ajustes.** Cambia el nombre, la liga, el regalo o el pie, y entrega la liga nueva.

Así le llega el ticket al cliente:

```
*Panadería San José*
Ticket 0042 · 20 nov 2026, 13:05

6 × Concha: $72.00
1 × Pastel de tres leches: $280.00
*Total: $352.00*
Av. Juárez 120, Puebla

Gracias por tu compra.

🎁 Regalo para un amigo: 10% en su primera compra con el código AMIGO10.
No hace falta calificarnos para usarlo.

¿Cómo te atendimos? Cuéntanos en Google Maps:
https://g.page/r/XXXX/review
```

Los asteriscos ponen el texto en negritas en WhatsApp.

## Cómo llevar la conversación

La IA hace el trabajo y el dueño decide.

1. Investiga el negocio con su nombre y su ciudad: cómo aparece en Google Maps, qué vende, su dirección y su horario.
2. En un solo mensaje, propón lo que encontraste con opciones numeradas, para que el dueño conteste con números:
   - **El nombre**, como lo conocen sus clientes y como aparece en su ficha de Google Maps.
   - **El regalo para un amigo**, tres opciones y una cuarta sin regalo. Es un beneficio para un amigo del cliente, por ejemplo «10% en su primera compra con el código AMIGO10» o «un café de cortesía en su primera visita». Va en todos los tickets, califiquen o no.
   - **El pie del ticket**: la dirección, el horario o las dos cosas. El RFC solo si el dueño lo da; no lo busques ni lo inventes.
3. Pídele al dueño su liga de reseñas. Abajo están los pasos para conseguirla y comprobarla.
4. Arma la liga de la app y entrégala.

No pidas contraseñas, cuentas ni archivos. No inventes la liga de reseñas ni datos del negocio: si no los encontraste, pregunta.

## La liga para calificar en Google

Google la da en el Perfil de Negocio. Pasos en la computadora:

1. Entra a business.google.com con la cuenta del negocio.
2. Haz clic en «Leer opiniones».
3. Haz clic en «Obtener más opiniones».
4. Haz clic en «Copiar». La liga se parece a `https://g.page/r/…/review`.

Ahí mismo Google también da un código QR.

Si no tiene computadora a la mano: abre su negocio en la app de Google Maps, toca Compartir y Copiar. Esa liga abre su ficha y su cliente toca Opiniones para calificarlo. Cuando esté en la computadora, que la cambie por la de Obtener más opiniones, que abre directo la calificación. Las dos funcionan en la app.

Si el negocio no tiene ficha en Google Maps, primero hay que crear su Perfil de Negocio en business.google.com. Cuando Google lo publique, ya tiene liga de reseñas.

Cómo comprobar la liga: que el dueño la abra en su celular. Debe abrir la ventana para calificar su negocio, o su ficha si es la liga de Compartir. Si abre la portada de Google o el negocio de otra persona, la liga está mal y hay que copiarla otra vez.

La liga puede tener hasta 500 caracteres. Usa la liga corta que da Google (`https://g.page/r/…/review` o `https://maps.app.goo.gl/…`), no la dirección larga que se ve en el navegador.

## Cómo se arma la liga

La app vive en `https://anotado.ai/tickets/app/`. Agrégale los datos del negocio: primero un signo `?` y luego cada dato como `nombre=valor`, separados por `&`.

| Dato | Qué lleva | Regla |
|---|---|---|
| `n` | Nombre del negocio | Obligatorio. Hasta 40 caracteres |
| `r` | Liga para calificar en Google | Obligatoria para el renglón de reseña y el QR. Empieza con `https://`, sin espacios y hasta 500 caracteres |
| `g` | Regalo para un amigo | Opcional. Hasta 120 caracteres |
| `p` | Pie del ticket: dirección, RFC u horario | Opcional. Hasta 120 caracteres |
| `l` | Lada del país | Opcional. Si no va, es 52, México |

Codifica cada valor con `encodeURIComponent`, como en el código de abajo. La liga de reseñas también se codifica, porque lleva `:` y `/`. La liga terminada va en un solo renglón, sin espacios ni letras con acento. Un nombre, regalo o pie más largo que su límite se recorta. Si la liga de reseñas no sirve (no empieza con `https://`, lleva espacios o pasa de 500 caracteres), la app abre en Ajustes con un aviso para que el dueño la pegue otra vez.

Con JavaScript:

```js
const datos = {
  n: "Panadería San José",
  r: "https://g.page/r/XXXX/review",
  g: "10% en su primera compra con el código AMIGO10",
  p: "Av. Juárez 120, Puebla",
};
const liga = "https://anotado.ai/tickets/app/?" + Object.entries(datos)
  .filter(([, valor]) => valor)
  .map(([dato, valor]) => dato + "=" + encodeURIComponent(valor))
  .join("&");
```

Si no puedes correr código, codifica a mano con esta lista: espacio `%20`, á `%C3%A1`, é `%C3%A9`, í `%C3%AD`, ó `%C3%B3`, ú `%C3%BA`, Á `%C3%81`, É `%C3%89`, Í `%C3%8D`, Ó `%C3%93`, Ú `%C3%9A`, ñ `%C3%B1`, Ñ `%C3%91`, ü `%C3%BC`, Ü `%C3%9C`, ¿ `%C2%BF`, ¡ `%C2%A1`, ° `%C2%B0`, % `%25`, & `%26`, # `%23`, + `%2B`, coma `%2C`, : `%3A`, / `%2F`, ? `%3F` y = `%3D`. Las letras sin acento, los números, el punto y el guion van igual.

Ejemplo completo, que abre la app con la panadería de ejemplo:

```
https://anotado.ai/tickets/app/?n=Panader%C3%ADa%20San%20Jos%C3%A9&r=https%3A%2F%2Fanotado.ai%2Ftickets%2Fejemplo%2F&g=10%25%20en%20su%20primera%20compra%20con%20el%20c%C3%B3digo%20AMIGO10&p=Av.%20Ju%C3%A1rez%20120%2C%20Puebla
```

## Qué entregar

1. La liga completa, sola en un renglón.
2. Tres instrucciones para el dueño:
   - Ábrela en el celular donde tienes el WhatsApp del negocio. El ticket sale del WhatsApp del celular que abre la app.
   - Agrégala a tu pantalla de inicio. En iPhone, en Safari toca Compartir y luego «Agregar a inicio». En Android, en Chrome toca ⋮ y luego «Agregar a la pantalla principal».
   - Prueba mandándote un ticket a tu propio número antes de usarla con clientes. En el ticket que te llegue, toca la liga de reseñas: debe abrir la ventana para calificar tu negocio. Si abre la portada de Google, cambia la liga en Ajustes.
3. Cómo pedir el permiso en el mostrador: «¿Te mando tu ticket por WhatsApp?». Solo con un sí se escribe el número.

Antes de entregar, revisa la liga: empieza con `https://anotado.ai/tickets/app/?n=`, lleva `r` con una liga `https://` de hasta 500 caracteres, no tiene espacios y cada valor está codificado. Al abrir la app, el negocio puede revisar y cambiar todo en Ajustes.

## Si ya cobra con un sistema de caja o con terminal

La app no cobra: arma el ticket y lo manda. Quien ya cobra con otro sistema puede tomar solo la parte que le sirve.

- **Cobra con terminal** (de banco o de pagos con tarjeta): cobra como siempre y luego arma el ticket en la app con el total, o enseña el QR de la pantalla QR.
- **Su punto de venta imprime tickets:** imprime el QR de la liga de reseñas en el ticket o ponlo en el mostrador.
- **Lleva sus ventas en una hoja de cálculo:** arma la liga de WhatsApp con una fórmula.
- **Tiene tienda en línea o su propio sistema:** usa la plantilla del mensaje y la liga de WhatsApp en su código.

El código completo de cada parte, con sus pruebas, está en `https://github.com/Anotado-AI/tickets-whatsapp`, carpeta `piezas`. Las funciones de abajo se llaman igual y usan las mismas unidades que las de esa carpeta.

### El mensaje del ticket

Las cantidades van en milésimas (6 piezas son `6000`; 1.5 kg son `1500`) y los precios en centavos ($12 son `1200`). Así las sumas no arrastran errores de decimales. La fecha es un `Date`.

```js
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function pesos(centavos) {
  return "$" + Math.floor(centavos / 100).toLocaleString("en-US") + "." + String(centavos % 100).padStart(2, "0");
}

function conPunto(texto) {
  return /[.!?…)»"']$/.test(texto) ? texto : texto + ".";
}

function fechaTicket(d) {
  const hora = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${hora}`;
}

// conceptos: [{ cantidad: 6000, descripcion: "Concha", unitario: 1200 }]
function armarMensaje({ negocio, folio, fecha, conceptos, pie, regalo, resena }) {
  const importe = (c) => Math.round((c.cantidad * c.unitario) / 1000);
  const renglones = conceptos.map((c) => `${c.cantidad / 1000} × ${c.descripcion || "Consumo"}: ${pesos(importe(c))}`);
  const total = conceptos.reduce((suma, c) => suma + importe(c), 0);
  const lineas = [`*${negocio}*`, `Ticket ${String(folio).padStart(4, "0")} · ${fechaTicket(fecha)}`, "", ...renglones, `*Total: ${pesos(total)}*`];
  if (pie) lineas.push(pie);
  lineas.push("", "Gracias por tu compra.");
  if (regalo) lineas.push("", `🎁 Regalo para un amigo: ${conPunto(regalo)}`, "No hace falta calificarnos para usarlo.");
  if (resena) lineas.push("", "¿Cómo te atendimos? Cuéntanos en Google Maps:", resena);
  return lineas.join("\n");
}
```

El regalo termina con punto porque abajo sigue otra oración. Esta versión corta supone datos ya revisados. La de `piezas/mensaje.mjs` además limpia los textos y se detiene si una cantidad o un precio no es un número, para que nunca salga un renglón en $0.00 por error.

### La liga de WhatsApp con el texto

`https://wa.me/<lada y número>?text=<mensaje codificado>` abre el chat con ese número y el mensaje escrito. `https://wa.me/?text=<mensaje codificado>` deja elegir el contacto. El número va con lada y sin espacios: `525512345678`.

```js
function ligaWhatsApp(mensaje, numero = "") {
  return "https://wa.me/" + numero.replace(/\D/g, "") + "?text=" + encodeURIComponent(mensaje);
}
```

En Google Sheets, con el número de diez cifras en B2 y el mensaje en C2 (si tu hoja usa punto y coma entre argumentos, cambia las comas):

```
=HYPERLINK("https://wa.me/52" & B2 & "?text=" & ENCODEURL(C2), "Mandar ticket")
```

### El QR de la liga de reseñas

Google da el QR en la computadora, en «Obtener más opiniones». La pantalla QR de la app también lo enseña. Para generarlo en tu código, la app usa la librería `uqr` (licencia MIT):

```js
import { renderSVG } from "uqr";
const svg = renderSVG("https://g.page/r/XXXX/review");
```

### Cuántas reseñas faltan para la meta

```
n = redondear hacia arriba( N × (meta − actual) / (promedio − meta) )
```

N es el número de reseñas de hoy y promedio, la calificación que el dueño espera de sus reseñas nuevas. Es una estimación: Google no da ese promedio y enseña la calificación redondeada. Ejemplo: 80 reseñas a 4.2, meta 4.5 y reseñas nuevas de 4.8 en promedio dan unas 80. Si el promedio de las nuevas no supera la meta, no se llega. Una meta de 5.0 ya no se alcanza si hay alguna reseña abajo de 5. Tu calificación en Google puede tardar hasta dos semanas en actualizarse. En Google Sheets:

```
=ROUNDUP(N * (meta - actual) / (promedio - meta), 0)
```

## Instala tu propia copia

La app es un solo archivo, `index.html`, en `https://github.com/Anotado-AI/tickets-whatsapp`. Para tenerla en una dirección propia:

- **GitHub Pages.** Haz un fork del repositorio, entra a Settings, Pages, elige la rama `main` y la carpeta raíz, y guarda. Queda en `https://<tu usuario>.github.io/tickets-whatsapp/`.
- **Cloudflare Pages.** En el panel de Cloudflare entra a Workers & Pages, crea un proyecto de Pages y sube la carpeta del repositorio. Queda en `https://<proyecto>.pages.dev/`.
- **Tu propio sitio.** Sube `index.html` a cualquier carpeta.

La liga de tu copia es esa dirección con los mismos datos: `?n=…&r=…`. La app no necesita servidor ni base de datos.

## Reglas que la app respeta y que el negocio también debe respetar

Reglas de Google para las opiniones:

- Se pide la opinión a todos los clientes y en el mismo tono, no solo a los contentos.
- No se da nada a cambio de calificar: ni descuentos ni regalos ni cortesías.
- No se piden cinco estrellas ni opiniones positivas.
- No se presiona al cliente dentro del negocio. Califica después, cuando quiera.
- No se ponen cuotas de reseñas al personal. La app no cuenta tickets por cajero.

Si un negocio rompe estas reglas, Google puede dejar de publicar sus opiniones nuevas por un tiempo, quitar opiniones y poner un aviso en su perfil.

El regalo para un amigo es para todos los clientes, califiquen o no. El ticket lo dice justo debajo del regalo, «No hace falta calificarnos para usarlo.», y la reseña va en un renglón aparte.

Reglas con el cliente:

- Se le pregunta antes: «¿Te mando tu ticket por WhatsApp?». Sin su sí, no se escribe su número.
- La app no guarda su número ni le manda nada después del ticket.
- Si pide no recibir mensajes, se respeta.

## Lo que viene

En las siguientes semanas, Anotado.AI publica cómo facturar por WhatsApp. Para recibirlo, suscríbete gratis en https://anotado.ai/suscribirse

Guía de Anotado.AI, 20 de noviembre de 2026. Contacto: rafael@anotado.ai

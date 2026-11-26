# Tickets por WhatsApp

Ticket, reseña y factura en un solo WhatsApp. Una app web de un solo archivo para mandar el ticket de cada venta por WhatsApp, con la liga para que el cliente califique al negocio en Google Maps y, si el negocio factura, la pregunta «¿Necesitas factura?». La carpeta `factura/` tiene la guía y el código para que la IA del dueño haga la factura con la constancia del cliente y el ticket.

El negocio abre la app en el celular donde tiene su WhatsApp, escribe lo que vendió y toca «Mandar por WhatsApp». Se abre el chat del cliente con el ticket escrito y la persona toca Enviar. La app no tiene cuentas ni servidor, no guarda los teléfonos de los clientes y no manda nada después del ticket.

Versión en línea: https://anotado.ai/tickets/ y, la factura, https://anotado.ai/factura/

## Qué hace

- **Ticket.** Conceptos con cantidad y precio, total en pesos, folio de cuatro cifras y fecha. «Mandar por WhatsApp» abre `wa.me` con el ticket; sin número, WhatsApp deja elegir el contacto. También copia el ticket. Si un precio o una cantidad no es un número, marca el campo y no deja mandar. Después de mandar, el aviso trae «Volver a abrir» con el mismo ticket y el mismo folio.
- **QR.** La liga para calificar en un código QR grande, para el cliente que no da su número.
- **Mi meta.** Una estimación de cuántas reseñas faltan para llegar a la calificación que quiere el negocio, según el promedio que espera de sus reseñas nuevas.
- **Factura.** Con la casilla «Preguntar si necesita factura», el ticket pregunta «¿Necesitas factura?». El cliente responde con su constancia de situación fiscal o con sus datos, y la IA del dueño hace la factura (carpeta `factura/`).
- **Ajustes.** Cambia los datos y entrega la liga nueva.

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

## Cómo se usa

Los datos del negocio van en la liga de la app:

```
https://anotado.ai/tickets/app/?n=Panader%C3%ADa%20San%20Jos%C3%A9&r=https%3A%2F%2Fg.page%2Fr%2FXXXX%2Freview
```

| Dato | Qué lleva | Regla |
|---|---|---|
| `n` | Nombre del negocio | Obligatorio. Hasta 40 caracteres |
| `r` | Liga para calificar en Google | Solo `https://`, sin espacios y hasta 500 caracteres. Sin ella no hay renglón de reseña ni QR |
| `g` | Regalo para un amigo | Opcional. Hasta 120 caracteres |
| `p` | Pie del ticket: dirección, RFC u horario | Opcional. Hasta 120 caracteres |
| `f` | Pregunta de factura | Opcional. `f=1` suma «¿Necesitas factura? Mándanos tu constancia de situación fiscal o tu RFC, nombre, código postal y régimen.» Sin `f`, el ticket queda igual |
| `l` | Lada del país | Opcional. 52 si no va |

Cada valor va codificado con `encodeURIComponent`. Cualquier otro dato se ignora. Sin `n`, la app abre en «Arma tu app», un formulario que arma la liga. Si `r` no sirve, la app abre en Ajustes con un aviso.

La liga para calificar se consigue en la computadora: business.google.com, «Leer opiniones», «Obtener más opiniones», «Copiar». Desde el celular, la liga de Compartir de la ficha en Google Maps también sirve: abre la ficha y el cliente toca Opiniones. Si el negocio no tiene ficha en Google Maps, primero se crea su Perfil de Negocio en business.google.com. Para comprobar la liga, ábrela en el celular: debe abrir la ventana para calificar el negocio; si abre la portada de Google, está mal.

Después: abrir la liga en el celular del WhatsApp del negocio, agregarla a la pantalla de inicio y probar mandándose un ticket.

`guia.md` explica todo esto para la IA que arma la app con el dueño de un negocio.

## Instala tu copia

La app es `index.html` y no necesita nada más.

- **GitHub Pages:** haz un fork, entra a Settings, Pages, elige la rama `main` y la carpeta raíz. Queda en `https://<tu usuario>.github.io/tickets-whatsapp/`.
- **Cloudflare Pages:** crea un proyecto de Pages y sube esta carpeta. Queda en `https://<proyecto>.pages.dev/`.
- **Cualquier sitio:** sube `index.html`.

Tu liga es esa dirección con los mismos datos: `?n=…&r=…`. En tu copia, la app usa la letra del sistema del teléfono.

## Piezas sueltas

Si ya cobras con un sistema de caja, una terminal, una hoja de cálculo o una tienda en línea, toma solo la parte que te sirve. Cada pieza es un módulo de JavaScript sin dependencias, con sus pruebas:

| Archivo | Qué hace |
|---|---|
| `piezas/mensaje.mjs` | Revisa lo que se escribió en cada renglón y arma el texto del ticket: conceptos, total, pie, regalo y liga de reseña |
| `piezas/liga.mjs` | Limpia el número del cliente, le quita la lada si viene pegada y arma la liga `wa.me` con el texto |
| `piezas/meta.mjs` | Cuenta cuántas reseñas faltan para la meta |
| `piezas/configuracion.mjs` | Lee y arma la liga de la app, y limpia lo que llega en ella |
| `piezas/formato.mjs` | Pesos, cantidades, fecha, folio y limpieza de texto |

```js
import { armarMensaje } from "./piezas/mensaje.mjs";
import { ligaWhatsApp, normalizarNumero } from "./piezas/liga.mjs";

const mensaje = armarMensaje({
  negocio: "Panadería San José",
  folio: 42,
  fecha: new Date(),
  conceptos: [{ cantidad: 6000, descripcion: "Concha", unitario: 1200 }], // milésimas y centavos
  pie: "Av. Juárez 120, Puebla",
  resena: "https://g.page/r/XXXX/review",
});
const liga = ligaWhatsApp(mensaje, normalizarNumero("55 1234 5678"));
```

La cuenta de la meta es `n = ceil(N × (meta − actual) / (promedio − meta))`: con 80 reseñas a 4.2, meta 4.5 y reseñas nuevas de 4.8 en promedio, faltan unas 80. Es una estimación, porque el promedio de las reseñas nuevas es un supuesto y Google enseña la calificación redondeada.

Para el QR, la app usa [uqr](https://github.com/unjs/uqr), con licencia MIT.

Pruebas, con Node 22 o más nuevo:

```
node --test "piezas/*.test.mjs" "factura/piezas/*.test.mjs"
```

## Factura

El cliente responde al ticket con su constancia de situación fiscal (PDF o foto) o con su RFC, nombre, código postal y régimen. El dueño se los reenvía a su IA con el ticket. La IA arma la factura, la timbra con el proveedor de facturas del negocio y le da el PDF y el XML para mandárselos por WhatsApp.

| Archivo | Qué hace |
|---|---|
| `factura/guia.md` | La guía para la IA del dueño: escoger proveedor, conectarlo, dar de alta los productos, facturar cada venta, rechazos y factura global. En línea: https://anotado.ai/factura/guia |
| `factura/piezas/rfc.mjs` | Revisa la forma del RFC y su dígito verificador |
| `factura/piezas/constancia.mjs` | Saca RFC, nombre, código postal y régimen del texto de una constancia |
| `factura/piezas/ticket.mjs` | Lee los conceptos y el total de un ticket de WhatsApp |
| `factura/piezas/iva.mjs` | Separa la base y el IVA de precios que ya los traen, sin perder un centavo |
| `factura/piezas/pedido.mjs` | Arma y revisa el pedido para la API de Facturapi antes de mandarlo |
| `factura/piezas/catalogos.mjs` | Regímenes, usos, formas y métodos de pago de los catálogos del SAT (20-nov-2026) |
| `factura/script/facturar.mjs` | Factura por API con la llave del dueño |
| `factura/ejemplo/` | Ticket, constancia y productos de ejemplo, y la factura de prueba |

```
FACTURAPI_KEY=sk_test_... node factura/script/facturar.mjs --ticket factura/ejemplo/ticket.txt --constancia factura/ejemplo/constancia.txt --productos factura/ejemplo/productos.json --forma 01 --uso G03 --revisar
```

Con una llave `sk_test_`, la factura es de prueba y no va al SAT. Sin `--revisar`, factura y guarda el PDF y el XML. El script nunca escribe la llave en pantalla. Para leer una constancia en PDF usa `pdftotext` (Poppler).

Para facturar no hace falta exigir la constancia: bastan RFC, nombre, código postal y régimen. Condicionar la factura a la constancia es infracción (Código Fiscal de la Federación, art. 83, fr. IX).

## Reglas de Google y del cliente

La app está hecha para respetar las reglas de Google sobre opiniones:

- Se pide la opinión a todos los clientes y en el mismo tono.
- No se da nada a cambio de calificar.
- No se piden cinco estrellas ni opiniones positivas.
- No se presiona al cliente dentro del negocio ni se ponen cuotas de reseñas al personal. La app no cuenta tickets por cajero.

El regalo para un amigo va en todos los tickets, califique o no el cliente. Debajo, el ticket dice «No hace falta calificarnos para usarlo.», y la reseña va en un renglón aparte.

Con el cliente: se le pregunta antes «¿Te mando tu ticket por WhatsApp?». La app no guarda su número ni le manda nada después. Si pide no recibir mensajes, se respeta.

## Licencia

MIT, Anotado.AI, 2026. Ver `LICENSE`. El código QR usa uqr (MIT); su aviso está en `LICENCIAS_DE_TERCEROS.md`.

## Contacto

rafael@anotado.ai

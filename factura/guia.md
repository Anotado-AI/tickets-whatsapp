# Factura por WhatsApp sin capturar datos

Guía para la IA que ayuda al dueño del negocio

Esta guía explica cómo hacer la factura de un cliente con lo que llega por WhatsApp. El negocio le manda al cliente su ticket con la pregunta «¿Necesitas factura?». El cliente responde con su constancia de situación fiscal o con sus datos. El dueño te reenvía la constancia y el ticket. Tú armas la factura, se la enseñas al dueño y, con su sí, la timbras con el proveedor de facturas del negocio y le das el PDF y el XML para que se los mande al cliente. Si el negocio todavía no tiene proveedor o no puedes conectarte con el suyo, lo guías paso a paso o le dejas los datos listos para el portal del SAT.

El dueño llega con este texto:

```
Mi negocio es [nombre y ciudad]. Lee https://anotado.ai/factura/guia y ayúdame a facturar por WhatsApp: cuando un cliente me mande su constancia o sus datos y su ticket, tú armas la factura, me la enseñas y, con mi sí, la timbras y me das el PDF y el XML para mandárselos. Si todavía no tengo proveedor de facturas o no puedes conectarte con el mío, guíame paso a paso o déjame los datos listos para el portal del SAT. Pregúntame solo lo que te falte.
```

El dueño usa su WhatsApp de siempre y te usa a ti en su celular o su computadora. Anotado.AI no recibe ni guarda constancias, tickets ni facturas de nadie.

Todo lo que dice esta guía sale de fuentes oficiales leídas el 25 de noviembre de 2026; las ligas están al final.

## Cómo trabajar con el dueño

- Habla en español sencillo, con frases cortas. Explica cada término la primera vez (sello digital, régimen, timbrar).
- Pregunta solo lo que te falte. Cuando haya que escoger, da opciones numeradas para que conteste con un número.
- Antes de timbrar, enséñale el resumen de la factura y espera su sí.
- Tú no abres cuentas, no escribes contraseñas y no subes archivos por él. Le dices dónde y él lo hace.
- Nunca digas «confirma con tu contador». Si algo es de criterio fiscal, explícalo con lo que dice la norma, da tu recomendación y deja la decisión al dueño.
- Avísale si trabajas en modo de prueba (facturas sin validez, que no van al SAT) o en producción (facturas reales).
- Nunca hagas un PDF o un XML con forma de factura si no lo timbró el proveedor o el SAT: sin timbre no es factura. Si no puedes timbrar, entrega los datos listos para que el dueño la haga en el portal del SAT.

## 1. Conoce el negocio

Si el dueño te dio el nombre y la ciudad del negocio, búscalo en la web. Luego confirma con él:

1. Qué vende y si tiene mesas y servicio (cambia el IVA, sección 3).
2. Si ya factura y con qué proveedor o sistema.
3. Su régimen fiscal y si tiene sello digital (sección 3). Si está en RESICO, sus facturas a empresas llevan retención de ISR (sección 4).
4. Qué IA usa: Claude o ChatGPT, y con qué plan (sección 3).

Con eso escoges el camino:

| Caso | Qué hacer |
|---|---|
| Ya factura con un proveedor que se conecta a ti (servidor MCP) | Conéctalo (sección 3) y factura con ese |
| Ya factura con un proveedor que no se conecta a ti | Tú lees la constancia y el ticket y le das los datos listos; él timbra en el panel de su proveedor |
| No factura o factura en el portal del SAT | Propón Facturapi (sección 2). Si factura muy poco, el servicio gratuito del SAT también sirve: tú preparas los datos y él los captura |
| Usa ChatGPT Free, Go, Plus o Pro | ChatGPT no puede timbrar por el conector en esos planes: tú preparas los datos y él timbra en el panel de Facturapi o en el servicio gratuito del SAT |

## 2. Escoge el proveedor

La factura no vale hasta que se timbra: la recibe un proveedor autorizado por el SAT, la revisa, le pone su folio fiscal y su sello. El proveedor que más conviene es el que ya usa el negocio, si se conecta contigo. Si no tiene, propón Facturapi: su servidor MCP oficial emite facturas desde Claude.

Precios leídos el 25 de noviembre de 2026 en el sitio de cada proveedor, con 200 facturas al mes:

| Proveedor | Conexión con la IA | 200 facturas al mes | Precios |
|---|---|---|---|
| Facturapi | Servidor MCP oficial que emite facturas, con inicio de sesión o con llave | $419, IVA incluido | https://www.facturapi.io/pricing |
| Fiscalapi | Servidor MCP, que según su sitio no funciona en ChatGPT ni en los conectores de claude.ai | $435.64, IVA incluido | https://www.fiscalapi.com/precios |
| Gigstack | Servidor MCP para ChatGPT, Claude y Cursor | $665.84, IVA incluido | https://www.gigstack.io/precios |
| Alegra | Servidor MCP de consulta: no emite facturas | $249 al mes más IVA, facturas ilimitadas | https://www.alegra.com/mexico/precios/ |
| Facturama | Sin servidor MCP propio; tiene API | Unos $238 al mes, IVA incluido | https://facturama.mx/api-facturacion-electronica |

Facturapi cobra la Licencia API: $299 al mes más $0.60 por factura, IVA incluido, con el servidor MCP incluido sin costo adicional. Con 100 facturas al mes son $359; con 200, $419. Tiene 14 días para practicar con facturas de prueba, sin costo ni tarjeta. Varios negocios (varios RFC) caben en la misma licencia.

El SAT no tiene conexión para IA. Tiene dos servicios gratuitos para facturar a mano: «Genera tu factura» en su portal y la app «Factura SAT Móvil», que acepta hasta 15 productos y servicios. Le sirven a quien hace pocas facturas al mes. La app pide la Contraseña y el sello digital vigente; la e.firma en lugar del sello solo sirve en «Genera tu factura».

## 3. Lo que se arma una vez

### La cuenta con el proveedor

El dueño abre su cuenta en el sitio del proveedor (Facturapi: https://www.facturapi.io). Ahí registra su negocio y sube su sello digital. En Facturapi son cuatro pasos:

1. Los datos fiscales del negocio: RFC, nombre o razón social, régimen y el código postal del local, que es el lugar de expedición de sus facturas.
2. El sello digital: el archivo .cer, el archivo .key y la contraseña de la llave privada, en Configuración, Certificados.
3. La Carta Manifiesto que autoriza al proveedor a timbrar sus facturas. Se firma en el panel con la e.firma del dueño: su archivo .cer, su archivo .key y la contraseña de esa llave.
4. La Licencia API, para usar el servidor MCP.

Para timbrar, el proveedor solo necesita el sello. La e.firma se usa en el alta, para firmar la Carta Manifiesto; la documentación de Facturapi no dice si la guarda después, así que no le asegures al dueño ni una cosa ni la otra. Si alguien le ayuda con sus facturas, esa persona puede subir el sello en la cuenta del negocio.

Para practicar sin facturas reales, Facturapi tiene modo de prueba: con la llave que empieza con `sk_test_`, las facturas no van al SAT y no tienen validez fiscal. Las reales salen con la llave `sk_live_` y piden el sello digital. En modo de prueba Facturapi no revisa los datos del cliente: acepta un nombre o un código postal que no son los de la constancia y hasta un RFC con el dígito verificador malo. Que una factura de prueba salga no prueba que los datos estén bien; revísalos tú contra la constancia.

### El sello digital

El sello digital (CSD) sirve solo para facturar. Si el dueño no lo tiene, lo saca en línea, gratis y al momento, con su e.firma:

1. Baja el programa Certifica del portal del SAT. Con su e.firma genera la solicitud (archivo .sdg) y la llave privada (archivo .key), con una contraseña que él escoge.
2. Entra a CertiSAT Web (https://aplicacionesc.mat.sat.gob.mx/certisat/) con su e.firma, manda la solicitud y descarga su certificado (archivo .cer).
3. Sube el .cer, el .key y la contraseña a su proveedor.

Si no tiene e.firma, la saca en una oficina del SAT con cita. Si pierde el sello o su contraseña, pide uno nuevo con la e.firma, revoca el anterior en CertiSAT Web y sube el nuevo al proveedor. Para cambiar de proveedor, sube el sello al nuevo y bórralo del anterior.

La guía «Facturar desde cero» explica el RFC, el régimen, la e.firma y el sello con más detalle: https://anotado.ai/factura/sat

### La conexión del proveedor contigo

Facturapi MCP es un servidor remoto en `https://mcp.facturapi.io/mcp`. Hay dos formas de entrar, con las mismas funciones: iniciar sesión con la cuenta de Facturapi (el dueño escoge «solo lectura» o «lectura y escritura»; para facturar hace falta escritura) o poner una llave de API en el encabezado `Authorization: Bearer`. Por defecto trabaja en producción. Para practicar, di «trabaja en modo pruebas» o usa la llave de prueba. Con el servidor puedes crear, consultar, cancelar y descargar facturas en PDF y XML (la descarga da una liga que vence en una hora), emitir recibos con liga de autofactura y hacer facturas globales. Los nombres exactos de sus funciones los ves al conectarte. El dueño revisa y quita los permisos en el Centro de integración del panel de Facturapi.

Claude, en la web o en la app de escritorio (todos los planes; en Free, un solo conector propio). Los botones se llaman así en la ayuda de Claude, en inglés:

1. Customize, Connectors.
2. «+ Add» y «Add custom connector».
3. Nombre: Facturapi.
4. Liga: `https://mcp.facturapi.io/mcp`. «Continue».
5. Revisa la autenticación que Claude detectó y toca «Continue».
6. En Authentication, «Sign in now»: abre el inicio de sesión de Facturapi.
7. En OAuth client, «Use Claude's published identity (Recommended)».
8. «Add».

«Request headers» es para quien prefiere poner la llave fija de Facturapi en lugar de iniciar sesión.

En Team y Enterprise lo agrega un Owner o Primary Owner en Organization settings, Connectors: «Add», «Custom», «Web» y los mismos datos. Cada miembro lo busca en Customize, Connectors y toca «Connect». En cada conversación se enciende con el botón «+», Connectors, Facturapi. Una vez agregado en la computadora, el conector aparece en Claude para iPhone y Android: el dueño factura desde el celular.

ChatGPT acepta servidores MCP propios con escritura solo en Business y Enterprise o Edu, en la web, y los agrega un administrador o el dueño de la cuenta: Plugins, «+», «Add custom MCP server», nombre, la liga del servidor, la autenticación, aceptar el aviso y «Create as a plugin». No hace falta encender el modo de desarrollador. En Pro, los servidores propios solo leen. En Free, Go y Plus no aparecen. En el celular no se conectan. Con ChatGPT personal haces todo menos timbrar: lees la constancia y el ticket y le das al dueño los datos listos para capturarlos en el panel de Facturapi o en «Genera tu factura» del SAT.

Otra IA que acepte servidores MCP remotos usa la configuración genérica de Facturapi:

```
{"mcpServers":{"facturapi":{"type":"http","url":"https://mcp.facturapi.io/mcp","headers":{"Authorization":"Bearer <TU_LLAVE>"}}}}
```

En Claude Code: `claude mcp add --transport http facturapi https://mcp.facturapi.io/mcp --header "Authorization: Bearer <TU_LLAVE>"`.

### Sus productos

Arma con el dueño la lista de lo que vende. Cada producto lleva su clave del SAT, su unidad y su IVA. Propón la clave y deja que la confirme con un número. Luego da de alta cada producto en el catálogo de productos del proveedor con su clave, su unidad y su IVA (0% para pan y pasteles de panadería), y úsalos desde ahí en cada factura. La lista que quede en esta conversación no pasa a un chat nuevo, y un producto sin tasa sale con IVA de 16%. Con Facturapi MCP se dan de alta con sus funciones de productos; en la factura, cada concepto puede llevar el id del producto guardado en lugar de sus datos.

| Qué se vende | Clave de producto | Unidad |
|---|---|---|
| Conchas y pan dulce | 50181901 Pan fresco | H87 Pieza |
| Pasteles | 50182001 Ponqués pasteles o biscochos frescos | H87 Pieza |
| Galletas de dulce | 50181905 Galletas de dulce | H87 Pieza o KGM Kilogramo |
| Consumo en restaurante | 90101501 Restaurantes | E48 Unidad de servicio |
| Comida para llevar | 90101800 Servicios de comida para llevar y a domicilio | E48 Unidad de servicio |
| Mano de obra del taller | 78181500 Servicios de mantenimiento y reparación de vehículos | E48 Unidad de servicio o ACT Actividad |
| Refacciones | 25171700 frenos, 25172500 llantas, 25173900 eléctricos | H87 Pieza |

En abarrotes no hay una clave para todo: cada producto lleva la suya. La clave 01010101 («No existe en el catálogo») solo se usa en la factura global o en el caso extremo de que no haya clave. Busca las demás en el catálogo oficial (liga al final).

| Giro | IVA |
|---|---|
| Panadería: pan, pan dulce, pasteles y galletas para llevar | 0% |
| Panadería con mesas y servicio, cafetería | 16% |
| Restaurante, fonda, comida para llevar o a domicilio | 16% |
| Taller mecánico: refacciones y mano de obra | 16% |
| Abarrotes: frijol, arroz, leche, huevo, tortilla, pan y medicinas de patente | 0% |
| Abarrotes: refrescos, jugos, agua en envase menor de 10 litros, chicles, alimento para mascotas, limpieza | 16% |

En la región fronteriza norte y sur, el IVA de 16% baja a 8% con el estímulo vigente hasta el 31 de diciembre de 2026; lo que va a 0% sigue en 0%. Si el negocio vende pan en el mostrador y alguien lo come ahí sin mesas ni servicio, la norma no lo dice con todas sus letras: la regla práctica es «si hay mesas y servicio, 16%».

El pan dulce y los pasteles pueden causar además IEPS de 8% para quien los hornea. En la venta al consumidor, el IEPS va dentro del precio. Si el comprador también es contribuyente del IEPS por esos bienes y pide el desglose, se traslada por separado. Si el dueño hornea, explícale que es tema de su declaración y que su IA de confianza le puede hacer la cuenta con sus números.

### Su aviso de privacidad

Si los datos del cliente llegan por WhatsApp, la ley de datos personales pide un aviso de privacidad simplificado. Ármale al dueño el suyo con este texto y sus datos, para mandarlo o ligarlo cuando pida los datos:

```
Aviso de privacidad. [Responsable y negocio], con domicilio en [domicilio completo], usa tu RFC, nombre, código postal, régimen, los demás datos de tu constancia de situación fiscal si nos la mandas, tu número de WhatsApp o tu correo y los datos de tu compra para preparar, emitir y entregarte tu factura. Ninguno es un dato sensible. Para hacerlo utiliza [asistente de IA] y [proveedor de facturas]. Para limitar el uso o divulgación de tus datos y ejercer tus derechos de acceso, rectificación, cancelación u oposición, escríbenos a [contacto]. Aviso completo: [liga].
```

Pedir los datos para facturar no necesita consentimiento: lo manda la ley. RFC, nombre y código postal no son datos sensibles. Buena práctica: borrar la foto o el PDF de la constancia después de facturar, no pedir la CURP (la factura no la usa) y nunca reenviar la constancia de un cliente a otro.

### La pregunta en el ticket

Si el negocio usa la app de tickets de Anotado.AI (https://anotado.ai/tickets/app/), en Ajustes se enciende «Preguntar si necesita factura», o se suma `f=1` a su liga. Desde ese momento, cada ticket trae este renglón:

```
¿Necesitas factura? Mándanos tu constancia de situación fiscal o tu RFC, nombre, código postal y régimen.
```

Si cobra con otro sistema, el dueño puede poner ese mismo renglón en sus tickets o en su mensaje de despedida. Así el cliente sabe que puede pedirla sin tener que preguntar.

## 4. Cada venta

El dueño te reenvía la constancia del cliente (PDF o foto) o sus datos, y el ticket de la venta. Sigue estos pasos.

### Los datos del cliente

De la constancia sacas cinco cosas:

| Dato | Dónde viene | Cómo se escribe |
|---|---|---|
| RFC | «RFC:» | 12 posiciones si es empresa, 13 si es persona |
| Nombre | «Denominación/Razón Social:» en empresas; nombre y apellidos en personas | En MAYÚSCULAS, tal como viene, con acentos, ñ, números y puntos. En empresas, sin el régimen de capital («S.A. de C.V.»), que viene en otro renglón |
| Código postal | «Código Postal:», en los datos del domicilio | El del domicilio fiscal, no el de su casa ni el de su oficina si son otros |
| Régimen | La tabla «Regímenes» | El que está vigente (sin fecha de fin). Si trae dos o más, pregúntale al cliente con cuál factura |
| Estatus | «Estatus en el padrón:» | Debe decir ACTIVO |

Si la foto no se lee bien, pide otra más clara. Si el cliente mandó sus datos sueltos, úsalos igual; si falta el régimen o el código postal, pídeselos. El cliente puede consultar sus datos en https://www.cloudb.sat.gob.mx/datos_fiscales/ o sacar su constancia en el portal o la app del SAT.

La constancia es cómoda, pero no se puede exigir: para facturar bastan RFC, nombre, código postal y régimen. La constancia no caduca; solo cambia si el cliente cambió algo en el SAT.

### Uso de la factura y pago

| Cliente | Uso |
|---|---|
| Negocio o profesionista que compra para su actividad (régimen 601, 603, 606, 612, 620, 621, 622, 623, 624, 625 o 626) | G03 Gastos en general, o G01 Adquisición de mercancías si compra para revender |
| Persona que solo tiene sueldo (605) o que no tiene actividad (616) | S01 Sin efectos fiscales |

Con 605 o 616 no se acepta G03. Pregúntale al dueño el uso la primera vez; si el cliente pidió otro, usa el que pidió.

| Cómo pagó | Forma de pago | Método |
|---|---|---|
| Efectivo | 01 | PUE |
| Transferencia | 03 | PUE |
| Tarjeta de crédito | 04 | PUE |
| Tarjeta de débito | 28 | PUE |
| Paga después o en partes | 99 Por definir | PPD |

Va la forma en que de verdad le pagaron. Si pagó con dos formas, la de mayor monto.

### Los conceptos y el IVA

Del ticket tomas cada concepto con su cantidad y su importe, y revisas que la suma dé el total. A cada concepto le pones su clave, su unidad y su IVA de la lista del negocio. Si un concepto no está en la lista, pregúntale al dueño cuál es.

Los precios de mostrador ya traen el IVA. Para separarlo: base = precio ÷ 1.16 e IVA = precio − base. Un precio de $99.00 son $85.34 de base y $13.66 de IVA. Cada concepto admite hasta seis decimales y se redondea al final, no antes. Con tasa 0, el IVA es $0.00 y va en la factura como IVA a tasa 0.

En Facturapi el precio se manda con impuestos incluidos (`tax_included: true`, que es lo normal) y la tasa de cada concepto en `taxes`. Si no mandas `taxes`, Facturapi pone IVA de 16%: para pan y pasteles manda la tasa 0 de forma explícita.

### Si el dueño está en RESICO y el cliente es empresa

Si el dueño es persona física en RESICO (régimen 626) y el cliente es persona moral (RFC de 12 posiciones), la empresa le retiene ISR de 1.25% sobre el importe sin IVA, y la factura lleva esa retención (Ley del ISR, art. 113-J). Si la panadería del ejemplo estuviera en RESICO, ESCUELA KEMPER URGATE le retendría $4.40 de ISR sobre $352.00 y le pagaría $347.60. Con otro régimen del dueño, o con un cliente persona física, no hay esta retención.

En Facturapi, a cada concepto se le agrega en `taxes`, junto a su IVA, el impuesto `{ "type": "ISR", "rate": 0.0125, "withholding": true }`. Para que la retención salga sobre el importe sin IVA, en estas facturas manda el precio sin impuestos (`tax_included: false`) con la base que calculaste. La retención no va en el producto del catálogo, porque solo aplica a personas morales: en estas facturas manda cada concepto con sus datos completos en lugar del id del producto. Enséñale la retención al dueño en el resumen, antes de su sí, con el total que de verdad va a recibir.

### Resumen, timbre y entrega

Enséñale al dueño un resumen y espera su sí:

```
Factura para ESCUELA KEMPER URGATE (EKU9003173C9), código postal 26015, régimen 601
Uso G03 Gastos en general · efectivo (01) · PUE
6 × Concha · 50181901 · Pieza · IVA 0% · $72.00
1 × Pastel de tres leches · 50182001 · Pieza · IVA 0% · $280.00
Total $352.00 · IVA $0.00 · ¿La timbro?
```

Si lleva retención de ISR, el resumen la enseña antes de preguntar: «Retención de ISR 1.25% $4.40 · Total a recibir $347.60».

Con su sí, timbra y dale el PDF y el XML. Si el proveedor te los da como ligas de descarga, como Facturapi, avísale al dueño que vencen en una hora: que abra cada liga, baje los dos archivos y se los reenvíe al cliente por WhatsApp como archivos, no la liga. En Claude con un conector propio siempre llegan como ligas, porque ahí Claude no puede pasarle archivos a la app conectada ni guardar los que ella genera. Si se le pasó la hora, pide ligas nuevas de la misma factura; no la timbres otra vez. La app gratuita del propio SAT dice que la factura se comparte por correo o WhatsApp. Si el cliente la quiere por correo, el proveedor se la manda con los dos archivos adjuntos, pero darle el correo es opcional para el cliente.

Hay que hacer la factura dentro de las 24 horas siguientes a la venta. Si el cliente la pide después, igual se le hace: negarla porque no la pidió en el momento es práctica indebida.

### Ejemplo: Panadería San José

El ticket que llegó por WhatsApp:

```
*Panadería San José*
Ticket 0042 · 26 nov 2026, 13:05

6 × Concha: $72.00
1 × Pastel de tres leches: $280.00
*Total: $352.00*
Av. Juárez 120, Puebla

Gracias por tu compra.

¿Necesitas factura? Mándanos tu constancia de situación fiscal o tu RFC, nombre, código postal y régimen.

¿Cómo te atendimos? Cuéntanos en Google Maps:
https://anotado.ai/tickets/ejemplo/
```

La constancia del cliente de ejemplo (datos de prueba) trae RFC EKU9003173C9, denominación ESCUELA KEMPER URGATE, código postal 26015 y régimen 601 General de Ley Personas Morales. Es una empresa que compra para su actividad: uso G03. Pagó en efectivo: forma 01, método PUE. Pan y pastel para llevar: IVA 0%.

El pedido para la API de Facturapi (`POST https://www.facturapi.io/v2/invoices`, con la llave en `Authorization: Bearer`):

```
{
  "customer": {
    "legal_name": "ESCUELA KEMPER URGATE",
    "tax_id": "EKU9003173C9",
    "tax_system": "601",
    "address": { "zip": "26015" }
  },
  "items": [
    {
      "quantity": 6,
      "product": {
        "description": "Concha",
        "product_key": "50181901",
        "unit_key": "H87",
        "unit_name": "Pieza",
        "price": 12,
        "tax_included": true,
        "taxes": [{ "type": "IVA", "rate": 0 }]
      }
    },
    {
      "quantity": 1,
      "product": {
        "description": "Pastel de tres leches",
        "product_key": "50182001",
        "unit_key": "H87",
        "unit_name": "Pieza",
        "price": 280,
        "tax_included": true,
        "taxes": [{ "type": "IVA", "rate": 0 }]
      }
    }
  ],
  "use": "G03",
  "payment_form": "01",
  "payment_method": "PUE",
  "folio_number": 42
}
```

Con el servidor MCP no escribes este pedido a mano: le das esos mismos datos a la función de crear factura. El PDF y el XML se descargan con `GET https://www.facturapi.io/v2/invoices/{id}/pdf` y `/xml`. La ficha del ejemplo, para practicar sin cuentas: https://anotado.ai/factura/ejemplo

## 5. Si la factura rebota

Facturapi revisa los datos del cliente contra el SAT cuando lo registra, así que muchas veces el error sale antes de timbrar. Los rechazos más comunes:

| Código del SAT | Qué pasó | Qué lo arregla |
|---|---|---|
| CFDI40143 | El RFC no está en la lista de RFC inscritos no cancelados | Revisa el RFC letra por letra; si está bien, el cliente revisa su situación en el SAT |
| CFDI40144 y CFDI40145 | El nombre no coincide con el del RFC | Copia el nombre de la constancia en mayúsculas, sin abreviar y, en empresas, sin «S.A. de C.V.» |
| CFDI40147 y CFDI40148 | El código postal no coincide con el del RFC | Usa el código postal del domicilio fiscal de la constancia |
| CFDI40157 y CFDI40158 | El régimen no existe o no corresponde al tipo de persona | Usa el régimen de la constancia: 612 o 626 en personas con negocio, 601 en empresas |
| CFDI40161 | El uso no corresponde al régimen | G03 con régimen de negocio; S01 con 605 o 616 |
| CFDI40105 | Método PPD sin forma de pago 99 | Si paga después, forma 99 y método PPD |

Si los datos no cuadran aunque estén copiados bien, pídele al cliente que revise su constancia o sus datos en el SAT y que mande la constancia actual.

## 6. La factura global

Lo que nadie pidió facturar va en una factura global del día, la semana o el mes (periodicidad 01 diaria, 02 semanal, 03 quincenal o 04 mensual; la 05 bimestral solo para quien venía del régimen 621). Se hace dentro de las 24 horas siguientes al cierre del periodo. Si el dueño la quiere, ármasela:

| Campo | Valor |
|---|---|
| RFC | XAXX010101000 |
| Nombre | PUBLICO EN GENERAL |
| Código postal | El del lugar de expedición (el del local) |
| Régimen | 616 |
| Uso | S01 |
| Clave de producto | 01010101 |
| Unidad | ACT Actividad |

Pídele al dueño el registro completo de ventas del periodo y separa las que ya tienen factura individual. Con las restantes, prepara la global y enséñale el total y los impuestos antes de pedir su sí. Si las ventas ya están registradas como recibos abiertos en Facturapi, usa la función de factura global. Si no, crea la factura de ingreso a PUBLICO EN GENERAL con los datos del periodo y los conceptos correspondientes. No supongas que Facturapi tiene los tickets de WhatsApp.

En Facturapi, la factura a PUBLICO EN GENERAL lleva el objeto `global` con la periodicidad (`day`, `week`, `fortnight`, `month` o `two_months`), el mes y el año, por ejemplo `"global": { "periodicity": "month", "months": "11", "year": 2026 }`. Su documentación lo hace obligatorio. En modo de prueba la timbra sin él, pero el XML sale sin la información global que pide el SAT: mándalo siempre. Cada ticket va como un concepto «Venta» con la clave 01010101, la unidad ACT y el folio del ticket en `sku`, que sale en el XML como número de identificación; si un ticket mezcla tasas de IVA, va un concepto por tasa con el mismo folio. La global desde recibos es del plan de recibos y autofactura, no de la Licencia API.

- La global separa el IVA y, si el negocio lo causa, el IEPS.
- En RESICO de personas físicas va solo el monto total de las operaciones del periodo.
- Las ventas de menos de $100 no necesitan comprobante si el cliente no lo pide, pero entran en la global.

Si un cliente pide su factura después de que su venta entró en la global: se cancela la global con el motivo «04 Operación nominativa relacionada en la factura global», se hace la del cliente y se emite otra vez la global sin esa venta. Con la global mensual, una factura pedida dentro del mes no toca la global.

## 7. Cuando pagan después

Si el cliente paga después o en partes, la factura va con forma 99 y método PPD. Al cobrar, se hace otra factura con el complemento de pagos, uno por cada pago o uno por todos los pagos del mes de ese cliente, a más tardar el quinto día natural del mes siguiente. Facturapi lo emite como complemento de pago.

## 8. Cancelar y corregir

- Si hay un error, se hace la factura buena relacionada con la mala (clave «04 Sustitución de los CFDI previos») y se cancela la mala con el motivo 01 (con errores, con relación).
- Otros motivos: 02 con errores sin relación, 03 la operación no se llevó a cabo, 04 operación nominativa relacionada en la global.
- El cliente tiene tres días para aceptar la cancelación; si no responde, se tiene por aceptada. No necesitan su aceptación las facturas de hasta $1,000, las globales y las que se cancelan dentro del día hábil siguiente.
- Plazo: hasta el mes en que se presenta la declaración anual del año en que se emitió; para personas físicas, abril del año siguiente.
- Quien cancela tiene que poder justificar el motivo con documentos.

## 9. Lo que nunca haces

- Condicionar la factura a la constancia. Es infracción (Código Fiscal, art. 83, fr. IX), con multa de $21,420 a $122,440. Bastan RFC, nombre, código postal y régimen.
- Exigir datos que la factura no lleva, como la CURP, ni hacer obligatorio el correo.
- Cobrar más por facturar, negar la factura porque pagó en efectivo o porque no la pidió en el momento, u obligar al cliente a facturar en un portal.
- Poner una forma de pago distinta a la que se recibió.
- Reenviar la constancia de un cliente a otro.
- Timbrar sin el sí del dueño o sin decirle si es prueba o producción.
- Hacer un PDF o un XML con forma de factura que no timbró el proveedor o el SAT.

## 10. Lo que suele preguntar el dueño

**¿Reviso la factura antes de que se timbre?**
Sí: siempre le enseñas el resumen (cliente, conceptos, total, IVA, uso y forma de pago) y esperas su sí.

**¿Mi sello digital se queda con el proveedor?**
Sí, para timbrar a su nombre el proveedor guarda el .cer, el .key y la contraseña del sello. La e.firma se usa en el alta para firmar la Carta Manifiesto que lo autoriza a timbrar; para timbrar no la necesita. Si cambia de proveedor, borra el sello del anterior; si quiere que ya no pueda timbrar, saca un sello nuevo con su e.firma y revoca el anterior en CertiSAT Web.

**¿Tengo que pedirle la constancia al cliente?**
No. Sirve porque trae todo junto, pero bastan RFC, nombre, código postal y régimen; condicionar la factura a la constancia es infracción.

## 11. Para quien programa

El código está en `https://github.com/Anotado-AI/tickets-whatsapp`, carpeta `factura`, con sus pruebas de Node:

- `piezas/rfc.mjs`: revisa el RFC y su dígito verificador.
- `piezas/constancia.mjs`: saca RFC, nombre, código postal y régimen del texto de una constancia.
- `piezas/ticket.mjs`: lee los conceptos y el total del ticket de WhatsApp.
- `piezas/iva.mjs`: separa la base y el IVA de un precio que ya los trae, sin perder un centavo.
- `piezas/pedido.mjs`: arma y revisa el pedido para Facturapi antes de mandarlo, con la retención de ISR de RESICO, y arma la factura global.
- `script/facturar.mjs`: factura por API con la llave del dueño, para meterlo en su sistema o en su agente de WhatsApp.

```
FACTURAPI_KEY=sk_test_... node factura/script/facturar.mjs --ticket ticket.txt --constancia constancia.pdf --productos productos.json --forma 01 --uso G03
```

Con `--revisar` solo enseña el pedido. El script lee de Facturapi el RFC y el régimen del dueño: si es persona física en RESICO y el cliente es persona moral, agrega la retención de ISR y dice cuánto va a recibir. La factura global de los tickets que nadie pidió facturar, con un archivo de texto por ticket:

```
FACTURAPI_KEY=sk_test_... node factura/script/facturar.mjs --global --tickets tickets/ --productos productos.json --periodicidad mensual --mes 11 --anio 2026 --forma 01
```

El script nunca escribe la llave en pantalla.

## Lo que viene

El próximo viernes te enseño a cobrar por WhatsApp con una liga de pago y a facturar en cuanto te pagan. Para recibirlo, suscríbete gratis en https://anotado.ai/suscribirse

## Fuentes

- Qué basta para facturar y la constancia: SAT, Comunicado 04-2026, https://www.gob.mx/sat/prensa/aclara-sat-que-constancia-de-situacion-fiscal-no-es-requisito-para-emitir-factura-04-2026
- Prácticas indebidas: https://www.sat.gob.mx/minisitio/Factura/solicita_consideraciones.htm
- Requisitos y plazos: Código Fiscal de la Federación, arts. 29, 29-A, 83 y 84, https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf; Reglamento, art. 39, https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_CFF.pdf
- Cómo se llena cada campo: Guía de llenado del Anexo 20, http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Anexo_20_Guia_de_llenado_CFDI.pdf
- Cómo se escribe el nombre: http://omawww.sat.gob.mx/factura/Paginas/documentos/Infografia_FacturaElectronica_NombreReceptor.pdf
- Catálogos del CFDI 4.0 (20-nov-2026): http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/catCFDI_V_4_20261120.xls
- Rechazos: matriz de errores del CFDI 4.0, http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/MatrizDeErrores_CFDI_v40_20260325.xls
- Factura global: Guía de llenado del CFDI global, http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Guia_llenado_CFDI_global.pdf
- Cancelación: https://www.sat.gob.mx/minisitio/Factura/documentos/PreguntasFrecuentes_CancelacionFactura25082026.pdf
- IVA: Ley del IVA, https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf, y su Reglamento, art. 10-A, https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LIVA_250914.pdf
- IEPS: https://www.diputados.gob.mx/LeyesBiblio/pdf/LIEPS.pdf
- Retención de ISR en RESICO: Ley del ISR, art. 113-J, https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf
- Carta Manifiesto y e.firma en Facturapi: https://docs.facturapi.io/docs/getting-started/organization-onboarding/
- Datos personales: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf
- Facturapi MCP: https://docs.facturapi.io/docs/guides/mcp-server/; API: https://docs.facturapi.io/api/; precios: https://www.facturapi.io/pricing
- Conectores de Claude: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- Servidores MCP en ChatGPT: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt-beta
- Factura SAT Móvil: https://wwwmat.sat.gob.mx/consultas/81393/factura-sat-movil

// Catálogos del SAT para la factura 4.0 que usan las piezas. Se generan desde el archivo oficial
// de catálogos del Anexo 20 (catCFDI_V_4_20261120.xls, leído el 2026-11-25); no se editan a mano.

/** c_RegimenFiscal: clave, nombre y si aplica a persona física o moral. */
export const REGIMENES = [
  { clave: "601", nombre: "General de Ley Personas Morales", fisica: false, moral: true },
  { clave: "603", nombre: "Personas Morales con Fines no Lucrativos", fisica: false, moral: true },
  { clave: "605", nombre: "Sueldos y Salarios e Ingresos Asimilados a Salarios", fisica: true, moral: false },
  { clave: "606", nombre: "Arrendamiento", fisica: true, moral: false },
  { clave: "607", nombre: "Régimen de Enajenación o Adquisición de Bienes", fisica: true, moral: false },
  { clave: "608", nombre: "Demás ingresos", fisica: true, moral: false },
  { clave: "610", nombre: "Residentes en el Extranjero sin Establecimiento Permanente en México", fisica: true, moral: true },
  { clave: "611", nombre: "Ingresos por Dividendos (socios y accionistas)", fisica: true, moral: false },
  { clave: "612", nombre: "Personas Físicas con Actividades Empresariales y Profesionales", fisica: true, moral: false },
  { clave: "614", nombre: "Ingresos por intereses", fisica: true, moral: false },
  { clave: "615", nombre: "Régimen de los ingresos por obtención de premios", fisica: true, moral: false },
  { clave: "616", nombre: "Sin obligaciones fiscales", fisica: true, moral: false },
  { clave: "620", nombre: "Sociedades Cooperativas de Producción que optan por diferir sus ingresos", fisica: false, moral: true },
  { clave: "621", nombre: "Incorporación Fiscal", fisica: true, moral: false },
  { clave: "622", nombre: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras", fisica: false, moral: true },
  { clave: "623", nombre: "Opcional para Grupos de Sociedades", fisica: false, moral: true },
  { clave: "624", nombre: "Coordinados", fisica: false, moral: true },
  { clave: "625", nombre: "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas", fisica: true, moral: false },
  { clave: "626", nombre: "Régimen Simplificado de Confianza", fisica: true, moral: true },
];

/** c_UsoCFDI: clave, nombre, a quién aplica y con qué regímenes del cliente se permite. */
export const USOS = [
  { clave: "G01", nombre: "Adquisición de mercancías", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "G02", nombre: "Devoluciones, descuentos o bonificaciones", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "616", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "G03", nombre: "Gastos en general", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I01", nombre: "Construcciones", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I02", nombre: "Mobiliario y equipo de oficina por inversiones", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I03", nombre: "Equipo de transporte", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I04", nombre: "Equipo de computo y accesorios", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I05", nombre: "Dados, troqueles, moldes, matrices y herramental", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I06", nombre: "Comunicaciones telefónicas", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I07", nombre: "Comunicaciones satelitales", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "I08", nombre: "Otra maquinaria y equipo", fisica: true, moral: true, regimenes: ["601", "603", "606", "612", "620", "621", "622", "623", "624", "625", "626"] },
  { clave: "D01", nombre: "Honorarios médicos, dentales y gastos hospitalarios", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D02", nombre: "Gastos médicos por incapacidad o discapacidad", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D03", nombre: "Gastos funerales", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D04", nombre: "Donativos", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D05", nombre: "Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D06", nombre: "Aportaciones voluntarias al SAR", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D07", nombre: "Primas por seguros de gastos médicos", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D08", nombre: "Gastos de transportación escolar obligatoria", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D09", nombre: "Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "D10", nombre: "Pagos por servicios educativos (colegiaturas)", fisica: true, moral: false, regimenes: ["605", "606", "608", "611", "612", "614", "607", "615", "625"] },
  { clave: "S01", nombre: "Sin efectos fiscales", fisica: true, moral: true, regimenes: ["601", "603", "605", "606", "608", "610", "611", "612", "614", "616", "620", "621", "622", "623", "624", "607", "615", "625", "626"] },
  { clave: "CP01", nombre: "Pagos", fisica: true, moral: true, regimenes: ["601", "603", "605", "606", "608", "610", "611", "612", "614", "616", "620", "621", "622", "623", "624", "607", "615", "625", "626"] },
  { clave: "CN01", nombre: "Nómina", fisica: true, moral: false, regimenes: ["605"] },
];

/** c_FormaPago */
export const FORMAS_PAGO = [
  { clave: "01", nombre: "Efectivo" },
  { clave: "02", nombre: "Cheque nominativo" },
  { clave: "03", nombre: "Transferencia electrónica de fondos" },
  { clave: "04", nombre: "Tarjeta de crédito" },
  { clave: "05", nombre: "Monedero electrónico" },
  { clave: "06", nombre: "Dinero electrónico" },
  { clave: "08", nombre: "Vales de despensa" },
  { clave: "12", nombre: "Dación en pago" },
  { clave: "13", nombre: "Pago por subrogación" },
  { clave: "14", nombre: "Pago por consignación" },
  { clave: "15", nombre: "Condonación" },
  { clave: "17", nombre: "Compensación" },
  { clave: "23", nombre: "Novación" },
  { clave: "24", nombre: "Confusión" },
  { clave: "25", nombre: "Remisión de deuda" },
  { clave: "26", nombre: "Prescripción o caducidad" },
  { clave: "27", nombre: "A satisfacción del acreedor" },
  { clave: "28", nombre: "Tarjeta de débito" },
  { clave: "29", nombre: "Tarjeta de servicios" },
  { clave: "30", nombre: "Aplicación de anticipos" },
  { clave: "31", nombre: "Intermediario pagos" },
  { clave: "99", nombre: "Por definir" },
];

/** c_MetodoPago */
export const METODOS_PAGO = [
  { clave: "PUE", nombre: "Pago en una sola exhibición" },
  { clave: "PPD", nombre: "Pago en parcialidades o diferido" },
];

/** Unidades más usadas en un mostrador (c_ClaveUnidad). */
export const UNIDADES = [
  { clave: "H87", nombre: "Pieza" },
  { clave: "KGM", nombre: "Kilogramo" },
  { clave: "E48", nombre: "Unidad de servicio" },
  { clave: "ACT", nombre: "Actividad" },
  { clave: "XBX", nombre: "Caja" },
  { clave: "LTR", nombre: "Litro" },
];

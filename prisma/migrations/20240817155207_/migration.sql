-- CreateEnum
CREATE TYPE "NotifierName" AS ENUM ('DOS91', 'DOS92');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Terminados', 'LiosJuridicos', 'Bancolombia', 'Reintegra', 'Insolvencia', 'SinEspecificar', 'todos');

-- CreateEnum
CREATE TYPE "Departamento" AS ENUM ('BOGOTA', 'CUNDINAMARCA', 'META', 'ANTIOQUIA', 'ATLANTICO');

-- CreateEnum
CREATE TYPE "TipoProceso" AS ENUM ('HIPOTECARIO', 'PRENDARIO', 'SINGULAR', 'ACUMULADO');

-- CreateTable
CREATE TABLE "Carpeta" (
    "id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3),
    "idProcesos" INTEGER[],
    "idRegUltimaAct" INTEGER,
    "llaveProceso" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "terminado" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SinEspecificar',
    "tipoProceso" TEXT NOT NULL DEFAULT 'SINGULAR',
    "notasCount" INTEGER,
    "fechaUltimaRevision" DATE,
    "ciudad" TEXT,
    "juzgadoTipo" TEXT,
    "juzgadoId" TEXT,

    CONSTRAINT "Carpeta_pkey" PRIMARY KEY ("numero")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "facturaElectronica" TEXT,
    "secondaryFactura" JSONB,
    "ciudad" TEXT NOT NULL,
    "dv" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "direccion" TEXT NOT NULL,
    "valorBase" MONEY NOT NULL,
    "hasOtroImp" BOOLEAN NOT NULL DEFAULT false,
    "hasIva" BOOLEAN NOT NULL DEFAULT false,
    "hasIcui" BOOLEAN NOT NULL DEFAULT false,
    "hasImpoConsumo" BOOLEAN NOT NULL DEFAULT false,
    "nit" INTEGER NOT NULL,
    "valorIva" MONEY,
    "valorOtroImp" MONEY,
    "valorTotal" MONEY NOT NULL,
    "concepto" TEXT NOT NULL,
    "carpetaNumero" INTEGER,
    "CUFE" TEXT,
    "QRCode" TEXT,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmisorDeFactura" (
    "nit" INTEGER NOT NULL,
    "dv" INTEGER NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "direccion" TEXT,
    "correo" TEXT,
    "telefono" INTEGER,
    "actividadEconomica" TEXT,
    "regimenFiscal" TEXT,
    "responsabilidadTributaria" TEXT,
    "tipoContribuyente" TEXT NOT NULL DEFAULT 'Juridica',
    "ciudad" TEXT NOT NULL DEFAULT 'Bogota',

    CONSTRAINT "EmisorDeFactura_pkey" PRIMARY KEY ("nit")
);

-- CreateTable
CREATE TABLE "Deudor" (
    "carpetaNumero" INTEGER NOT NULL,
    "cedula" TEXT NOT NULL,
    "direccion" TEXT,
    "email" TEXT,
    "id" INTEGER NOT NULL,
    "primerApellido" TEXT NOT NULL,
    "primerNombre" TEXT NOT NULL,
    "segundoApellido" TEXT,
    "segundoNombre" TEXT,
    "telCelular" TEXT,
    "telFijo" TEXT,

    CONSTRAINT "Deudor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Codeudor" (
    "carpetaNumero" INTEGER NOT NULL,
    "cedula" TEXT,
    "direccion" TEXT,
    "id" INTEGER NOT NULL,
    "nombre" TEXT,
    "telefono" TEXT,

    CONSTRAINT "Codeudor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demanda" (
    "carpetaNumero" INTEGER NOT NULL,
    "departamento" TEXT,
    "despacho" TEXT,
    "entregaGarantiasAbogado" DATE,
    "etapaProcesal" TEXT,
    "llaveProceso" TEXT,
    "fechaPresentacion" DATE[],
    "id" INTEGER NOT NULL,
    "tipoProceso" TEXT NOT NULL,
    "municipio" TEXT,
    "obligacion" TEXT[],
    "radicado" TEXT,
    "vencimientoPagare" DATE[],
    "capitalAdeudado" MONEY NOT NULL DEFAULT 0,
    "mandamientoPago" DATE[],
    "avaluo" MONEY NOT NULL DEFAULT 0,
    "liquidacion" MONEY NOT NULL DEFAULT 0,

    CONSTRAINT "Demanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "demandaId" INTEGER NOT NULL,
    "certimail" BOOLEAN,
    "fisico" BOOLEAN,
    "id" INTEGER NOT NULL,
    "autoNotificado" DATE,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedidasCautelares" (
    "demandaId" INTEGER NOT NULL,
    "fechaOrdenaMedida" TIMESTAMP(3),
    "id" INTEGER NOT NULL,
    "medidaSolicitada" TEXT,

    CONSTRAINT "MedidasCautelares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifier" (
    "fechaAporta" TIMESTAMP(3),
    "fechaRecibido" TIMESTAMP(3),
    "notificacionId" INTEGER NOT NULL,
    "resultado" BOOLEAN,
    "tipo" TEXT NOT NULL,
    "carpetaNumero" INTEGER NOT NULL,

    CONSTRAINT "Notifier_pkey" PRIMARY KEY ("tipo","carpetaNumero")
);

-- CreateTable
CREATE TABLE "Nota" (
    "carpetaNumero" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "pathname" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" DATE,
    "text" TEXT NOT NULL,
    "content" TEXT[],

    CONSTRAINT "Nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "carpetaNumero" INTEGER,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATE NOT NULL,
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT[],

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actuacion" (
    "actuacion" TEXT NOT NULL,
    "anotacion" TEXT,
    "cant" INTEGER NOT NULL,
    "carpetaNumero" INTEGER,
    "codRegla" TEXT NOT NULL,
    "conDocumentos" BOOLEAN NOT NULL,
    "consActuacion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActuacion" DATE NOT NULL,
    "fechaFinal" DATE,
    "fechaInicial" DATE,
    "fechaRegistro" DATE NOT NULL,
    "idProceso" INTEGER NOT NULL,
    "idRegActuacion" INTEGER NOT NULL,
    "isUltimaAct" BOOLEAN NOT NULL,
    "llaveProceso" TEXT NOT NULL,
    "procesoId" INTEGER,

    CONSTRAINT "Actuacion_pkey" PRIMARY KEY ("idRegActuacion")
);

-- CreateTable
CREATE TABLE "Juzgado" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Juzgado_pkey" PRIMARY KEY ("id","tipo","ciudad")
);

-- CreateTable
CREATE TABLE "Proceso" (
    "id" SERIAL NOT NULL,
    "cantFilas" INTEGER NOT NULL,
    "carpetaNumero" INTEGER NOT NULL,
    "departamento" TEXT NOT NULL,
    "despacho" TEXT NOT NULL,
    "esPrivado" BOOLEAN NOT NULL,
    "fechaProceso" DATE,
    "fechaUltimaActuacion" DATE,
    "idConexion" INTEGER NOT NULL,
    "idProceso" INTEGER NOT NULL,
    "juzgadoTipo" TEXT NOT NULL,
    "llaveProceso" TEXT NOT NULL,
    "sujetosProcesales" TEXT NOT NULL,
    "juzgadoId" TEXT NOT NULL,
    "juzgadoCiudad" TEXT NOT NULL,

    CONSTRAINT "Proceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deudor_carpetaNumero_key" ON "Deudor"("carpetaNumero");

-- CreateIndex
CREATE UNIQUE INDEX "Codeudor_carpetaNumero_key" ON "Codeudor"("carpetaNumero");

-- CreateIndex
CREATE UNIQUE INDEX "Demanda_carpetaNumero_key" ON "Demanda"("carpetaNumero");

-- CreateIndex
CREATE UNIQUE INDEX "Notificacion_demandaId_key" ON "Notificacion"("demandaId");

-- CreateIndex
CREATE UNIQUE INDEX "MedidasCautelares_demandaId_key" ON "MedidasCautelares"("demandaId");

-- CreateIndex
CREATE UNIQUE INDEX "Proceso_idProceso_key" ON "Proceso"("idProceso");

-- AddForeignKey
ALTER TABLE "Carpeta" ADD CONSTRAINT "Carpeta_idRegUltimaAct_fkey" FOREIGN KEY ("idRegUltimaAct") REFERENCES "Actuacion"("idRegActuacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carpeta" ADD CONSTRAINT "Carpeta_juzgadoId_juzgadoTipo_ciudad_fkey" FOREIGN KEY ("juzgadoId", "juzgadoTipo", "ciudad") REFERENCES "Juzgado"("id", "tipo", "ciudad") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_carpetaNumero_fkey" FOREIGN KEY ("carpetaNumero") REFERENCES "Carpeta"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_nit_fkey" FOREIGN KEY ("nit") REFERENCES "EmisorDeFactura"("nit") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deudor" ADD CONSTRAINT "Deudor_carpetaNumero_fkey" FOREIGN KEY ("carpetaNumero") REFERENCES "Carpeta"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Codeudor" ADD CONSTRAINT "Codeudor_carpetaNumero_fkey" FOREIGN KEY ("carpetaNumero") REFERENCES "Carpeta"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_carpetaNumero_fkey" FOREIGN KEY ("carpetaNumero") REFERENCES "Carpeta"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedidasCautelares" ADD CONSTRAINT "MedidasCautelares_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifier" ADD CONSTRAINT "Notifier_notificacionId_fkey" FOREIGN KEY ("notificacionId") REFERENCES "Notificacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nota" ADD CONSTRAINT "Nota_carpetaNumero_fkey" FOREIGN KEY ("carpetaNumero") REFERENCES "Carpeta"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_carpetaNumero_fkey" FOREIGN KEY ("carpetaNumero") REFERENCES "Carpeta"("numero") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actuacion" ADD CONSTRAINT "Actuacion_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso"("idProceso") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proceso" ADD CONSTRAINT "Proceso_carpetaNumero_fkey" FOREIGN KEY ("carpetaNumero") REFERENCES "Carpeta"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proceso" ADD CONSTRAINT "Proceso_juzgadoId_juzgadoTipo_juzgadoCiudad_fkey" FOREIGN KEY ("juzgadoId", "juzgadoTipo", "juzgadoCiudad") REFERENCES "Juzgado"("id", "tipo", "ciudad") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - The primary key for the `Actuacion` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."Carpeta" DROP CONSTRAINT "Carpeta_idRegUltimaAct_fkey";

-- AlterTable
ALTER TABLE "public"."Actuacion" DROP CONSTRAINT "Actuacion_pkey",
ALTER COLUMN "idRegActuacion" SET DATA TYPE TEXT,
ADD CONSTRAINT "Actuacion_pkey" PRIMARY KEY ("idRegActuacion");

-- AlterTable
ALTER TABLE "public"."Carpeta" ALTER COLUMN "idRegUltimaAct" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "public"."Carpeta" ADD CONSTRAINT "Carpeta_idRegUltimaAct_fkey" FOREIGN KEY ("idRegUltimaAct") REFERENCES "public"."Actuacion"("idRegActuacion") ON DELETE SET NULL ON UPDATE CASCADE;

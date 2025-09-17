/*
  Warnings:

  - The primary key for the `Actuacion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `idRegUltimaAct` column on the `Carpeta` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `idProceso` on the `Actuacion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `idRegActuacion` on the `Actuacion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Carpeta" DROP CONSTRAINT "Carpeta_idRegUltimaAct_fkey";

-- AlterTable
ALTER TABLE "public"."Actuacion" DROP CONSTRAINT "Actuacion_pkey",
DROP COLUMN "idProceso",
ADD COLUMN     "idProceso" INTEGER NOT NULL,
DROP COLUMN "idRegActuacion",
ADD COLUMN     "idRegActuacion" INTEGER NOT NULL,
ADD CONSTRAINT "Actuacion_pkey" PRIMARY KEY ("idRegActuacion");

-- AlterTable
ALTER TABLE "public"."Carpeta" DROP COLUMN "idRegUltimaAct",
ADD COLUMN     "idRegUltimaAct" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Carpeta" ADD CONSTRAINT "Carpeta_idRegUltimaAct_fkey" FOREIGN KEY ("idRegUltimaAct") REFERENCES "public"."Actuacion"("idRegActuacion") ON DELETE SET NULL ON UPDATE CASCADE;

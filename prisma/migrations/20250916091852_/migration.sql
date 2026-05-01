/*
  Warnings:

  - Made the column `procesoId` on table `Actuacion` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Actuacion" DROP CONSTRAINT "Actuacion_procesoId_fkey";

-- AlterTable
ALTER TABLE "public"."Actuacion" ALTER COLUMN "procesoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Actuacion" ADD CONSTRAINT "Actuacion_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "public"."Proceso"("idProceso") ON DELETE RESTRICT ON UPDATE CASCADE;
